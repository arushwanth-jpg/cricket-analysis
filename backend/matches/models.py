from django.db import models
from teams.models import Team


class Match(models.Model):

    FORMAT_CHOICES = [("T20", "T20"),("ODI", "One Day International"),("TEST", "Test"),("T10", "T10"),]
    STATUS_CHOICES = [("UPCOMING", "Upcoming"),("LIVE", "Live"),("COMPLETED", "Completed"),("ABANDONED", "Abandoned"),]
    match_name = models.CharField(max_length=200)
    team1 = models.ForeignKey(Team,on_delete=models.CASCADE,related_name="matches_as_team1")
    team2 = models.ForeignKey(Team,on_delete=models.CASCADE,related_name="matches_as_team2")
    match_format = models.CharField(max_length=10,choices=FORMAT_CHOICES)
    venue = models.CharField(max_length=200)
    match_date = models.DateTimeField()
    status = models.CharField(max_length=20,choices=STATUS_CHOICES,default="UPCOMING")
    toss_winner = models.ForeignKey(Team,on_delete=models.SET_NULL,null=True,blank=True,related_name="toss_wins")
    toss_decision = models.CharField(max_length=10,choices=[("BAT", "Bat"),("BOWL", "Bowl")],blank=True)
    winner = models.ForeignKey(Team,on_delete=models.SET_NULL,null=True,blank=True,related_name="match_wins")
    result = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-match_date"]

    def __str__(self):
        return self.match_name# Create your models here.
