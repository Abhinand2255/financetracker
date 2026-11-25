from decimal import Decimal
from datetime import date
from rest_framework import serializers
from .models import SavingsGoal, SavingsContribution


class SavingsContributionSerializer(serializers.ModelSerializer):
    date = serializers.DateField(required=False, default=date.today)

    class Meta:
        model = SavingsContribution
        fields = [
            "id",
            "goal",
            "amount",
            "date",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "goal", "created_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Contribution amount must be greater than zero.")
        return value


class SavingsGoalSerializer(serializers.ModelSerializer):
    percentage_completed = serializers.ReadOnlyField()
    contributions = SavingsContributionSerializer(many=True, read_only=True)
    remaining_amount = serializers.SerializerMethodField()

    class Meta:
        model = SavingsGoal
        fields = [
            "id",
            "name",
            "target_amount",
            "current_amount",
            "remaining_amount",
            "target_date",
            "description",
            "status",
            "percentage_completed",
            "contributions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "current_amount",
            "percentage_completed",
            "remaining_amount",
            "created_at",
            "updated_at",
        ]

    def get_remaining_amount(self, obj):
        tgt = Decimal(str(obj.target_amount))
        curr = Decimal(str(obj.current_amount))
        rem = tgt - curr
        return float(max(Decimal("0.00"), rem))

    def validate_target_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Target amount must be greater than zero.")
        return value
