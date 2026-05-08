# Generated manually to repair schemas migrated before the enhanced Profile model.

from django.db import migrations


LEGACY_PROFILE_COLUMNS = ("settings", "profile_pic")


def _quote(connection, name):
    return connection.ops.quote_name(name)


def _table_exists(cursor, table_name):
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = %s
        """,
        [table_name],
    )
    return cursor.fetchone()[0] > 0


def _column_exists(cursor, table_name, column_name):
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = %s
          AND column_name = %s
        """,
        [table_name, column_name],
    )
    return cursor.fetchone()[0] > 0


def drop_legacy_profile_columns(apps, schema_editor):
    connection = schema_editor.connection
    if connection.vendor != "mysql":
        return

    table_name = "users_profile"
    with connection.cursor() as cursor:
        if not _table_exists(cursor, table_name):
            return

        table_sql = _quote(connection, table_name)
        if _column_exists(cursor, table_name, "profile_pic") and _column_exists(cursor, table_name, "picture"):
            cursor.execute(
                f"""
                UPDATE {table_sql}
                SET {_quote(connection, "picture")} = {_quote(connection, "profile_pic")}
                WHERE ({_quote(connection, "picture")} IS NULL OR {_quote(connection, "picture")} = '')
                  AND {_quote(connection, "profile_pic")} IS NOT NULL
                  AND {_quote(connection, "profile_pic")} != ''
                """
            )

        for column_name in LEGACY_PROFILE_COLUMNS:
            if _column_exists(cursor, table_name, column_name):
                cursor.execute(
                    f"ALTER TABLE {table_sql} DROP COLUMN {_quote(connection, column_name)}"
                )


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_retarget_legacy_user_refs"),
    ]

    operations = [
        migrations.RunPython(
            drop_legacy_profile_columns,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
