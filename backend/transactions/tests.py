from datetime import date
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from transactions.models import Category, Transaction, RecurringTransaction
from transactions.services import process_user_recurring_transactions

User = get_user_model()


class TransactionTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="user1", email="user1@example.com", password="Password123!"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="Password123!"
        )

        self.category_salary = Category.objects.create(
            name="Salary", type="INCOME", is_default=True
        )
        self.category_food = Category.objects.create(
            name="Food", type="EXPENSE", is_default=True
        )

        # Authenticate as user1
        self.client.force_authenticate(user=self.user1)

    def test_add_income_transaction(self):
        url = reverse("transaction_list_create")
        data = {
            "type": "INCOME",
            "title": "Monthly Salary",
            "amount": "50000.00",
            "category_id": self.category_salary.id,
            "date": "2026-11-20",
            "payment_method": "Bank Transfer",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Transaction.objects.filter(user=self.user1).count(), 1)
        tx = Transaction.objects.first()
        self.assertEqual(tx.amount, Decimal("50000.00"))
        self.assertEqual(tx.type, "INCOME")

    def test_add_expense_transaction(self):
        url = reverse("transaction_list_create")
        data = {
            "type": "EXPENSE",
            "title": "Dinner with Friends",
            "amount": "1500.50",
            "category_id": self.category_food.id,
            "date": "2026-11-21",
            "payment_method": "UPI",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        tx = Transaction.objects.filter(user=self.user1, type="EXPENSE").first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.amount, Decimal("1500.50"))

    def test_update_transaction(self):
        tx = Transaction.objects.create(
            user=self.user1,
            type="EXPENSE",
            title="Groceries",
            amount=Decimal("800.00"),
            date=date(2026, 11, 22),
            category=self.category_food,
        )
        url = reverse("transaction_detail", kwargs={"pk": tx.id})
        update_data = {
            "title": "Weekly Groceries",
            "amount": "950.00",
            "type": "EXPENSE",
            "date": "2026-11-22",
        }
        response = self.client.put(url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tx.refresh_from_db()
        self.assertEqual(tx.title, "Weekly Groceries")
        self.assertEqual(tx.amount, Decimal("950.00"))

    def test_delete_transaction(self):
        tx = Transaction.objects.create(
            user=self.user1,
            type="EXPENSE",
            title="To be deleted",
            amount=Decimal("100.00"),
            date=date(2026, 11, 23),
        )
        url = reverse("transaction_detail", kwargs={"pk": tx.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Transaction.objects.filter(id=tx.id).exists())

    def test_cross_user_isolation_security(self):
        # Transaction belonging to user2
        tx_user2 = Transaction.objects.create(
            user=self.user2,
            type="INCOME",
            title="Private Salary",
            amount=Decimal("100000.00"),
            date=date(2026, 11, 20),
        )
        # user1 attempts to view user2's transaction
        url = reverse("transaction_detail", kwargs={"pk": tx_user2.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # user1 attempts to delete user2's transaction
        delete_response = self.client.delete(url)
        self.assertEqual(delete_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Transaction.objects.filter(id=tx_user2.id).exists())

    def test_recurring_transaction_safe_processing(self):
        # Create a daily recurring income due today
        today = date.today()
        recurring = RecurringTransaction.objects.create(
            user=self.user1,
            title="Daily Interest",
            amount=Decimal("50.00"),
            type="INCOME",
            frequency="DAILY",
            start_date=today,
            next_run_date=today,
        )

        processed = process_user_recurring_transactions(self.user1)
        self.assertEqual(processed, 1)

        # Ensure transaction was created
        self.assertTrue(
            Transaction.objects.filter(user=self.user1, title="[Recurring] Daily Interest").exists()
        )

        # Running process again on the same day must not duplicate
        second_run = process_user_recurring_transactions(self.user1)
        self.assertEqual(second_run, 0)
