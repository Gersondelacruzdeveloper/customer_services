from django.urls import path
from .views import (
    HotelListCreateView,
    HotelDetailView,
    GuideListCreateView,
    GuideDetailView,
    ExcursionListCreateView,
    ExcursionDetailView,
    TourOperatorListCreateView,
    TourOperatorDetailView,
    SurveyCreateView,
    MeView,
    DashboardStatsView,
)

urlpatterns = [
    path("hotels/", HotelListCreateView.as_view(), name="hotels"),
    path("hotels/<int:pk>/", HotelDetailView.as_view(), name="hotel-detail"),

    path("guides/", GuideListCreateView.as_view(), name="guides"),
    path("guides/<int:pk>/", GuideDetailView.as_view(), name="guide-detail"),

    path("excursions/", ExcursionListCreateView.as_view(), name="excursions"),
    path("excursions/<int:pk>/", ExcursionDetailView.as_view(), name="excursion-detail"),

    path("operators/", TourOperatorListCreateView.as_view(), name="operators"),
    path("operators/<int:pk>/", TourOperatorDetailView.as_view(), name="operator-detail"),

    path("surveys/", SurveyCreateView.as_view(), name="surveys"),
    path("me/", MeView.as_view(), name="me"),
    path("dashboard-stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]