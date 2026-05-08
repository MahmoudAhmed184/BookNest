from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.reviews.models import Rating, Review, ReviewVote
from apps.reviews.services import sync_book_rating_stats, sync_book_review_count, sync_review_vote_counts


@receiver(post_save, sender=Rating)
@receiver(post_delete, sender=Rating)
def sync_rating_stats(sender, instance: Rating, **kwargs) -> None:
    sync_book_rating_stats(book=instance.book)


@receiver(post_save, sender=Review)
@receiver(post_delete, sender=Review)
def sync_review_stats(sender, instance: Review, **kwargs) -> None:
    sync_book_review_count(book=instance.book)


@receiver(post_save, sender=ReviewVote)
@receiver(post_delete, sender=ReviewVote)
def sync_review_votes(sender, instance: ReviewVote, **kwargs) -> None:
    sync_review_vote_counts(review=instance.review)
