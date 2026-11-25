from django.core.management.base import BaseCommand
from transactions.models import Category


class Command(BaseCommand):
    help = "Seeds default income and expense categories into TiDB Cloud"

    def handle(self, *args, **options):
        income_categories = [
            {"name": "Salary", "icon": "Briefcase", "color": "#10B981"},
            {"name": "Freelancing", "icon": "Laptop", "color": "#06B6D4"},
            {"name": "Business", "icon": "TrendingUp", "color": "#3B82F6"},
            {"name": "Investments", "icon": "DollarSign", "color": "#8B5CF6"},
            {"name": "Rental Income", "icon": "Home", "color": "#EC4899"},
            {"name": "Gifts", "icon": "Gift", "color": "#F59E0B"},
            {"name": "Other Income", "icon": "PlusCircle", "color": "#6B7280"},
        ]

        expense_categories = [
            {"name": "Food", "icon": "Utensils", "color": "#EF4444"},
            {"name": "Shopping", "icon": "ShoppingBag", "color": "#F97316"},
            {"name": "Transportation", "icon": "Car", "color": "#F59E0B"},
            {"name": "Rent", "icon": "Home", "color": "#84CC16"},
            {"name": "Utilities", "icon": "Zap", "color": "#10B981"},
            {"name": "Healthcare", "icon": "Heart", "color": "#06B6D4"},
            {"name": "Education", "icon": "BookOpen", "color": "#3B82F6"},
            {"name": "Entertainment", "icon": "Film", "color": "#6366F1"},
            {"name": "Travel", "icon": "Compass", "color": "#8B5CF6"},
            {"name": "Groceries", "icon": "ShoppingCart", "color": "#EC4899"},
            {"name": "Bills", "icon": "FileText", "color": "#F43F5E"},
            {"name": "Other", "icon": "MoreHorizontal", "color": "#6B7280"},
        ]

        created_count = 0

        for cat in income_categories:
            obj, created = Category.objects.get_or_create(
                user=None,
                name=cat["name"],
                type="INCOME",
                defaults={
                    "icon": cat["icon"],
                    "color": cat["color"],
                    "is_default": True,
                },
            )
            if created:
                created_count += 1

        for cat in expense_categories:
            obj, created = Category.objects.get_or_create(
                user=None,
                name=cat["name"],
                type="EXPENSE",
                defaults={
                    "icon": cat["icon"],
                    "color": cat["color"],
                    "is_default": True,
                },
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded default categories! ({created_count} newly created)"
            )
        )
