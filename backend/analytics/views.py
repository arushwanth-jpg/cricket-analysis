from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from teams.models import Team
from players.models import Player
from matches.models import Match
from matches.serializers import MatchSerializer


class DashboardView(APIView):

    def get(self, request):

        total_matches = Match.objects.count()

        completed_matches = Match.objects.filter(status="COMPLETED").count()
        live_matches = Match.objects.filter(status="LIVE").count()
        upcoming_matches = Match.objects.filter(status="UPCOMING").count()
        recent_matches = Match.objects.select_related("team1","team2","winner").order_by("-match_date")[:5]
        team_stats = Team.objects.annotate(matches_won=Count("match_wins",filter=__import__("django.db.models").db.models.Q(match_wins__status="COMPLETED"))).values("id","name","short_name","matches_won").order_by("-matches_won", "name")
        data = {"summary": {"total_teams": Team.objects.count(),
                "total_players": Player.objects.count(),
                "total_matches": total_matches,
                "completed_matches": completed_matches,
                "live_matches": live_matches,
                "upcoming_matches": upcoming_matches,},
            "team_statistics": list(team_stats),
            "recent_matches": MatchSerializer(
                recent_matches,
                many=True
            ).data,
        }

        return Response(data)