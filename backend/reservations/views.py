from rest_framework import viewsets
import pandas as pd
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

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
    Operation,
    AgencyExcursionPrice,
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
    OperationSerializer,
    AgencyExcursionPriceSerializer,
    AgencyAccessSerializer,
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

    @action(detail=False, methods=["post"], url_path="import-excel")
    def import_excel(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response(
                {"error": "No file uploaded"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            df = pd.read_excel(file)
        except Exception as e:
            return Response(
                {"error": f"Invalid Excel file: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_or_updated = 0
        errors = []

        for index, row in df.iterrows():
            row_number = index + 2

            try:
                name = (
                    str(row.get("name", "") or "").strip()
                    or str(row.get("hotel", "") or "").strip()
                    or str(row.get("hotel name", "") or "").strip()
                    or str(row.get("Hotel", "") or "").strip()
                    or str(row.get("HOTEL", "") or "").strip()
                    or str(row.get("hoteles", "") or "").strip()
                    or str(row.get("HOTELES", "") or "").strip()
                )

                if not name:
                    errors.append({
                        "row": row_number,
                        "error": "Missing hotel name",
                    })
                    continue

                zone_name = str(row.get("zone", "") or "").strip()
                area = str(row.get("area", "") or "").strip()
                address = str(row.get("address", "") or "").strip()
                pickup_note = str(row.get("pickup_note", "") or "").strip()
                is_active = row.get("is_active", True)

                zone = None
                if zone_name:
                    zone = Zone.objects.filter(name__iexact=zone_name).first()

                    if not zone:
                        zone = Zone.objects.filter(code__iexact=zone_name).first()

                if isinstance(is_active, str):
                    is_active = is_active.strip().lower() in [
                        "true",
                        "yes",
                        "1",
                        "active",
                    ]

                Hotel.objects.update_or_create(
                    name=name,
                    defaults={
                        "zone": zone,
                        "area": area,
                        "address": address,
                        "pickup_note": pickup_note,
                        "is_active": bool(is_active),
                    },
                )

                created_or_updated += 1

            except Exception as e:
                errors.append({
                    "row": row_number,
                    "error": str(e),
                })

        return Response({
            "created_or_updated": created_or_updated,
            "errors": errors,
        })


class ExcursionViewSet(viewsets.ModelViewSet):
    queryset = Excursion.objects.select_related("default_provider").all()
    serializer_class = ExcursionSerializer

    @action(detail=False, methods=["post"], url_path="import-excel")
    def import_excel(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response(
                {"error": "No file uploaded"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            df = pd.read_excel(file)
        except Exception as e:
            return Response(
                {"error": f"Invalid Excel file: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_or_updated = 0
        errors = []

        for index, row in df.iterrows():
            row_number = index + 2

            try:
                name = (
                    str(row.get("name", "") or "").strip()
                    or str(row.get("excursion", "") or "").strip()
                    or str(row.get("excursion name", "") or "").strip()
                    or str(row.get("excursion_name", "") or "").strip()
                    or str(row.get("Excursion", "") or "").strip()
                    or str(row.get("EXCURSION", "") or "").strip()
                    or str(row.get("hotel", "") or "").strip()
                    or str(row.get("hotel name", "") or "").strip()
                    or str(row.get("hotel_name", "") or "").strip()
                    or str(row.get("Hotel", "") or "").strip()
                    or str(row.get("HOTEL", "") or "").strip()
                    or str(row.get("hoteles", "") or "").strip()
                    or str(row.get("HOTELES", "") or "").strip()
                )

                if not name:
                    errors.append({
                        "row": row_number,
                        "error": "Missing excursion name",
                    })
                    continue

                description = str(row.get("description", "") or "").strip()

                default_sale_price = row.get("default_sale_price", 0)
                currency = str(row.get("currency", "USD") or "USD").strip().upper()
                is_active = row.get("is_active", True)

                provider_name = str(row.get("default_provider", "") or "").strip()
                default_provider = None

                if provider_name:
                    default_provider = Provider.objects.filter(
                        name__iexact=provider_name
                    ).first()

                if isinstance(is_active, str):
                    is_active = is_active.strip().lower() in [
                        "true",
                        "yes",
                        "1",
                        "active",
                    ]

                Excursion.objects.update_or_create(
                    name=name,
                    defaults={
                        "description": description,
                        "default_sale_price": default_sale_price or 0,
                        "currency": currency or "USD",
                        "default_provider": default_provider,
                        "is_active": bool(is_active),
                    },
                )

                created_or_updated += 1

            except Exception as e:
                errors.append({
                    "row": row_number,
                    "error": str(e),
                })

        return Response({
            "created_or_updated": created_or_updated,
            "errors": errors,
        })

# ------------------------------------------------PickupTimeViewSet
class PickupTimeViewSet(viewsets.ModelViewSet):
    queryset = PickupTime.objects.select_related(
        "hotel",
        "zone",
    ).all()
    serializer_class = PickupTimeSerializer

    @action(detail=False, methods=["post"], url_path="import-excel")
    def import_excel(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response(
                {"error": "No file uploaded"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            df = pd.read_excel(file)
        except Exception as e:
            return Response(
                {"error": f"Invalid Excel file: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        df.columns = [str(col).strip().lower() for col in df.columns]

        created_or_updated = 0
        errors = []

        matrix_excursion_columns = [
            "city tour santo domingo",
            "city tour sdq",
            "saona island",
            "samana / haitises",
            "samana / haiti ses",
            "catalina island",
            "isla catalina",
            'Saona Clasica Lancha-Catamaran',
        ]

        is_matrix = (
            "hotel" in df.columns
            and any(col in df.columns for col in matrix_excursion_columns)
        )

        if is_matrix:
            for index, row in df.iterrows():
                row_number = index + 2

                hotel_name = str(row.get("hotel", "") or "").strip()
                zone_name = str(row.get("zone", "") or "").strip()

                if not hotel_name:
                    continue

                hotel = Hotel.objects.filter(name__iexact=hotel_name).first()

                if not hotel:
                    errors.append({
                        "row": row_number,
                        "error": f"Hotel not found: {hotel_name}",
                    })
                    continue

                zone = None
                if zone_name:
                    zone, _ = Zone.objects.get_or_create(name=zone_name)

                for excursion_col in matrix_excursion_columns:
                    if excursion_col not in df.columns:
                        continue

                    time_value = row.get(excursion_col)

                    if pd.isna(time_value) or not str(time_value).strip():
                        continue

                    excursion_name = self.clean_excursion_name(excursion_col)

                    excursion = Excursion.objects.filter(
                        name__iexact=excursion_name
                    ).first()

                    if not excursion:
                        errors.append({
                            "row": row_number,
                            "error": f"Excursion not found: {excursion_name}",
                        })
                        continue

                    clean_time = self.clean_time(time_value)

                    PickupTime.objects.update_or_create(
                        excursion=excursion,
                        hotel=hotel,
                        defaults={
                            "zone": zone,
                            "time": clean_time,
                        },
                    )

                    created_or_updated += 1

            return Response({
                "format": "matrix",
                "created_or_updated": created_or_updated,
                "errors": errors,
            })

        for index, row in df.iterrows():
            row_number = index + 2

            try:
                excursion_name = str(
                    row.get("excursion", "") or row.get("excursion_name", "") or ""
                ).strip()

                hotel_name = str(
                    row.get("hotel", "") or row.get("hotel_name", "") or ""
                ).strip()

                zone_name = str(
                    row.get("zone", "") or row.get("zone_name", "") or ""
                ).strip()

                time_value = row.get("time", "") or row.get("pickup_time", "")

                if not excursion_name:
                    errors.append({"row": row_number, "error": "Missing excursion"})
                    continue

                if not hotel_name:
                    errors.append({"row": row_number, "error": "Missing hotel"})
                    continue

                if pd.isna(time_value) or not str(time_value).strip():
                    errors.append({"row": row_number, "error": "Missing pickup time"})
                    continue

                excursion = Excursion.objects.filter(
                    name__iexact=excursion_name
                ).first()

                if not excursion:
                    errors.append({
                        "row": row_number,
                        "error": f"Excursion not found: {excursion_name}",
                    })
                    continue

                hotel = Hotel.objects.filter(name__iexact=hotel_name).first()

                if not hotel:
                    errors.append({
                        "row": row_number,
                        "error": f"Hotel not found: {hotel_name}",
                    })
                    continue

                zone = None
                if zone_name:
                    zone, _ = Zone.objects.get_or_create(name=zone_name)

                clean_time = self.clean_time(time_value)

                PickupTime.objects.update_or_create(
                    excursion=excursion,
                    hotel=hotel,
                    defaults={
                        "zone": zone,
                        "time": clean_time,
                    },
                )

                created_or_updated += 1

            except Exception as e:
                errors.append({"row": row_number, "error": str(e)})

        return Response({
            "format": "flat",
            "created_or_updated": created_or_updated,
            "errors": errors,
        })

    def clean_excursion_name(self, column_name):
        mapping = {
            "city tour santo domingo": "City Tour Santo Domingo",
            "city tour sdq": "City Tour Santo Domingo",
            "saona island": "Saona Island",
            "samana / haitises": "Samana / Haitises",
            "samana / haiti ses": "Samana / Haitises",
            "catalina island": "Catalina Island",
            "isla catalina": "Catalina Island",
        }

        return mapping.get(str(column_name).strip().lower(), str(column_name).strip())

    def clean_time(self, value):
        if pd.isna(value):
            return None

        if hasattr(value, "strftime"):
            return value.strftime("%H:%M")

        value = str(value).strip().replace(".", ":")

        if len(value.split(":")) == 2:
            hour, minute = value.split(":")
            return f"{int(hour):02d}:{int(minute):02d}"

        return value
# ---------------------------------------------------AgencyViewSet
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
        

class OperationViewSet(viewsets.ModelViewSet):
        queryset = Operation.objects.select_related(
            "excursion",
            "provider",
            "provider_service",
        ).prefetch_related(
            "reservations",
            "reservations__hotel",
            "reservations__excursion",
            "reservations__agency",
        ).all()

        serializer_class = OperationSerializer

        def get_queryset(self):
            queryset = super().get_queryset()

            date = self.request.query_params.get("date")
            excursion = self.request.query_params.get("excursion")
            provider = self.request.query_params.get("provider")
            provider_service = self.request.query_params.get("provider_service")
            status = self.request.query_params.get("status")

            if date:
                queryset = queryset.filter(date=date)

            if excursion:
                queryset = queryset.filter(excursion_id=excursion)

            if provider:
                queryset = queryset.filter(provider_id=provider)
            
            if provider_service:
                queryset = queryset.filter(provider_service_id=provider_service)

            if status:
                queryset = queryset.filter(status=status)

            return queryset

        @action(detail=True, methods=["post"], url_path="mark-sent")
        def mark_sent(self, request, pk=None):
            operation = self.get_object()
            operation.status = "sent"
            operation.sent_at = timezone.now()
            operation.save()

            serializer = self.get_serializer(operation)
            return Response(serializer.data)
        


class AgencyExcursionPriceViewSet(viewsets.ModelViewSet):
    queryset = AgencyExcursionPrice.objects.select_related(
        "agency",
        "excursion",
    ).all()

    serializer_class = AgencyExcursionPriceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        agency_id = self.request.query_params.get("agency")
        excursion_id = self.request.query_params.get("excursion")

        if agency_id:
            queryset = queryset.filter(agency_id=agency_id)

        if excursion_id:
            queryset = queryset.filter(excursion_id=excursion_id)

        return queryset
    

class AgencyAccessViewSet(viewsets.ModelViewSet):
    queryset = Agency.objects.all().order_by("name")
    serializer_class = AgencyAccessSerializer
    permission_classes = [IsAuthenticated]

    


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def agency_portal(request):
    user = request.user
    print(f"Authenticated user: {user.username} (ID: {user.id})")

    agency = getattr(user, "agency_profile", None)

    return Response({
        "id": user.id,
        "username": user.username,
        "is_staff": user.is_staff,
        "agency_id": agency.id if agency else None,
        "agency_name": agency.name if agency else None,
    })