
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from teams.models import Team
from matches.models import Match


class MatchPredictionView(APIView):

    def get(self, request):
        team1_id = request.query_params.get("team1")
        team2_id = request.query_params.get("team2")
        match_format = request.query_params.get("format")

        if not team1_id or not team2_id:
            return Response(
                {"error": "Both team1 and team2 are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            team1_id = int(team1_id)
            team2_id = int(team2_id)
        except (TypeError, ValueError):
            return Response(
                {"error": "Team IDs must be valid integers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if team1_id == team2_id:
            return Response(
                {"error": "Please select two different teams."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if match_format and match_format not in ["T20", "ODI", "TEST", "T10"]:
            return Response(
                {"error": "Invalid match format."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            team1 = Team.objects.get(id=team1_id)
            team2 = Team.objects.get(id=team2_id)
        except Team.DoesNotExist:
            return Response(
                {"error": "One or both teams were not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        matches = Match.objects.filter(
            status="COMPLETED"
        ).filter(
            Q(team1_id=team1_id, team2_id=team2_id) |
            Q(team1_id=team2_id, team2_id=team1_id)
        )

        if match_format:
            matches = matches.filter(match_format=match_format)

        head_to_head = list(matches.select_related(
            "team1", "team2", "winner"
        ).order_by("-match_date"))

        team1_wins = sum(
            1 for match in head_to_head
            if match.winner_id == team1_id
        )
        team2_wins = sum(
            1 for match in head_to_head
            if match.winner_id == team2_id
        )

        head_to_head_total = len(head_to_head)

        # Get each team's latest 5 completed matches.
        def get_recent_performance(team_id):
            recent_matches = Match.objects.filter(
                Q(team1_id=team_id) | Q(team2_id=team_id),
                status="COMPLETED"
            )

            if match_format:
                recent_matches = recent_matches.filter(
                    match_format=match_format
                )

            recent_matches = recent_matches.select_related(
                "winner"
            ).order_by("-match_date")[:5]

            recent_matches = list(recent_matches)

            wins = sum(
                1 for match in recent_matches
                if match.winner_id == team_id
            )

            total = len(recent_matches)

            return {
                "matches_played": total,
                "wins": wins,
                "losses": sum(
                    1 for match in recent_matches
                    if match.winner_id is not None
                    and match.winner_id != team_id
                ),
                "win_percentage": round(
                    (wins / total) * 100, 2
                ) if total else 50.0
            }

        team1_recent = get_recent_performance(team1_id)
        team2_recent = get_recent_performance(team2_id)

        # Use a neutral 50% head-to-head baseline when no
        # previous matches exist.
        h2h_team1_percentage = (
            (team1_wins / head_to_head_total) * 100
            if head_to_head_total else 50.0
        )

        h2h_team2_percentage = (
            (team2_wins / head_to_head_total) * 100
            if head_to_head_total else 50.0
        )

        # Weighted prediction:
        # 60% head-to-head + 40% recent performance.
        team1_score = (
            h2h_team1_percentage * 0.60
            + team1_recent["win_percentage"] * 0.40
        )

        team2_score = (
            h2h_team2_percentage * 0.60
            + team2_recent["win_percentage"] * 0.40
        )

        total_score = team1_score + team2_score

        if total_score:
            team1_probability = round(
                (team1_score / total_score) * 100, 2
            )
            team2_probability = round(
                100 - team1_probability, 2
            )
        else:
            team1_probability = 50.0
            team2_probability = 50.0

        predicted_winner = (
            team1.name if team1_probability > team2_probability
            else team2.name if team2_probability > team1_probability
            else "Evenly matched"
        )

        return Response({
            "team1": {
                "id": team1.id,
                "name": team1.name,
                "head_to_head_wins": team1_wins,
                "recent_performance": team1_recent,
                "winning_probability": team1_probability
            },
            "team2": {
                "id": team2.id,
                "name": team2.name,
                "head_to_head_wins": team2_wins,
                "recent_performance": team2_recent,
                "winning_probability": team2_probability
            },
            "head_to_head": {
                "total_matches": head_to_head_total,
                "team1_wins": team1_wins,
                "team2_wins": team2_wins
            },
            "prediction": {
                "predicted_winner": predicted_winner,
                "method": "60% head-to-head + 40% recent performance",
                "is_statistical_estimate": True
            }
        }, status=status.HTTP_200_OK)
