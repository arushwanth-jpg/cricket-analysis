from django.contrib import admin
from .models import Match


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "match_name",
        "team1",
        "team2",
        "match_format",
        "match_date",
        "status",
        "winner",
    )

    list_filter = (
        "match_format",
        "status",
        "match_date",
    )

    search_fields = (
        "match_name",
        "team1__name",
        "team2__name",
        "venue",
    )

    date_hierarchy = "match_date"