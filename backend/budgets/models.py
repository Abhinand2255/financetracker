from django.db import models
from django.conf import settings
from transactions.models import Category


class Budget(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budgets",
        db_index=True,
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="budgets",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    month = models.PositiveSmallIntegerField(
        help_text="Month number 1-12",
        db_index=True,
    )
    year = models.PositiveSmallIntegerField(
        help_text="Year e.g. 2026",
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-year", "-month"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "category", "month", "year"],
                name="unique_user_category_budget_per_month_year",
            )
        ]

    def __str__(self):
        return f"{self.user.username} - {self.category.name} ({self.month}/{self.year}): {self.amount}"


class BudgetAlert(models.Model):
    THRESHOLD_CHOICES = (
        (50, "50% Reached"),
        (75, "75% Reached"),
        (90, "90% Reached"),
        (100, "100% Exceeded"),
    )

    budget = models.ForeignKey(
        Budget,
        on_delete=models.CASCADE,
        related_name="alerts",
    )
    threshold = models.IntegerField(choices=THRESHOLD_CHOICES)
    triggered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["budget", "threshold"],
                name="unique_budget_threshold_alert",
            )
        ]

    def __str__(self):
        return f"Budget #{self.budget.id} alert at {self.threshold}%"
