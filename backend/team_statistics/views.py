
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from teams.models import Team
from matches.models import Match


class TeamComparisonView(APIView):

    def get(self, request):

        team1_id = request.query_params.get("team1")
        team2_id = request.query_params.get("team2")

        match_format = request.query_params.get("format")

        # ---------------------------------
        # VALIDATE TEAM IDS
        # ---------------------------------

        if not team1_id or not team2_id:
            return Response(
                {
                    "error": "Both team1 and team2 IDs are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            team1_id = int(team1_id)
            team2_id = int(team2_id)

            if team1_id <= 0 or team2_id <= 0:
                raise ValueError

        except (ValueError, TypeError):
            return Response(
                {
                    "error": "Team IDs must be valid positive integers."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ---------------------------------
        # PREVENT SAME TEAM
        # ---------------------------------

        if team1_id == team2_id:
            return Response(
                {
                    "error": "Please select two different teams."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ---------------------------------
        # VALIDATE MATCH FORMAT
        # ---------------------------------

        allowed_formats = ["T20", "ODI", "TEST", "T10"]

        if match_format:
            match_format = match_format.upper()

            if match_format not in allowed_formats:
                return Response(
                    {
                        "error": "Invalid format. Use T20, ODI, TEST or T10."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # ---------------------------------
        # FETCH TEAMS
        # ---------------------------------

        teams = Team.objects.filter(
            id__in=[team1_id, team2_id]
        )

        teams_by_id = {
            team.id: team
            for team in teams
        }

        if (
            team1_id not in teams_by_id
            or team2_id not in teams_by_id
        ):
            return Response(
                {
                    "error": "One or both teams were not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        team1 = teams_by_id[team1_id]
        team2 = teams_by_id[team2_id]

        # ---------------------------------
        # FETCH HEAD-TO-HEAD MATCHES
        # ---------------------------------

        matches = Match.objects.filter(
            Q(team1_id=team1_id, team2_id=team2_id)
            | Q(team1_id=team2_id, team2_id=team1_id),
            status="COMPLETED"
        ).select_related(
            "team1",
            "team2",
            "winner"
        ).order_by("-match_date")

        if match_format:
            matches = matches.filter(
                match_format=match_format
            )

        total_matches = matches.count()

        # ---------------------------------
        # CALCULATE RESULTS
        # ---------------------------------

        team1_wins = matches.filter(
            winner_id=team1_id
        ).count()

        team2_wins = matches.filter(
            winner_id=team2_id
        ).count()

        # A completed match without a winner is classified
        # as a draw/tie only when its result indicates one.
        # Other completed matches without a winner are
        # classified as no-result.
        draw_query = (
            Q(result__icontains="draw")
            | Q(result__icontains="tie")
        )

        draws = matches.filter(
            winner__isnull=True
        ).filter(draw_query).count()

        no_results = matches.filter(
            winner__isnull=True
        ).exclude(draw_query).count()

        team1_losses = team2_wins
        team2_losses = team1_wins

        team1_win_percentage = (
            round((team1_wins / total_matches) * 100, 2)
            if total_matches else 0
        )

        team2_win_percentage = (
            round((team2_wins / total_matches) * 100, 2)
            if total_matches else 0
        )

        # ---------------------------------
        # RECENT MATCH RESULTS
        # ---------------------------------

        recent_matches = []

        for match in matches[:10]:

            if match.winner_id == team1_id:
                result_status = "TEAM1_WIN"

            elif match.winner_id == team2_id:
                result_status = "TEAM2_WIN"

            elif match.winner_id is None and (
                "draw" in (match.result or "").lower()
                or "tie" in (match.result or "").lower()
            ):
                result_status = "DRAW"

            else:
                result_status = "NO_RESULT"

            recent_matches.append({
                "id": match.id,
                "match_name": match.match_name,
                "team1": match.team1.name,
                "team2": match.team2.name,
                "match_format": match.match_format,
                "venue": match.venue,
                "match_date": match.match_date,
                "winner": (
                    match.winner.name
                    if match.winner else None
                ),
                "result": match.result,
                "status": result_status,
            })

        # ---------------------------------
        # RESPONSE
        # ---------------------------------

        return Response(
            {
                "team1": {
                    "id": team1.id,
                    "name": team1.name,
                    "short_name": team1.short_name,
                    "country": team1.country,
                    "logo_url": team1.logo_url,
                    "matches_played": total_matches,
                    "wins": team1_wins,
                    "losses": team1_losses,
                    "draws": draws,
                    "no_results": no_results,
                    "win_percentage": team1_win_percentage,
                },

                "team2": {
                    "id": team2.id,
                    "name": team2.name,
                    "short_name": team2.short_name,
                    "country": team2.country,
                    "logo_url": team2.logo_url,
                    "matches_played": total_matches,
                    "wins": team2_wins,
                    "losses": team2_losses,
                    "draws": draws,
                    "no_results": no_results,
                    "win_percentage": team2_win_percentage,
                },

                "summary": {
                    "total_matches": total_matches,
                    "draws": draws,
                    "no_results": no_results,
                    "format": match_format or "ALL",
                },

                "recent_matches": recent_matches,
            },
            status=status.HTTP_200_OK
        )
