from decimal import Decimal
from rest_framework import serializers
from .models import Budget, BudgetAlert
from .services import get_budget_spending
from transactions.serializers import CategorySerializer
from transactions.models import Category


class BudgetAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetAlert
        fields = ["id", "threshold", "triggered_at"]


class BudgetSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source="category", read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True,
    )
    spent_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    utilization_percentage = serializers.SerializerMethodField()
    alerts = BudgetAlertSerializer(many=True, read_only=True)

    class Meta:
        model = Budget
        fields = [
            "id",
            "category",
            "category_id",
            "category_details",
            "amount",
            "month",
            "year",
            "spent_amount",
            "remaining_amount",
            "utilization_percentage",
            "alerts",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "category", "created_at", "updated_at"]

    def get_spent_amount(self, obj):
        return get_budget_spending(obj)

    def get_remaining_amount(self, obj):
        spent = get_budget_spending(obj)
        rem = obj.amount - spent
        return max(Decimal("0.00"), rem)

    def get_utilization_percentage(self, obj):
        spent = get_budget_spending(obj)
        if obj.amount <= 0:
            return 100.0
        pct = float((spent / obj.amount) * 100)
        return round(pct, 1)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Budget amount must be greater than zero.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        category = attrs.get("category")
        month = attrs.get("month")
        year = attrs.get("year")

        # Check unique constraint on create
        if not self.instance:
            if Budget.objects.filter(user=user, category=category, month=month, year=year).exists():
                raise serializers.ValidationError("A budget for this category and month/year already exists.")
        return attrs
