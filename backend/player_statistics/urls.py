
from django.urls import path

from .views import (
    PlayerStatisticsListCreateView,
    PlayerStatisticsDetailView,
    PlayerComparisonView,
)

urlpatterns = [
    path(
        "",
        PlayerStatisticsListCreateView.as_view(),
        name="player-statistics-list-create",
    ),
    path(
        "compare/",
        PlayerComparisonView.as_view(),
        name="player-comparison",
    ),
    path(
        "<int:pk>/",
        PlayerStatisticsDetailView.as_view(),
        name="player-statistics-detail",
    ),
]
