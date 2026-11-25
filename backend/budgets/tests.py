from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from transactions.models import Category, Transaction
from budgets.models import Budget, BudgetAlert
from notifications.models import Notification

User = get_user_model()


class BudgetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="budgetuser", email="budget@example.com", password="Password123!"
        )
        self.category = Category.objects.create(name="Food", type="EXPENSE", is_default=True)
        self.client.force_authenticate(user=self.user)

    def test_create_budget(self):
        url = reverse("budget_list_create")
        data = {
            "category_id": self.category.id,
            "amount": "5000.00",
            "month": 11,
            "year": 2026,
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Budget.objects.filter(user=self.user).count(), 1)

    def test_budget_calculations_and_alerts(self):
        budget = Budget.objects.create(
            user=self.user,
            category=self.category,
            amount=Decimal("5000.00"),
            month=11,
            year=2026,
        )

        # Add expense of 3000 (60% utilization -> triggers 50% threshold)
        tx_url = reverse("transaction_list_create")
        self.client.post(
            tx_url,
            {
                "type": "EXPENSE",
                "title": "Groceries",
                "amount": "3000.00",
                "category_id": self.category.id,
                "date": "2026-11-15",
            },
        )

        # Check budget alert triggered
        self.assertTrue(BudgetAlert.objects.filter(budget=budget, threshold=50).exists())
        self.assertTrue(
            Notification.objects.filter(user=self.user, type="BUDGET_WARNING").exists()
        )

        # Add expense of 2500 (Total 5500 / 5000 = 110% -> triggers 75%, 90%, 100% threshold)
        self.client.post(
            tx_url,
            {
                "type": "EXPENSE",
                "title": "Dinner",
                "amount": "2500.00",
                "category_id": self.category.id,
                "date": "2026-11-18",
            },
        )

        self.assertTrue(BudgetAlert.objects.filter(budget=budget, threshold=100).exists())
        self.assertTrue(
            Notification.objects.filter(user=self.user, type="BUDGET_EXCEEDED").exists()
        )

        # Fetch budget via API and verify calculated fields
        url = reverse("budget_detail", kwargs={"pk": budget.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(response.data["spent_amount"])), Decimal("5500.00"))
        self.assertEqual(Decimal(str(response.data["remaining_amount"])), Decimal("0.00"))
        self.assertEqual(response.data["utilization_percentage"], 110.0)
