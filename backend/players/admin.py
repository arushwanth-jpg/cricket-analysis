from django.contrib import admin
from .models import Player


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "role",
        "team",
        "country",
        "batting_style",
        "bowling_style",
    )

    list_filter = (
        "role",
        "country",
        "team",
    )

    search_fields = (
        "name",
        "country",
        "team__name",
    )