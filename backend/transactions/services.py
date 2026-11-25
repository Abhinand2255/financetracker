from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from django.db import transaction
from .models import RecurringTransaction, Transaction


def advance_run_date(current_date: date, frequency: str) -> date:
    if frequency == "DAILY":
        return current_date + timedelta(days=1)
    elif frequency == "WEEKLY":
        return current_date + timedelta(weeks=1)
    elif frequency == "MONTHLY":
        return current_date + relativedelta(months=1)
    elif frequency == "YEARLY":
        return current_date + relativedelta(years=1)
    return current_date + timedelta(days=30)


def process_user_recurring_transactions(user) -> int:
    today = date.today()
    due_recurring = RecurringTransaction.objects.filter(
        user=user,
        is_active=True,
        next_run_date__lte=today,
    )
    processed_count = 0

    for item in due_recurring:
        # Check if item has passed end_date
        if item.end_date and item.next_run_date > item.end_date:
            item.is_active = False
            item.save()
            continue

        with transaction.atomic():
            # Check if transaction for this date already exists to prevent duplicate execution
            already_exists = Transaction.objects.filter(
                user=user,
                title=item.title,
                amount=item.amount,
                type=item.type,
                category=item.category,
                date=item.next_run_date,
            ).exists()

            if not already_exists:
                Transaction.objects.create(
                    user=user,
                    title=f"[Recurring] {item.title}",
                    amount=item.amount,
                    type=item.type,
                    category=item.category,
                    date=item.next_run_date,
                    description=f"Generated from recurring subscription ({item.frequency.lower()})",
                )
                processed_count += 1

            item.last_run_date = item.next_run_date
            next_date = advance_run_date(item.next_run_date, item.frequency)
            
            if item.end_date and next_date > item.end_date:
                item.is_active = False
            item.next_run_date = next_date
            item.save()

    return processed_count
