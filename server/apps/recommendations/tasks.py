from __future__ import annotations

import logging
import socket
import uuid
from typing import Any
from urllib.parse import urlparse

from celery import shared_task
from django.conf import settings

from apps.operations.models import TaskLog
from apps.recommendations import services
from apps.recommendations.models import RecommendationRun

logger = logging.getLogger(__name__)


def celery_broker_is_reachable(*, timeout: float = 0.2) -> bool:
    broker_url = getattr(settings, "CELERY_BROKER_URL", "")
    parsed_url = urlparse(broker_url)
    if parsed_url.scheme not in {"redis", "rediss"}:
        return True

    host = parsed_url.hostname or "localhost"
    port = parsed_url.port or 6379
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def task_type_for_run(run: RecommendationRun) -> str:
    if run.run_type == RecommendationRun.RunType.TRAIN:
        return TaskLog.TaskType.RECOMMENDATION_TRAINING
    return TaskLog.TaskType.RECOMMENDATION_GENERATION


@shared_task(name="apps.recommendations.tasks.generate_recommendations")
def generate_recommendations(run_id: int) -> int:
    run = RecommendationRun.objects.select_related("task_log", "model").get(pk=run_id)
    return services.execute_recommendation_run(run=run)


def ensure_task_log(*, run: RecommendationRun, task_id: str) -> TaskLog:
    if run.task_log_id:
        task_log = run.task_log
        if task_log is None:
            task_log = TaskLog.objects.get(pk=run.task_log_id)
        task_log.task_id = task_id
        task_log.task_type = task_type_for_run(run)
        task_log.status = TaskLog.Status.PENDING
        task_log.save(update_fields=["task_id", "task_type", "status", "updated_at"])
        return task_log

    task_log = TaskLog.objects.create(
        task_id=task_id,
        task_type=task_type_for_run(run),
        status=TaskLog.Status.PENDING,
    )
    run.task_log = task_log
    run.save(update_fields=["task_log", "updated_at"])
    return task_log


def enqueue_recommendation_run(*, run: RecommendationRun) -> Any:
    if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False) or celery_broker_is_reachable():
        task_id = str(uuid.uuid4())
        ensure_task_log(run=run, task_id=task_id)
        task = generate_recommendations.apply_async(args=[run.id], task_id=task_id, retry=False)
        return task

    task_id = f"recommendation-run-{run.id}-sync"
    ensure_task_log(run=run, task_id=task_id)
    logger.info("Celery broker is not reachable; executing recommendation run %s synchronously.", run.id)
    services.execute_recommendation_run(run=run)
    return None
