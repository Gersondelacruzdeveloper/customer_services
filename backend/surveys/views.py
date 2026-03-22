from rest_framework import generics,permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Hotel,Survey, Guide, Excursion, TourOperator
from .serializers import HotelSerializer, SurveySerializer, GuideSerializer, ExcursionSerializer, TourOperatorSerializer, UserSerializer
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count

from .permissions import IsStaffUser

class StaffOnlyPermission(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_staff


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    

class HotelListCreateView(generics.ListCreateAPIView):
    queryset = Hotel.objects.all().order_by("name")
    serializer_class = HotelSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return []
        return [StaffOnlyPermission()]

class HotelDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    permission_classes = [StaffOnlyPermission]


class GuideListCreateView(generics.ListCreateAPIView):
    queryset = Guide.objects.all().order_by("name")
    serializer_class = GuideSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return []
        return [StaffOnlyPermission()]

class GuideDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Guide.objects.all()
    serializer_class = GuideSerializer
    permission_classes = [StaffOnlyPermission]

class ExcursionListCreateView(generics.ListCreateAPIView):
    queryset = Excursion.objects.all().order_by("name")
    serializer_class = ExcursionSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return []
        return [StaffOnlyPermission()]

class ExcursionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Excursion.objects.all()
    serializer_class = ExcursionSerializer
    permission_classes = [StaffOnlyPermission]


class TourOperatorListCreateView(generics.ListCreateAPIView):
    queryset = TourOperator.objects.all().order_by("name")
    serializer_class = TourOperatorSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return []
        return [StaffOnlyPermission()]


class TourOperatorDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TourOperator.objects.all()
    serializer_class = TourOperatorSerializer
    permission_classes = [StaffOnlyPermission]
    
class SurveyCreateView(generics.CreateAPIView):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [permissions.AllowAny]




class DashboardStatsView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        surveys = Survey.objects.select_related(
            "hotel", "guide", "excursion", "tour_operator"
        )

        total_surveys = surveys.count()
        total_participants = sum(s.participants for s in surveys)

        category_averages = {
            "punctuality": surveys.aggregate(avg=Avg("punctuality"))["avg"] or 0,
            "transport": surveys.aggregate(avg=Avg("transport"))["avg"] or 0,
            "guide": surveys.aggregate(avg=Avg("guide_rating"))["avg"] or 0,
            "food": surveys.aggregate(avg=Avg("food"))["avg"] or 0,
        }

        hotel_counts_raw = (
            surveys.values("hotel__name")
            .annotate(value=Count("id"))
            .order_by("-value")
        )

        hotel_counts = [
            {"name": row["hotel__name"], "value": row["value"]}
            for row in hotel_counts_raw
            if row["hotel__name"]
        ]

        excursion_counts_raw = (
            surveys.values("excursion__name")
            .annotate(value=Count("id"))
            .order_by("-value")
        )

        excursion_counts = [
            {"name": row["excursion__name"], "value": row["value"]}
            for row in excursion_counts_raw
            if row["excursion__name"]
        ]

        guide_groups = surveys.values("guide__name").annotate(
            avg_punctuality=Avg("punctuality"),
            avg_transport=Avg("transport"),
            avg_guide=Avg("guide_rating"),
            avg_food=Avg("food"),
            total=Count("id"),
        )

        guide_performance = []
        for row in guide_groups:
            if not row["guide__name"]:
                continue

            score = (
                (row["avg_punctuality"] or 0)
                + (row["avg_transport"] or 0)
                + (row["avg_guide"] or 0)
                + (row["avg_food"] or 0)
            ) / 4

            guide_performance.append(
                {
                    "name": row["guide__name"],
                    "score": round(score, 2),
                    "total": row["total"],
                }
            )

        guide_performance.sort(key=lambda x: x["score"], reverse=True)

        comments = [
            {
                "comments": s.comments,
                "client_name": s.client_name,
                "hotel": s.hotel.name if s.hotel else "",
            }
            for s in surveys.exclude(comments="").order_by("-created_at")[:5]
        ]

        return Response(
            {
                "totalSurveys": total_surveys,
                "totalParticipants": total_participants,
                "categoryAverages": category_averages,
                "hotelCounts": hotel_counts,
                "excursionCounts": excursion_counts,
                "guidePerformance": guide_performance,
                "happiestGuide": guide_performance[0] if guide_performance else None,
                "topHotel": hotel_counts[0] if hotel_counts else None,
                "comments": comments,
            }
        )