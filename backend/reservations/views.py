from rest_framework import viewsets
from .models import (
    Zone,
    Provider,
    ProviderService,
    Hotel,
    Excursion,
    PickupTime,
    Agency,
    Reservation,
    ReservationCost,
    ProviderPayment,
    AgencyPayment,
)
from .serializers import (
    ZoneSerializer,
    ProviderSerializer,
    ProviderServiceSerializer,
    HotelSerializer,
    ExcursionSerializer,
    PickupTimeSerializer,
    AgencySerializer,
    ReservationSerializer,
    ReservationCostSerializer,
    ProviderPaymentSerializer,
    AgencyPaymentSerializer,
)


class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer


class ProviderViewSet(viewsets.ModelViewSet):
    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer


class ProviderServiceViewSet(viewsets.ModelViewSet):
    queryset = ProviderService.objects.select_related("provider").all()
    serializer_class = ProviderServiceSerializer


class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.select_related("zone").all()
    serializer_class = HotelSerializer


class ExcursionViewSet(viewsets.ModelViewSet):
    queryset = Excursion.objects.select_related("default_provider").all()
    serializer_class = ExcursionSerializer


class PickupTimeViewSet(viewsets.ModelViewSet):
    queryset = PickupTime.objects.select_related(
        "excursion",
        "hotel",
        "zone",
    ).all()
    serializer_class = PickupTimeSerializer


class AgencyViewSet(viewsets.ModelViewSet):
    queryset = Agency.objects.all()
    serializer_class = AgencySerializer


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related(
        "excursion",
        "hotel",
        "agency",
    ).prefetch_related("costs").all()
    serializer_class = ReservationSerializer


class ReservationCostViewSet(viewsets.ModelViewSet):
    queryset = ReservationCost.objects.select_related(
        "reservation",
        "provider_service",
        "provider",
    ).all()
    serializer_class = ReservationCostSerializer


class ProviderPaymentViewSet(viewsets.ModelViewSet):
    queryset = ProviderPayment.objects.select_related("provider").all()
    serializer_class = ProviderPaymentSerializer


class AgencyPaymentViewSet(viewsets.ModelViewSet):
    queryset = AgencyPayment.objects.select_related("agency").all()
    serializer_class = AgencyPaymentSerializer