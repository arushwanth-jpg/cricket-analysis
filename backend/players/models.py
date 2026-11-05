from django.db import models
from django.db import models
from teams.models import Team


class Player(models.Model):

    ROLE_CHOICES = [("BATTER", "Batter"),("BOWLER", "Bowler"),("ALL_ROUNDER", "All Rounder"),("WICKET_KEEPER", "Wicket Keeper"),]
    BATTING_STYLE_CHOICES = [("RIGHT", "Right Hand"),("LEFT", "Left Hand"),]
    BOWLING_STYLE_CHOICES = [("FAST", "Fast"),("MEDIUM", "Medium"),("OFF_SPIN", "Off Spin"),("LEG_SPIN", "Leg Spin"),("LEFT_ARM_SPIN", "Left Arm Spin"),("NONE", "None"),]
    name = models.CharField(max_length=150)
    team = models.ForeignKey(Team,on_delete=models.SET_NULL,null=True,blank=True,related_name="players")
    country = models.CharField(max_length=100)
    role = models.CharField(max_length=20,choices=ROLE_CHOICES)
    batting_style = models.CharField(max_length=10,choices=BATTING_STYLE_CHOICES,default="RIGHT")
    bowling_style = models.CharField(max_length=20,choices=BOWLING_STYLE_CHOICES,default="NONE")
    date_of_birth = models.DateField(null=True, blank=True)
    photo_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name