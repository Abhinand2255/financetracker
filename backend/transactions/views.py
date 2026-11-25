from datetime import date, timedelta
from decimal import Decimal
from django.db.models import Sum, Q
from django.db import transaction
from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Category, Transaction, RecurringTransaction
from .serializers import (
    CategorySerializer,
    TransactionSerializer,
    RecurringTransactionSerializer,
)
from .services import process_user_recurring_transactions
from budgets.services import check_budget_alerts


class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        cat_type = self.request.query_params.get("type")
        qs = Category.objects.filter(
            Q(user=self.request.user) | Q(is_default=True)
        )
        if cat_type in ["INCOME", "EXPENSE"]:
            qs = qs.filter(type=cat_type)
        return qs.order_by("name")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, is_default=False)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only edit or delete their own custom categories
        return Category.objects.filter(user=self.request.user, is_default=False)


class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Transaction.objects.filter(user=user)

        # Filters
        tx_type = self.request.query_params.get("type")
        if tx_type in ["INCOME", "EXPENSE"]:
            qs = qs.filter(type=tx_type)

        category_id = self.request.query_params.get("category")
        if category_id:
            qs = qs.filter(category_id=category_id)

        start_date = self.request.query_params.get("start_date")
        if start_date:
            qs = qs.filter(date__gte=start_date)

        end_date = self.request.query_params.get("end_date")
        if end_date:
            qs = qs.filter(date__lte=end_date)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        # Ordering
        ordering = self.request.query_params.get("ordering", "-date")
        allowed_ordering = ["date", "-date", "amount", "-amount", "title", "-title"]
        if ordering in allowed_ordering:
            qs = qs.order_by(ordering, "-created_at")

        return qs

    def perform_create(self, serializer):
        with transaction.atomic():
            instance = serializer.save(user=self.request.user)
            # Check budget thresholds if expense
            if instance.type == "EXPENSE" and instance.category:
                check_budget_alerts(self.request.user, instance.category, instance.date)


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        with transaction.atomic():
            instance = serializer.save()
            if instance.type == "EXPENSE" and instance.category:
                check_budget_alerts(self.request.user, instance.category, instance.date)


class RecurringTransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = RecurringTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RecurringTransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RecurringTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user)


class ProcessRecurringTransactionsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = process_user_recurring_transactions(request.user)
        return Response(
            {"message": f"Processed {count} recurring transaction(s).", "count": count},
            status=status.HTTP_200_OK,
        )


class FinancialSummaryView(views.APIView):
    """Calculates daily, weekly, monthly, yearly, and total income and expenses"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        tx_type = request.query_params.get("type", "INCOME")
        today = date.today()

        qs = Transaction.objects.filter(user=user, type=tx_type)

        # Total
        total = qs.aggregate(val=Sum("amount"))["val"] or Decimal("0.00")

        # Daily (Today)
        daily = qs.filter(date=today).aggregate(val=Sum("amount"))["val"] or Decimal("0.00")

        # Weekly (Past 7 days)
        week_ago = today - timedelta(days=7)
        weekly = qs.filter(date__gte=week_ago, date__lte=today).aggregate(val=Sum("amount"))["val"] or Decimal("0.00")

        # Monthly (Current month)
        monthly = qs.filter(
            date__year=today.year,
            date__month=today.month,
        ).aggregate(val=Sum("amount"))["val"] or Decimal("0.00")

        # Yearly (Current year)
        yearly = qs.filter(
            date__year=today.year,
        ).aggregate(val=Sum("amount"))["val"] or Decimal("0.00")

        return Response({
            "type": tx_type,
            "daily": daily,
            "weekly": weekly,
            "monthly": monthly,
            "yearly": yearly,
            "total": total,
        })
