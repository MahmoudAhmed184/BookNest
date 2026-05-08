# Generated manually to repair schemas migrated before the custom user table rename.

from django.db import migrations


USER_FK_TARGETS = (
    ("account_emailaddress", "user_id", "account_email_user_users_user_fk", "CASCADE"),
    ("token_blacklist_outstandingtoken", "user_id", "outstandingtoken_user_users_user_fk", "SET NULL"),
    ("users_profile", "user_id", "users_profile_user_users_user_fk", "CASCADE"),
    ("notifications_notification", "recipient_id", "notifications_recipient_users_user_fk", "CASCADE"),
    ("authtoken_token", "user_id", "authtoken_token_user_users_user_fk", "CASCADE"),
    ("django_admin_log", "user_id", "django_admin_log_user_users_user_fk", "CASCADE"),
    ("socialaccount_socialaccount", "user_id", "socialaccount_user_users_user_fk", "CASCADE"),
)


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


def _column_foreign_keys(cursor, table_name, column_name):
    cursor.execute(
        """
        SELECT constraint_name, referenced_table_name
        FROM information_schema.key_column_usage
        WHERE table_schema = DATABASE()
          AND table_name = %s
          AND column_name = %s
          AND referenced_table_name IS NOT NULL
        """,
        [table_name, column_name],
    )
    return cursor.fetchall()


def _has_invalid_user_rows(cursor, table_name, column_name):
    cursor.execute(
        f"""
        SELECT COUNT(*)
        FROM {table_name} target
        LEFT JOIN users_user user_table
          ON target.{column_name} = user_table.id
        WHERE target.{column_name} IS NOT NULL
          AND user_table.id IS NULL
        """
    )
    return cursor.fetchone()[0] > 0


def retarget_legacy_user_foreign_keys(apps, schema_editor):
    connection = schema_editor.connection
    if connection.vendor != "mysql":
        return

    with connection.cursor() as cursor:
        if not _table_exists(cursor, "users_user"):
            return

        for table_name, column_name, new_constraint_name, on_delete_sql in USER_FK_TARGETS:
            if not _table_exists(cursor, table_name):
                continue

            foreign_keys = _column_foreign_keys(cursor, table_name, column_name)
            if any(referenced_table == "users_user" for _, referenced_table in foreign_keys):
                continue

            table_sql = _quote(connection, table_name)
            column_sql = _quote(connection, column_name)

            for constraint_name, referenced_table in foreign_keys:
                if referenced_table == "users_customuser":
                    cursor.execute(
                        f"ALTER TABLE {table_sql} DROP FOREIGN KEY {_quote(connection, constraint_name)}"
                    )

            if _has_invalid_user_rows(cursor, table_sql, column_sql):
                continue

            cursor.execute(
                f"""
                ALTER TABLE {table_sql}
                ADD CONSTRAINT {_quote(connection, new_constraint_name)}
                FOREIGN KEY ({column_sql}) REFERENCES {_quote(connection, "users_user")} ({_quote(connection, "id")})
                ON DELETE {on_delete_sql}
                """
            )


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
        ("account", "0009_emailaddress_unique_primary_email"),
        ("token_blacklist", "0013_alter_blacklistedtoken_options_and_more"),
        ("authtoken", "0004_alter_tokenproxy_options"),
        ("admin", "0003_logentry_add_action_flag_choices"),
        ("socialaccount", "0006_alter_socialaccount_extra_data"),
        ("notifications", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(
            retarget_legacy_user_foreign_keys,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
