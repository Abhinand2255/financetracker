from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from goals.models import SavingsGoal, SavingsContribution
from notifications.models import Notification

User = get_user_model()


class SavingsGoalTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="goaluser1", email="g1@example.com", password="Password123!"
        )
        self.user2 = User.objects.create_user(
            username="goaluser2", email="g2@example.com", password="Password123!"
        )
        self.client.force_authenticate(user=self.user1)

    def test_create_savings_goal(self):
        url = reverse("goal_list_create")
        data = {
            "name": "New Laptop",
            "target_amount": "60000.00",
            "target_date": "2026-12-31",
            "description": "MacBook Pro for work",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SavingsGoal.objects.filter(user=self.user1).count(), 1)

    def test_update_contributions_and_completion_percentage(self):
        goal = SavingsGoal.objects.create(
            user=self.user1,
            name="Emergency Fund",
            target_amount=Decimal("10000.00"),
            target_date="2026-12-31",
        )

        # Contribute 4000
        contrib_url = reverse("goal_contribute", kwargs={"pk": goal.id})
        response = self.client.post(contrib_url, {"amount": "4000.00"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        goal.refresh_from_db()
        self.assertEqual(goal.current_amount, Decimal("4000.00"))
        self.assertEqual(goal.percentage_completed, 40.0)
        self.assertEqual(goal.status, "IN_PROGRESS")

        # Contribute 6000 (Goal Achieved!)
        response = self.client.post(contrib_url, {"amount": "6000.00"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        goal.refresh_from_db()
        self.assertEqual(goal.current_amount, Decimal("10000.00"))
        self.assertEqual(goal.percentage_completed, 100.0)
        self.assertEqual(goal.status, "COMPLETED")

        # Notification created
        self.assertTrue(
            Notification.objects.filter(user=self.user1, type="GOAL_ACHIEVED").exists()
        )

    def test_cross_user_goal_access_denied(self):
        goal_user2 = SavingsGoal.objects.create(
            user=self.user2,
            name="User2 Secret Goal",
            target_amount=Decimal("50000.00"),
            target_date="2026-12-31",
        )
        url = reverse("goal_detail", kwargs={"pk": goal_user2.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
