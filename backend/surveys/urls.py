from django.urls import path
from .views import (
    HotelListView,
    GuideListView,
    ExcursionListView,
    TourOperatorListView,
    SurveyCreateView,
    MeView,
    DashboardStatsView,
)

urlpatterns = [
    path("hotels/", HotelListView.as_view(), name="hotels"),
    path("guides/", GuideListView.as_view(), name="guides"),
    path("excursions/", ExcursionListView.as_view(), name="excursions"),
    path("operators/", TourOperatorListView.as_view(), name="operators"),
    path("surveys/", SurveyCreateView.as_view(), name="surveys"),
    path("me/", MeView.as_view(), name="me"),
    path("dashboard-stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]