
from rest_framework import serializers
from .models import PlayerMatchStatistics


class PlayerMatchStatisticsSerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(
        source="player.name",
        read_only=True
    )

    match_name = serializers.CharField(
        source="match.match_name",
        read_only=True
    )

    class Meta:
        model = PlayerMatchStatistics
        fields = "__all__"

    def validate(self, attrs):
        player = attrs.get("player", getattr(self.instance, "player", None))
        match = attrs.get("match", getattr(self.instance, "match", None))

        if player and match:
            if player.team_id not in (match.team1_id, match.team2_id):
                raise serializers.ValidationError(
                    "The selected player must belong to one of the teams playing this match."
                )

        if match and "match_format" in attrs:
            if attrs["match_format"] != match.match_format:
                raise serializers.ValidationError(
                    "The statistics format must match the match format."
                )

        return attrs
