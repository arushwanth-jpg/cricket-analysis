
from django.db import models
from players.models import Player
from matches.models import Match


class PlayerMatchStatistics(models.Model):

    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="match_statistics"
    )

    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="player_statistics"
    )

    match_format = models.CharField(
        max_length=10,
        choices=[
            ("T20", "T20"),
            ("ODI", "ODI"),
            ("TEST", "Test"),
            ("T10", "T10"),
        ]
    )

    # Batting statistics
    runs = models.PositiveIntegerField(default=0)
    balls_faced = models.PositiveIntegerField(default=0)
    fours = models.PositiveIntegerField(default=0)
    sixes = models.PositiveIntegerField(default=0)
    batting_innings = models.PositiveIntegerField(default=0)
    is_not_out = models.BooleanField(default=False)

    # Bowling statistics
    overs_bowled = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=0
    )
    runs_conceded = models.PositiveIntegerField(default=0)
    wickets = models.PositiveIntegerField(default=0)
    bowling_innings = models.PositiveIntegerField(default=0)
    maidens = models.PositiveIntegerField(default=0)

    # Fielding statistics
    catches = models.PositiveIntegerField(default=0)
    run_outs = models.PositiveIntegerField(default=0)
    stumpings = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-match__match_date"]
        unique_together = ("player", "match")

    def __str__(self):
        return f"{self.player.name} - {self.match.match_name}"
