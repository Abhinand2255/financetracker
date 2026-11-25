from django.urls import path
from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    TransactionListCreateView,
    TransactionDetailView,
    RecurringTransactionListCreateView,
    RecurringTransactionDetailView,
    ProcessRecurringTransactionsView,
    FinancialSummaryView,
)

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name="category_list_create"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category_detail"),
    path("", TransactionListCreateView.as_view(), name="transaction_list_create"),
    path("<int:pk>/", TransactionDetailView.as_view(), name="transaction_detail"),
    path("recurring/", RecurringTransactionListCreateView.as_view(), name="recurring_list_create"),
    path("recurring/<int:pk>/", RecurringTransactionDetailView.as_view(), name="recurring_detail"),
    path("recurring/process/", ProcessRecurringTransactionsView.as_view(), name="recurring_process"),
    path("summary/", FinancialSummaryView.as_view(), name="financial_summary"),
]
