from datetime import date, timedelta
from decimal import Decimal
from dateutil.relativedelta import relativedelta
from django.db.models import Sum
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from transactions.models import Transaction, Category
from transactions.serializers import TransactionSerializer
from budgets.models import Budget
from budgets.services import get_budget_spending
from goals.models import SavingsGoal, SavingsContribution


def get_date_range(filter_type: str, custom_start=None, custom_end=None):
    today = date.today()

    if filter_type == "this_week":
        start = today - timedelta(days=today.weekday())
        end = today
    elif filter_type == "this_month":
        start = today.replace(day=1)
        end = today
    elif filter_type == "last_month":
        first_of_this_month = today.replace(day=1)
        last_month_end = first_of_this_month - timedelta(days=1)
        start = last_month_end.replace(day=1)
        end = last_month_end
    elif filter_type == "last_3_months":
        start = today - relativedelta(months=3)
        end = today
    elif filter_type == "this_year":
        start = today.replace(month=1, day=1)
        end = today
    elif filter_type == "custom" and custom_start and custom_end:
        start = custom_start
        end = custom_end
    else:  # default this_month
        start = today.replace(day=1)
        end = today

    return start, end


class DashboardMetricsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()
        range_filter = request.query_params.get("range", "this_month")
        custom_start = request.query_params.get("start_date")
        custom_end = request.query_params.get("end_date")

        start_date, end_date = get_date_range(range_filter, custom_start, custom_end)

        # Base querysets
        all_transactions = Transaction.objects.filter(user=user)
        period_transactions = all_transactions.filter(date__gte=start_date, date__lte=end_date)

        # All-time aggregates
        all_income = all_transactions.filter(type="INCOME").aggregate(val=Sum("amount"))["val"] or Decimal("0.00")
        all_expenses = all_transactions.filter(type="EXPENSE").aggregate(val=Sum("amount"))["val"] or Decimal("0.00")
        total_balance = all_income - all_expenses

        # Period aggregates
        period_income = period_transactions.filter(type="INCOME").aggregate(val=Sum("amount"))["val"] or Decimal("0.00")
        period_expenses = period_transactions.filter(type="EXPENSE").aggregate(val=Sum("amount"))["val"] or Decimal("0.00")
        period_savings = period_income - period_expenses
        
        # Savings rate calculation
        if period_income > 0:
            savings_rate = round(float((max(Decimal("0.00"), period_savings) / period_income) * 100), 1)
        else:
            savings_rate = 0.0

        # Current Month aggregates specifically
        this_month_start = today.replace(day=1)
        monthly_income = all_transactions.filter(
            type="INCOME",
            date__gte=this_month_start,
            date__lte=today,
        ).aggregate(val=Sum("amount"))["val"] or Decimal("0.00")

        monthly_expenses = all_transactions.filter(
            type="EXPENSE",
            date__gte=this_month_start,
            date__lte=today,
        ).aggregate(val=Sum("amount"))["val"] or Decimal("0.00")

        # Total savings (goals saved amount)
        total_savings = SavingsGoal.objects.filter(user=user).aggregate(val=Sum("current_amount"))["val"] or Decimal("0.00")

        # Recent transactions (latest 8)
        recent_txs = all_transactions[:8]
        recent_transactions_data = TransactionSerializer(recent_txs, many=True).data

        # Category breakdown for Pie charts
        expense_categories = []
        cat_expense_totals = (
            period_transactions.filter(type="EXPENSE")
            .values("category__id", "category__name", "category__color", "category__icon")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )
        for c in cat_expense_totals:
            pct = round(float((c["total"] / period_expenses) * 100), 1) if period_expenses > 0 else 0
            expense_categories.append({
                "id": c["category__id"],
                "name": c["category__name"] or "Uncategorized",
                "color": c["category__color"] or "#6B7280",
                "icon": c["category__icon"] or "Tag",
                "amount": float(c["total"]),
                "percentage": pct,
            })

        income_categories = []
        cat_income_totals = (
            period_transactions.filter(type="INCOME")
            .values("category__id", "category__name", "category__color", "category__icon")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )
        for c in cat_income_totals:
            pct = round(float((c["total"] / period_income) * 100), 1) if period_income > 0 else 0
            income_categories.append({
                "id": c["category__id"],
                "name": c["category__name"] or "Uncategorized",
                "color": c["category__color"] or "#10B981",
                "icon": c["category__icon"] or "Tag",
                "amount": float(c["total"]),
                "percentage": pct,
            })

        # Monthly overview (past 6 months) for Recharts
        monthly_overview = []
        for i in range(5, -1, -1):
            target_month_date = today - relativedelta(months=i)
            m_year = target_month_date.year
            m_month = target_month_date.month
            m_name = target_month_date.strftime("%b %Y")

            m_inc = all_transactions.filter(
                type="INCOME",
                date__year=m_year,
                date__month=m_month,
            ).aggregate(val=Sum("amount"))["val"] or Decimal("0.00")

            m_exp = all_transactions.filter(
                type="EXPENSE",
                date__year=m_year,
                date__month=m_month,
            ).aggregate(val=Sum("amount"))["val"] or Decimal("0.00")

            m_sav = m_inc - m_exp
            monthly_overview.append({
                "month": m_name,
                "income": float(m_inc),
                "expenses": float(m_exp),
                "savings": float(max(Decimal("0.00"), m_sav)),
            })

        # Active Budgets overview
        current_budgets = Budget.objects.filter(
            user=user,
            month=today.month,
            year=today.year,
        ).select_related("category")
        budgets_overview = []
        for b in current_budgets:
            spent = get_budget_spending(b)
            pct = round(float((spent / b.amount) * 100), 1) if b.amount > 0 else 0
            budgets_overview.append({
                "id": b.id,
                "category_name": b.category.name,
                "category_color": b.category.color,
                "budget_amount": float(b.amount),
                "spent_amount": float(spent),
                "remaining_amount": float(max(Decimal("0.00"), b.amount - spent)),
                "utilization_percentage": pct,
            })

        # Active Goals overview
        active_goals = SavingsGoal.objects.filter(
            user=user,
            status="IN_PROGRESS",
        )[:4]
        goals_overview = []
        for g in active_goals:
            goals_overview.append({
                "id": g.id,
                "name": g.name,
                "target_amount": float(g.target_amount),
                "current_amount": float(g.current_amount),
                "percentage": g.percentage_completed,
                "target_date": g.target_date,
            })

        return Response({
            "filter": {
                "range": range_filter,
                "start_date": str(start_date),
                "end_date": str(end_date),
            },
            "summary": {
                "total_balance": float(total_balance),
                "total_income": float(period_income),
                "total_expenses": float(period_expenses),
                "total_savings": float(total_savings),
                "monthly_income": float(monthly_income),
                "monthly_expenses": float(monthly_expenses),
                "savings_rate": savings_rate,
            },
            "monthly_overview": monthly_overview,
            "expense_categories": expense_categories,
            "income_categories": income_categories,
            "recent_transactions": recent_transactions_data,
            "budgets_overview": budgets_overview,
            "goals_overview": goals_overview,
        })
