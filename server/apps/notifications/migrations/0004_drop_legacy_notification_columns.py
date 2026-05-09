# Generated manually to repair databases that still have the pre-DRF notification schema.

from __future__ import annotations

from django.db import migrations, models
from django.utils import timezone


LEGACY_COLUMNS = (
    "verb",
    "data",
    "read",
    "timestamp",
    "action_object_id",
    "notification_type_id",
)


def _quote(connection, name: str) -> str:
    return connection.ops.quote_name(name)


def _table_exists(connection, table_name: str) -> bool:
    with connection.cursor() as cursor:
        return table_name in connection.introspection.table_names(cursor)


def _column_exists(connection, table_name: str, column_name: str) -> bool:
    with connection.cursor() as cursor:
        columns = {
            column.name
            for column in connection.introspection.get_table_description(cursor, table_name)
        }
    return column_name in columns


def _mysql_foreign_keys_for_column(connection, table_name: str, column_name: str) -> list[str]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = %s
              AND COLUMN_NAME = %s
              AND REFERENCED_TABLE_NAME IS NOT NULL
            """,
            [table_name, column_name],
        )
        return [row[0] for row in cursor.fetchall()]


def _drop_legacy_notification_columns(apps, schema_editor) -> None:
    connection = schema_editor.connection
    table_name = "notifications_notification"

    if not _table_exists(connection, table_name):
        return

    with connection.cursor() as cursor:
        if connection.vendor == "mysql":
            for column_name in LEGACY_COLUMNS:
                if not _column_exists(connection, table_name, column_name):
                    continue

                for constraint_name in _mysql_foreign_keys_for_column(connection, table_name, column_name):
                    cursor.execute(
                        f"ALTER TABLE {_quote(connection, table_name)} "
                        f"DROP FOREIGN KEY {_quote(connection, constraint_name)}"
                    )

                cursor.execute(
                    f"ALTER TABLE {_quote(connection, table_name)} "
                    f"DROP COLUMN {_quote(connection, column_name)}"
                )
            return

        for column_name in LEGACY_COLUMNS:
            if _column_exists(connection, table_name, column_name):
                cursor.execute(
                    f"ALTER TABLE {_quote(connection, table_name)} "
                    f"DROP COLUMN {_quote(connection, column_name)}"
                )


def _backfill_follow_notifications(apps, schema_editor) -> None:
    Notification = apps.get_model("notifications", "Notification")
    FollowRelationship = apps.get_model("social", "FollowRelationship")
    UserPreference = apps.get_model("users", "UserPreference")
    ContentType = apps.get_model("contenttypes", "ContentType")

    user_content_type, _ = ContentType.objects.get_or_create(app_label="users", model="user")
    follow_content_type, _ = ContentType.objects.get_or_create(
        app_label="social",
        model="followrelationship",
    )
    disabled_user_ids = set(
        UserPreference.objects.filter(
            in_app_notifications_enabled=False,
        ).values_list("user_id", flat=True)
    ) | set(
        UserPreference.objects.filter(
            notify_on_follow=False,
        ).values_list("user_id", flat=True)
    )
    now = timezone.now()
    notifications = []

    relationships = FollowRelationship.objects.exclude(
        follower_id=models.F("following_id"),
    ).iterator()
    for relationship in relationships:
        if relationship.following_id in disabled_user_ids:
            continue

        exists = Notification.objects.filter(
            recipient_id=relationship.following_id,
            action="followed",
            action_object_content_type_id=follow_content_type.id,
            action_object_object_id=relationship.id,
        ).exists()
        if exists:
            continue

        notifications.append(
            Notification(
                recipient_id=relationship.following_id,
                actor_content_type_id=user_content_type.id,
                actor_object_id=relationship.follower_id,
                target_content_type_id=user_content_type.id,
                target_object_id=relationship.following_id,
                action_object_content_type_id=follow_content_type.id,
                action_object_object_id=relationship.id,
                notification_type="social",
                action="followed",
                payload={"follower_id": relationship.follower_id},
                is_read=False,
                is_deleted=False,
                created_at=now,
                updated_at=now,
            )
        )

    if notifications:
        Notification.objects.bulk_create(notifications, batch_size=500)


class Migration(migrations.Migration):

    dependencies = [
        ("contenttypes", "0002_remove_content_type_name"),
        ("notifications", "0003_alter_notification_action"),
        ("social", "0002_initial"),
        ("users", "0003_drop_legacy_profile_columns"),
    ]

    operations = [
        migrations.RunPython(_drop_legacy_notification_columns, migrations.RunPython.noop),
        migrations.RunPython(_backfill_follow_notifications, migrations.RunPython.noop),
    ]
