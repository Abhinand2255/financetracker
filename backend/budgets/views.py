from datetime import date
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Budget
from .serializers import BudgetSerializer


class BudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Budget.objects.filter(user=user)

        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")

        if month:
            qs = qs.filter(month=month)
        if year:
            qs = qs.filter(year=year)
        else:
            # Default to current month/year if not specified or list all
            current_date = date.today()
            if not month:
                qs = qs.filter(year=current_date.year)

        return qs.order_by("-year", "-month")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)
