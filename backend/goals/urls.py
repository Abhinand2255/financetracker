from django.urls import path
from .views import (
    SavingsGoalListCreateView,
    SavingsGoalDetailView,
    SavingsContributionCreateView,
)

urlpatterns = [
    path("", SavingsGoalListCreateView.as_view(), name="goal_list_create"),
    path("<int:pk>/", SavingsGoalDetailView.as_view(), name="goal_detail"),
    path("<int:pk>/contribute/", SavingsContributionCreateView.as_view(), name="goal_contribute"),
]
