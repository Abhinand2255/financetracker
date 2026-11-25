from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = (
        ("BUDGET_WARNING", "Budget Warning"),
        ("BUDGET_EXCEEDED", "Budget Exceeded"),
        ("GOAL_ACHIEVED", "Goal Achieved"),
        ("RECURRING_REMINDER", "Recurring Reminder"),
        ("SYSTEM", "System"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        db_index=True,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, default="SYSTEM")
    is_read = models.BooleanField(default=False, db_index=True)
    link = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.type}] {self.user.username} - {self.title}"
