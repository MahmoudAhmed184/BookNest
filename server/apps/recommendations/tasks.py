from celery import shared_task

from apps.operations.models import TaskLog
from apps.recommendations.models import RecommendationRun


@shared_task(name="apps.recommendations.tasks.generate_recommendations")
def generate_recommendations(run_id: int) -> int:
    run = RecommendationRun.objects.select_related("task_log").get(pk=run_id)
    run.status = RecommendationRun.Status.SUCCESS
    run.save(update_fields=["status", "updated_at"])
    if run.task_log_id:
        run.task_log.status = TaskLog.Status.SUCCESS
        run.task_log.save(update_fields=["status", "updated_at"])
    return run.id
