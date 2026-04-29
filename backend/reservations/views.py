from rest_framework import viewsets
import pandas as pd
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


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



# reservations/views.py
class ImportReservationsExcelView(APIView):
    def post(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        try:
            df = pd.read_excel(file)
            created = 0
            skipped = 0
            errors = []

            for index, row in df.iterrows():
                try:
                    locator = str(row.get("Localizador", "")).strip()

                    if not locator or locator == "nan":
                        skipped += 1
                        continue

                    lead_name = str(row.get("Titular de la reserva", "")).strip()
                    service_name = str(row.get("Nombre del servicio", "")).strip()
                    hotel_name = str(row.get("Punto de encuentro", "")).strip()

                    service_date_raw = row.get("Fecha del servicio")
                    pickup_time_raw = row.get("Hora Inicio")

                    adults = int(row.get("Adultos", 0) or 0)
                    children = int(row.get("Niños", 0) or 0)

                    excursion, _ = Excursion.objects.get_or_create(
                        name=service_name
                    )

                    hotel, _ = Hotel.objects.get_or_create(
                        name=hotel_name
                    )

                    service_date = pd.to_datetime(service_date_raw).date()

                    pickup_time = None
                    if pd.notna(pickup_time_raw):
                        pickup_time = pd.to_datetime(str(pickup_time_raw)).time()

                    Reservation.objects.update_or_create(
                        locator=locator,
                        defaults={
                            "lead_name": lead_name,
                            "excursion": excursion,
                            "hotel": hotel,
                            "service_date": service_date,
                            "pickup_time": pickup_time,
                            "adults": adults,
                            "children": children,
                            "infants": 0,
                            "status": "confirmed",
                            "language": "en",
                            "currency": "USD",
                        },
                    )

                    created += 1

                except Exception as e:
                    errors.append({
                        "row": index + 2,
                        "error": str(e),
                    })

            return Response({
                "message": "Import completed",
                "created_or_updated": created,
                "skipped": skipped,
                "errors": errors,
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)