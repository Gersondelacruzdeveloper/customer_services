from rest_framework import serializers
from .models import Hotel, Guide, Excursion, TourOperator, Survey
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff", "is_superuser"]

class HotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = ["id", "name"]

class GuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guide
        fields = ["id", "name"]

class ExcursionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Excursion
        fields = ["id", "name"]

class TourOperatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourOperator
        fields = ["id", "name"]

class SurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = "__all__"