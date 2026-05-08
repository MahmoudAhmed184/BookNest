# Generated manually for notification action additions.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0002_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="action",
            field=models.CharField(
                choices=[
                    ("followed", "Followed"),
                    ("rated_book", "Rated book"),
                    ("reviewed_book", "Reviewed book"),
                    ("review_upvoted", "Review upvoted"),
                    ("review_downvoted", "Review downvoted"),
                    ("book_added_to_collection", "Book added to collection"),
                    ("collection_shared", "Collection shared"),
                    ("recommendation_ready", "Recommendation ready"),
                    ("system_message", "System message"),
                    ("task_failed", "Task failed"),
                ],
                db_index=True,
                max_length=40,
            ),
        ),
    ]
