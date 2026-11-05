from rest_framework import viewsets
from .models import Match
from .serializers import MatchSerializer

class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.select_related('team1', 'team2', 'winner').all()
    serializer_class = MatchSerializer

