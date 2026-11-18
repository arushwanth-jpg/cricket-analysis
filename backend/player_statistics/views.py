
from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response

from players.models import Player
from .models import PlayerMatchStatistics
from .serializers import PlayerMatchStatisticsSerializer


# =====================================================
# PLAYER STATISTICS LIST AND CREATE
# =====================================================

class PlayerStatisticsListCreateView(generics.ListCreateAPIView):

    queryset = PlayerMatchStatistics.objects.select_related(
        "player",
        "match"
    ).all()

    serializer_class = PlayerMatchStatisticsSerializer

    filter_backends = [filters.SearchFilter]

    search_fields = [
        "player__name",
        "match__match_name"
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        player_id = self.request.query_params.get("player")
        match_id = self.request.query_params.get("match")
        match_format = self.request.query_params.get("format")

        if player_id:
            queryset = queryset.filter(player_id=player_id)

        if match_id:
            queryset = queryset.filter(match_id=match_id)

        if match_format:
            queryset = queryset.filter(
                match_format=match_format.upper()
            )

        return queryset


# =====================================================
# PLAYER STATISTICS DETAIL
# =====================================================

class PlayerStatisticsDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    queryset = PlayerMatchStatistics.objects.select_related(
        "player",
        "match"
    ).all()

    serializer_class = PlayerMatchStatisticsSerializer


# =====================================================
# CRICKET OVERS CONVERSION
# =====================================================

def overs_to_balls(overs):
    """
    Convert cricket overs notation into legal balls.

    4.0 = 24 balls
    4.2 = 26 balls
    4.5 = 29 balls

    Decimal notation is interpreted as cricket notation,
    not ordinary decimal overs.
    """

    value = str(overs or "0")

    whole, separator, remainder = value.partition(".")

    overs_count = int(whole or 0)

    if separator:
        if not remainder or not remainder.isdigit():
            raise ValueError("Invalid cricket overs notation.")

        balls_count = int(remainder)

        if balls_count > 5 or len(remainder) != 1:
            raise ValueError("Invalid cricket overs notation.")
    else:
        balls_count = 0

    return (overs_count * 6) + balls_count


def balls_to_overs(total_balls):
    """
    Convert legal balls into cricket overs notation.

    24 balls = 4.0
    26 balls = 4.2
    29 balls = 4.5
    """

    return f"{total_balls // 6}.{total_balls % 6}"


# =====================================================
# PLAYER PERFORMANCE CALCULATIONS
# =====================================================

def get_player_comparison(player, match_format=None):

    queryset = PlayerMatchStatistics.objects.filter(
        player=player,
        match__status="COMPLETED"
    )

    if match_format:
        queryset = queryset.filter(
            match_format=match_format
        )

    records = list(queryset)

    # -----------------------------
    # GENERAL STATISTICS
    # -----------------------------

    total_matches = queryset.values(
        "match_id"
    ).distinct().count()

    # -----------------------------
    # BATTING STATISTICS
    # -----------------------------

    total_runs = sum(
        record.runs for record in records
    )

    balls_faced = sum(
        record.balls_faced for record in records
    )

    batting_innings = sum(
        record.batting_innings for record in records
    )

    not_outs = sum(
        1 for record in records if record.is_not_out
    )

    dismissals = max(
        batting_innings - not_outs,
        0
    )

    batting_average = (
        round(total_runs / dismissals, 2)
        if dismissals > 0 else None
    )

    strike_rate = (
        round((total_runs / balls_faced) * 100, 2)
        if balls_faced > 0 else None
    )

    centuries = sum(
        1 for record in records
        if record.runs >= 100
    )

    half_centuries = sum(
        1 for record in records
        if 50 <= record.runs < 100
    )

    total_fours = sum(
        record.fours for record in records
    )

    total_sixes = sum(
        record.sixes for record in records
    )

    # -----------------------------
    # BOWLING STATISTICS
    # -----------------------------

    total_wickets = sum(
        record.wickets for record in records
    )

    runs_conceded = sum(
        record.runs_conceded for record in records
    )

    bowling_innings = sum(
        record.bowling_innings for record in records
    )

    total_overs_in_balls = sum(
        overs_to_balls(record.overs_bowled)
        for record in records
    )

    bowling_average = (
        round(runs_conceded / total_wickets, 2)
        if total_wickets > 0 else None
    )

    economy_rate = (
        round(
            (runs_conceded * 6) / total_overs_in_balls,
            2
        )
        if total_overs_in_balls > 0 else None
    )

    bowling_strike_rate = (
        round(
            total_overs_in_balls / total_wickets,
            2
        )
        if total_wickets > 0 else None
    )

    total_maidens = sum(
        record.maidens for record in records
    )

    # -----------------------------
    # FIELDING STATISTICS
    # -----------------------------

    total_catches = sum(
        record.catches for record in records
    )

    total_run_outs = sum(
        record.run_outs for record in records
    )

    total_stumpings = sum(
        record.stumpings for record in records
    )

    # -----------------------------
    # RESPONSE
    # -----------------------------

    return {
        "player": {
            "id": player.id,
            "name": player.name,
            "country": player.country,
            "role": player.role,
            "team": (
                player.team.name
                if player.team else None
            ),
            "photo_url": player.photo_url,
        },

        "format": match_format or "ALL",

        "matches": total_matches,

        "batting": {
            "innings": batting_innings,
            "runs": total_runs,
            "balls_faced": balls_faced,
            "not_outs": not_outs,
            "dismissals": dismissals,
            "average": batting_average,
            "strike_rate": strike_rate,
            "centuries": centuries,
            "half_centuries": half_centuries,
            "fours": total_fours,
            "sixes": total_sixes,
        },

        "bowling": {
            "innings": bowling_innings,
            "overs_bowled": balls_to_overs(
                total_overs_in_balls
            ),
            "legal_balls": total_overs_in_balls,
            "runs_conceded": runs_conceded,
            "wickets": total_wickets,
            "average": bowling_average,
            "economy": economy_rate,
            "strike_rate": bowling_strike_rate,
            "maidens": total_maidens,
        },

        "fielding": {
            "catches": total_catches,
            "run_outs": total_run_outs,
            "stumpings": total_stumpings,
        },
    }


# =====================================================
# PLAYER COMPARISON API
# =====================================================

class PlayerComparisonView(APIView):

    def get(self, request):

        player1_id = request.query_params.get("player1")
        player2_id = request.query_params.get("player2")

        match_format = request.query_params.get("format")

        # -----------------------------
        # VALIDATE PLAYER IDS
        # -----------------------------

        if not player1_id or not player2_id:

            return Response(
                {
                    "error": (
                        "Both player1 and player2 IDs are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            player1_id = int(player1_id)
            player2_id = int(player2_id)

            if player1_id <= 0 or player2_id <= 0:
                raise ValueError

        except (ValueError, TypeError):

            return Response(
                {"error": "Player IDs must be valid positive integers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------
        # VALIDATE FORMAT
        # -----------------------------

        allowed_formats = [
            "T20",
            "ODI",
            "TEST",
            "T10"
        ]

        if match_format:

            match_format = match_format.upper()

            if match_format not in allowed_formats:

                return Response(
                    {
                        "error": (
                            "Invalid format. "
                            "Use T20, ODI, TEST or T10."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # -----------------------------
        # PREVENT SAME PLAYER
        # -----------------------------

        if player1_id == player2_id:

            return Response(
                {
                    "error": "Please select two different players."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------
        # FETCH PLAYERS
        # -----------------------------

        players = Player.objects.select_related(
            "team"
        ).filter(
            id__in=[player1_id, player2_id]
        )

        players_by_id = {
            player.id: player
            for player in players
        }

        if (
            player1_id not in players_by_id
            or player2_id not in players_by_id
        ):

            return Response(
                {
                    "error": "One or both players were not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        player1 = players_by_id[player1_id]
        player2 = players_by_id[player2_id]

        # -----------------------------
        # GENERATE COMPARISON
        # -----------------------------

        try:

            comparison = {
                "player1": get_player_comparison(
                    player1,
                    match_format
                ),

                "player2": get_player_comparison(
                    player2,
                    match_format
                ),
            }

            return Response(
                comparison,
                status=status.HTTP_200_OK
            )

        except ValueError as error:

            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception:
            # Log the exception in production rather than
            # exposing internal server details to the client.
            import logging

            logger = logging.getLogger(__name__)
            logger.exception("Player comparison failed.")

            return Response(
                {
                    "error": "Unable to calculate player comparison."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
