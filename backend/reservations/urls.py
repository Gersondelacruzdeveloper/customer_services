from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ZoneViewSet,
    ProviderViewSet,
    ProviderServiceViewSet,
    HotelViewSet,
    ExcursionViewSet,
    PickupTimeViewSet,
    AgencyViewSet,
    ReservationViewSet,
    ReservationCostViewSet,
    ProviderPaymentViewSet,
    AgencyPaymentViewSet,
    ImportReservationsExcelView,
    OperationViewSet,
    AgencyExcursionPriceViewSet
)


router = DefaultRouter()

router.register("zones", ZoneViewSet)
router.register("providers", ProviderViewSet)
router.register("provider-services", ProviderServiceViewSet)
router.register("hotels", HotelViewSet)
router.register("excursions", ExcursionViewSet)
router.register("pickup-times", PickupTimeViewSet)
router.register("agencies", AgencyViewSet)
router.register("reservations", ReservationViewSet)
router.register("reservation-costs", ReservationCostViewSet)
router.register("provider-payments", ProviderPaymentViewSet)
router.register("agency-payments", AgencyPaymentViewSet)
router.register(r"operations", OperationViewSet, basename="operations")
router.register(r"agency-excursion-prices", AgencyExcursionPriceViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("import-excel/", ImportReservationsExcelView.as_view(), name="import-reservations-excel"),
]