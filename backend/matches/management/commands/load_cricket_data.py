from datetime import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone

from teams.models import Team
from players.models import Player
from matches.models import Match


class Command(BaseCommand):
    help = "Load sample IPL teams, players and matches"

    def handle(self, *args, **kwargs):
        teams_data = [
            ("Chennai Super Kings", "CSK", "India"),
            ("Mumbai Indians", "MI", "India"),
            ("Royal Challengers Bengaluru", "RCB", "India"),
            ("Sunrisers Hyderabad", "SRH", "India"),
            ("Kolkata Knight Riders", "KKR", "India"),
            ("Rajasthan Royals", "RR", "India"),
            ("Delhi Capitals", "DC", "India"),
            ("Punjab Kings", "PBKS", "India"),
            ("Gujarat Titans", "GT", "India"),
            ("Lucknow Super Giants", "LSG", "India"),
        ]

        teams = {}

        for name, short_name, country in teams_data:
            team, _ = Team.objects.update_or_create(
                short_name=short_name,
                defaults={
                    "name": name,
                    "country": country,
                },
            )
            teams[short_name] = team

        self.stdout.write(self.style.SUCCESS("Teams loaded"))

        players_data = [
            ("MS Dhoni", "CSK", "WICKET_KEEPER", "RIGHT", "NONE"),
            ("Ruturaj Gaikwad", "CSK", "BATTER", "RIGHT", "NONE"),
            ("Ravindra Jadeja", "CSK", "ALL_ROUNDER", "LEFT", "LEFT_ARM_SPIN"),
            ("Rohit Sharma", "MI", "BATTER", "RIGHT", "NONE"),
            ("Jasprit Bumrah", "MI", "BOWLER", "RIGHT", "FAST"),
            ("Hardik Pandya", "MI", "ALL_ROUNDER", "RIGHT", "MEDIUM"),
            ("Virat Kohli", "RCB", "BATTER", "RIGHT", "NONE"),
            ("Rajat Patidar", "RCB", "BATTER", "RIGHT", "NONE"),
            ("Bhuvneshwar Kumar", "RCB", "BOWLER", "RIGHT", "MEDIUM"),
            ("Pat Cummins", "SRH", "BOWLER", "RIGHT", "FAST"),
            ("Travis Head", "SRH", "BATTER", "LEFT", "NONE"),
            ("Abhishek Sharma", "SRH", "ALL_ROUNDER", "LEFT", "LEFT_ARM_SPIN"),
            ("Sunil Narine", "KKR", "ALL_ROUNDER", "LEFT", "OFF_SPIN"),
            ("Rinku Singh", "KKR", "BATTER", "LEFT", "NONE"),
            ("Sanju Samson", "RR", "WICKET_KEEPER", "RIGHT", "NONE"),
            ("Yashasvi Jaiswal", "RR", "BATTER", "LEFT", "NONE"),
            ("KL Rahul", "DC", "WICKET_KEEPER", "RIGHT", "NONE"),
            ("Axar Patel", "DC", "ALL_ROUNDER", "LEFT", "LEFT_ARM_SPIN"),
            ("Shreyas Iyer", "PBKS", "BATTER", "RIGHT", "NONE"),
            ("Arshdeep Singh", "PBKS", "BOWLER", "LEFT", "MEDIUM"),
            ("Shubman Gill", "GT", "BATTER", "RIGHT", "NONE"),
            ("Rashid Khan", "GT", "BOWLER", "RIGHT", "LEG_SPIN"),
            ("Rishabh Pant", "LSG", "WICKET_KEEPER", "LEFT", "NONE"),
            ("Nicholas Pooran", "LSG", "WICKET_KEEPER", "LEFT", "NONE"),
        ]

        for name, team_code, role, batting, bowling in players_data:
            Player.objects.update_or_create(
                name=name,
                defaults={
                    "team": teams[team_code],
                    "country": "India",
                    "role": role,
                    "batting_style": batting,
                    "bowling_style": bowling,
                },
            )

        self.stdout.write(self.style.SUCCESS("Players loaded"))

        matches_data = [
            (
                "CSK vs MI",
                "CSK",
                "MI",
                "T20",
                "MA Chidambaram Stadium",
                "2025-04-05 19:30",
                "CSK",
                "CSK won by 4 wickets",
            ),
            (
                "RCB vs SRH",
                "RCB",
                "SRH",
                "T20",
                "M Chinnaswamy Stadium",
                "2025-04-15 19:30",
                "SRH",
                "SRH won by 42 runs",
            ),
            (
                "KKR vs RR",
                "KKR",
                "RR",
                "T20",
                "Eden Gardens",
                "2025-04-26 19:30",
                "KKR",
                "KKR won by 1 run",
            ),
            (
                "GT vs LSG",
                "GT",
                "LSG",
                "T20",
                "Narendra Modi Stadium",
                "2025-05-10 19:30",
                "GT",
                "GT won by 7 wickets",
            ),
        ]

        for (
            name, team1, team2, fmt, venue,
            date, winner, result
        ) in matches_data:

            match_date = timezone.make_aware(
                datetime.strptime(date, "%Y-%m-%d %H:%M")
            )

            Match.objects.update_or_create(
                match_name=name,
                match_date=match_date,
                defaults={
                    "team1": teams[team1],
                    "team2": teams[team2],
                    "match_format": fmt,
                    "venue": venue,
                    "status": "COMPLETED",
                    "winner": teams[winner],
                    "result": result,
                },
            )

        self.stdout.write(
            self.style.SUCCESS("Sample matches loaded")
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Total teams: {Team.objects.count()}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Total players: {Player.objects.count()}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Total matches: {Match.objects.count()}"
            )
        )