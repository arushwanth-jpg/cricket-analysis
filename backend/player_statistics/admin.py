
from django.contrib import admin
from .models import PlayerMatchStatistics


@admin.register(PlayerMatchStatistics)
class PlayerMatchStatisticsAdmin(admin.ModelAdmin):

    list_display = (
        "player",
        "match",
        "match_format",
        "runs",
        "wickets",
        "catches",
    )

    list_filter = ("match_format", "match__status")
    search_fields = ("player__name", "match__match_name")
