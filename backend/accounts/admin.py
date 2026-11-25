from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    model = User

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
    )

    search_fields = (
        "username",
        "email",
    )

    ordering = ("username",)

    fieldsets = UserAdmin.fieldsets + (
        (
            "FinTrack Information",
            {
                "fields": (
                    "phone_number",
                    "profile_picture",
                    "preferred_currency",
                )
            },
        ),
    )