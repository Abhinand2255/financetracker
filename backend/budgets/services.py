from decimal import Decimal
from django.db.models import Sum
from .models import Budget, BudgetAlert
from transactions.models import Transaction
from notifications.models import Notification


def get_budget_spending(budget: Budget) -> Decimal:
    spent = Transaction.objects.filter(
        user=budget.user,
        type="EXPENSE",
        category=budget.category,
        date__year=budget.year,
        date__month=budget.month,
    ).aggregate(total=Sum("amount"))["total"]
    return spent or Decimal("0.00")


def check_budget_alerts(user, category, transaction_date):
    try:
        budget = Budget.objects.get(
            user=user,
            category=category,
            month=transaction_date.month,
            year=transaction_date.year,
        )
    except Budget.DoesNotExist:
        return

    spent = get_budget_spending(budget)
    if budget.amount <= 0:
        return

    utilization_pct = (spent / budget.amount) * 100

    thresholds = [50, 75, 90, 100]
    for threshold in thresholds:
        if utilization_pct >= threshold:
            # Prevent duplicate alerts for the same threshold and budget period
            alert, created = BudgetAlert.objects.get_or_create(
                budget=budget,
                threshold=threshold,
            )
            if created:
                if threshold >= 100:
                    Notification.objects.create(
                        user=user,
                        title=f"Budget Exceeded: {category.name}",
                        message=f"You have reached {round(utilization_pct, 1)}% of your {budget.month}/{budget.year} budget for {category.name}. (Spent: {spent} / Budget: {budget.amount})",
                        type="BUDGET_EXCEEDED",
                        link="/budgets",
                    )
                else:
                    Notification.objects.create(
                        user=user,
                        title=f"Budget Alert: {threshold}% on {category.name}",
                        message=f"You have utilized {round(utilization_pct, 1)}% of your {budget.month}/{budget.year} budget for {category.name}. (Spent: {spent} / Budget: {budget.amount})",
                        type="BUDGET_WARNING",
                        link="/budgets",
                    )
