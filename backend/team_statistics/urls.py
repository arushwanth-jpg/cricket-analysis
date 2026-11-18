
from django.urls import path
from .views import TeamComparisonView

urlpatterns = [
    path(
        "compare/",
        TeamComparisonView.as_view(),
        name="team-comparison",
    ),
]
