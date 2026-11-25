from decimal import Decimal
from django.db import models
from django.conf import settings


class SavingsGoal(models.Model):
    STATUS_CHOICES = (
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="savings_goals",
        db_index=True,
    )
    name = models.CharField(max_length=255)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    target_date = models.DateField()
    description = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="IN_PROGRESS",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["target_date", "-created_at"]

    def __str__(self):
        return f"{self.name} - {self.current_amount}/{self.target_amount} ({self.status})"

    @property
    def percentage_completed(self):
        tgt = Decimal(str(self.target_amount))
        curr = Decimal(str(self.current_amount))
        if tgt <= 0:
            return 100.0
        pct = float((curr / tgt) * 100)
        return min(round(pct, 1), 100.0)


class SavingsContribution(models.Model):
    goal = models.ForeignKey(
        SavingsGoal,
        on_delete=models.CASCADE,
        related_name="contributions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="goal_contributions",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    note = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"Contribution of {self.amount} to {self.goal.name}"
