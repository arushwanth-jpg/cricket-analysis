from django.urls import path
from .views import MatchPredictionView

urlpatterns = [
    path("predict/", MatchPredictionView.as_view(), name="match-prediction"),
]