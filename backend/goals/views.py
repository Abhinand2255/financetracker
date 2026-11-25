from django.db import transaction
from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import SavingsGoal, SavingsContribution
from .serializers import SavingsGoalSerializer, SavingsContributionSerializer
from notifications.models import Notification


class SavingsGoalListCreateView(generics.ListCreateAPIView):
    serializer_class = SavingsGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        status_filter = self.request.query_params.get("status")
        qs = SavingsGoal.objects.filter(user=self.request.user)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by("target_date")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SavingsGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SavingsGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user)


class SavingsContributionCreateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            goal = SavingsGoal.objects.get(pk=pk, user=request.user)
        except SavingsGoal.DoesNotExist:
            return Response(
                {"error": "Savings goal not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SavingsContributionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data["amount"]

        with transaction.atomic():
            contribution = serializer.save(goal=goal, user=request.user)
            goal.current_amount += amount

            # Check if goal target reached
            if goal.current_amount >= goal.target_amount:
                if goal.status != "COMPLETED":
                    goal.status = "COMPLETED"
                    Notification.objects.create(
                        user=request.user,
                        title=f"Savings Goal Achieved: {goal.name}!",
                        message=f"Congratulations! You reached your savings target of ₹{goal.target_amount} for {goal.name}.",
                        type="GOAL_ACHIEVED",
                        link="/savings-goals",
                    )
            goal.save()

        return Response(
            {
                "message": "Contribution recorded successfully.",
                "goal": SavingsGoalSerializer(goal).data,
                "contribution": SavingsContributionSerializer(contribution).data,
            },
            status=status.HTTP_201_CREATED,
        )
