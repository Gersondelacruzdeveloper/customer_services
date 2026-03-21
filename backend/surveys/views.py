from rest_framework import generics,permissions
from .models import Hotel,Survey, Guide, Excursion, TourOperator
from .serializers import HotelSerializer, SurveySerializer, GuideSerializer, ExcursionSerializer, TourOperatorSerializer

class HotelListView(generics.ListAPIView):
    queryset = Hotel.objects.all().order_by("name")
    serializer_class = HotelSerializer


class GuideListView(generics.ListAPIView):
    queryset = Guide.objects.all().order_by("name")
    serializer_class = GuideSerializer


class ExcursionListView(generics.ListAPIView):
    queryset = Excursion.objects.all().order_by("name")
    serializer_class = ExcursionSerializer


class TourOperatorListView(generics.ListAPIView):
    queryset = TourOperator.objects.all().order_by("name")
    serializer_class = TourOperatorSerializer


class SurveyCreateView(generics.CreateAPIView):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [permissions.AllowAny]

