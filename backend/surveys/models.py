from django.db import models


class Hotel(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Guide(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Excursion(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class TourOperator(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Survey(models.Model):
    excursion = models.ForeignKey(Excursion, on_delete=models.SET_NULL, null=True)
    hotel = models.ForeignKey(Hotel, on_delete=models.SET_NULL, null=True)
    date = models.DateField()
    participants = models.PositiveIntegerField(default=0)

    client_name = models.CharField(max_length=255)
    room_no = models.CharField(max_length=100, blank=True)

    tour_operator = models.ForeignKey(TourOperator, on_delete=models.SET_NULL, null=True)
    guide = models.ForeignKey(Guide, on_delete=models.SET_NULL, null=True)

    punctuality = models.PositiveSmallIntegerField(default=0)
    transport = models.PositiveSmallIntegerField(default=0)
    guide_rating = models.PositiveSmallIntegerField(default=0)
    food = models.PositiveSmallIntegerField(default=0)

    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.client_name}"