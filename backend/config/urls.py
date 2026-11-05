from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (SpectacularAPIView,SpectacularSwaggerView,)
from teams.views import TeamViewSet
from players.views import PlayerViewSet
from matches.views import MatchViewSet

router = DefaultRouter()

router.register("teams", TeamViewSet)
router.register("players", PlayerViewSet)
router.register("matches", MatchViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(router.urls)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/",SpectacularSwaggerView.as_view(url_name="schema"),name="swagger-ui",),
    path("api/v1/analytics/",include("analytics.urls")),
    ]