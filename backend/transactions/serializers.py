from rest_framework import serializers
from .models import Category, Transaction, RecurringTransaction


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "type",
            "icon",
            "color",
            "is_default",
            "user",
            "created_at",
        ]
        read_only_fields = ["id", "is_default", "user", "created_at"]


class TransactionSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source="category", read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "title",
            "amount",
            "type",
            "category",
            "category_id",
            "category_details",
            "date",
            "description",
            "payment_method",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "category", "created_at", "updated_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Transaction amount must be greater than zero.")
        return value


class RecurringTransactionSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source="category", read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = RecurringTransaction
        fields = [
            "id",
            "title",
            "amount",
            "type",
            "category",
            "category_id",
            "category_details",
            "frequency",
            "start_date",
            "end_date",
            "next_run_date",
            "last_run_date",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "category", "last_run_date", "created_at", "updated_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value
