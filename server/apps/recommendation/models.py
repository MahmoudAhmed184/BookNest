from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.books.models import Book
from apps.recommendation.managers import RecommendationModelManager, UserRecommendationManager
class RecommendationModel(models.Model):
    class ModelType(models.TextChoices):
        SVD = 'svd', 'Singular Value Decomposition'
        KNN = 'knn', 'K-Nearest Neighbors'
    
    id = models.BigAutoField(
        primary_key=True,
        verbose_name='ID',
        help_text='Primary identifier for the recommendation model.',
    )
    model_type = models.CharField(
        verbose_name='model type',
        max_length=10,
        choices=ModelType.choices,
        help_text='Recommendation algorithm represented by this model record.',
    )
    created_at = models.DateTimeField(
        verbose_name='created at',
        auto_now_add=True,
        help_text='Timestamp when the model record was created.',
    )
    updated_at = models.DateTimeField(
        verbose_name='updated at',
        auto_now=True,
        help_text='Timestamp when the model record was last updated.',
    )
    is_active = models.BooleanField(
        verbose_name='is active',
        default=False,
        help_text='Whether this model is the active recommendation model.',
    )
    
    # Model parameters
    min_ratings_per_user = models.IntegerField(
        verbose_name='minimum ratings per user',
        default=5,
        help_text='Minimum ratings a user needs before personalized recommendations are generated.',
    )
    n_factors = models.IntegerField(
        verbose_name='factor count',
        default=100,
        help_text='Number of latent factors for SVD-style models.',
    )
    knn_k = models.IntegerField(
        verbose_name='neighbor count',
        default=40,
        help_text='Number of neighbors for KNN-style models.',
    )
    
    # Model performance metrics
    rmse = models.FloatField(
        verbose_name='RMSE',
        null=True,
        blank=True,
        help_text='Root mean squared error measured during model evaluation.',
    )
    mae = models.FloatField(
        verbose_name='MAE',
        null=True,
        blank=True,
        help_text='Mean absolute error measured during model evaluation.',
    )
    
    # Serialized model data will be stored in a file referenced by this field
    model_file = models.FileField(
        verbose_name='model file',
        upload_to='recommendation_models/',
        null=True,
        blank=True,
        help_text='Serialized model artifact stored in configured media storage.',
    )
    objects = RecommendationModelManager()
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_model_type_display()} model created on {self.created_at.strftime('%Y-%m-%d')}"


class UserRecommendation(models.Model):

    id = models.BigAutoField(
        primary_key=True,
        verbose_name='ID',
        help_text='Primary identifier for the user recommendation.',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='book_recommendation',
        verbose_name='user',
        help_text='User receiving the recommendation.',
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        verbose_name='book',
        help_text='Book recommended to the user.',
    )
    score = models.FloatField(
        verbose_name='score',
        help_text='Predicted rating or recommendation score.',
    )
    recommended_at = models.DateTimeField(
        verbose_name='recommended at',
        default=timezone.now,
        help_text='Timestamp when the recommendation was generated.',
    )
    model = models.ForeignKey(
        RecommendationModel,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='model',
        help_text='Recommendation model that generated this recommendation.',
    )
    objects = UserRecommendationManager()
    
    class Meta:
        ordering = ['-score']
        unique_together = ['user', 'book']
    
    def __str__(self):
        return f"Recommendation for {self.user} - {self.book} (Score: {self.score:.2f})"
