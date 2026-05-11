from rest_framework import serializers
from django.contrib.auth import get_user_model
User = get_user_model()
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
    AgencyExcursionPrice,
)

class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = "__all__"


class ProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Provider
        fields = "__all__"

class ProviderServiceSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source="provider.name", read_only=True)

    class Meta:
        model = ProviderService
        fields = "__all__"


class HotelSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source="zone.name", read_only=True)

    class Meta:
        model = Hotel
        fields = "__all__"


class ExcursionSerializer(serializers.ModelSerializer):
    default_provider_name = serializers.CharField(
        source="default_provider.name",
        read_only=True,
    )

    class Meta:
        model = Excursion
        fields = "__all__"

class PickupTimeSerializer(serializers.ModelSerializer):
    excursion_name = serializers.CharField(source="excursion.name", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name", read_only=True)
    zone_name = serializers.CharField(source="zone.name", read_only=True)

    class Meta:
        model = PickupTime
        fields = "__all__"

class AgencySerializer(serializers.ModelSerializer):
    login_username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    login_email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    class Meta:
        model = Agency
        fields = [
            "id",
            "name",
            "contact_name",
            "phone",
            "email",
            "notes",
            "is_active",
            "user",
            "login_username",
            "login_email",
        ]

class ReservationSerializer(serializers.ModelSerializer):
    excursion_name = serializers.CharField(source="excursion.name", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name", read_only=True)
    agency_name = serializers.CharField(source="agency.name", read_only=True)

    excursion_id = serializers.PrimaryKeyRelatedField(
        source="excursion",
        queryset=Excursion.objects.all(),
    )

    hotel_id = serializers.PrimaryKeyRelatedField(
        source="hotel",
        queryset=Hotel.objects.all(),
    )

    agency_id = serializers.PrimaryKeyRelatedField(
        source="agency",
        queryset=Agency.objects.all(),
        required=False,
        allow_null=True,
    )

    total_pax = serializers.ReadOnlyField()
    balance_due = serializers.ReadOnlyField()
    agency_balance = serializers.ReadOnlyField()
    total_costs = serializers.ReadOnlyField()
    profit = serializers.ReadOnlyField()

    class Meta:
        model = Reservation
        fields = [
                "id",
                "locator",
                "lead_name",
                "phone",
                "email",

                "excursion_id",
                "hotel_id",
                "agency_id",

                "excursion_name",
                "hotel_name",
                "agency_name",

                "service_date",
                "pickup_time",

                "adults",
                "children",
                "infants",

                "language",
                "status",

                "sale_price_per_person",
                "sale_total",
                "paid_amount",
                "currency",

                "agency_price",
                "agency_paid",

                "notes",
                "internal_notes",

                "total_pax",
                "balance_due",
                "agency_balance",
                "total_costs",
                "profit",
                "payment_method",
                "collection_type",
                "agency_commission",
                "customer_paid_to_us",
                "customer_paid_to_agency",
                "agency_owes_us",
                "we_owe_agency",
                "card_fee_percent",
                "card_fee_amount",
                "final_total_with_card_fee",
            ]

        

class ReservationCostSerializer(serializers.ModelSerializer):
    reservation_locator = serializers.CharField(
        source="reservation.locator",
        read_only=True,
    )
    provider_service_name = serializers.CharField(
        source="provider_service.name",
        read_only=True,
    )
    provider_name = serializers.CharField(source="provider.name", read_only=True)
    balance_due = serializers.ReadOnlyField()

    class Meta:
        model = ReservationCost
        fields = "__all__"


class ProviderPaymentSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source="provider.name", read_only=True)

    class Meta:
        model = ProviderPayment
        fields = "__all__"



class AgencyPaymentSerializer(serializers.ModelSerializer):
    agency_name = serializers.CharField(source="agency.name", read_only=True)

    class Meta:
        model = AgencyPayment
        fields = "__all__"




from rest_framework import serializers
from .models import Operation, Reservation


class OperationReservationSerializer(serializers.ModelSerializer):
    excursion_name = serializers.CharField(source="excursion.name", read_only=True)
    hotel_name = serializers.CharField(source="hotel.name", read_only=True)
    agency_name = serializers.CharField(source="agency.name", read_only=True)

    class Meta:
        model = Reservation
        fields = [
            "id",
            "locator",
            "lead_name",
            "phone",
            "email",
            "excursion_name",
            "hotel_name",
            "agency_name",
            "service_date",
            "pickup_time",
            "adults",
            "children",
            "infants",
            "total_pax",
            "language",
            "status",
            "notes",
            "internal_notes",
        ]


class OperationSerializer(serializers.ModelSerializer):
    excursion_name = serializers.CharField(
        source="excursion.name",
        read_only=True,
        allow_null=True,
    )


    provider_name = serializers.CharField(source="provider.name", read_only=True)

    provider_service_name = serializers.CharField(
        source="provider_service.name",
        read_only=True,
        allow_null=True,
    )

    provider_service_cost = serializers.DecimalField(
        source="provider_service.cost_price",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    provider_service_currency = serializers.CharField(
        source="provider_service.currency",
        read_only=True,
        allow_null=True,
    )

    provider_service_price_type = serializers.CharField(
        source="provider_service.price_type",
        read_only=True,
        allow_null=True,
    )

    reservation_ids = serializers.PrimaryKeyRelatedField(
        source="reservations",
        many=True,
        queryset=Reservation.objects.all(),
        write_only=True,
        required=False,
    )

    reservations = OperationReservationSerializer(many=True, read_only=True)

    total_adults = serializers.ReadOnlyField()
    total_children = serializers.ReadOnlyField()
    total_infants = serializers.ReadOnlyField()
    total_pax = serializers.ReadOnlyField()

    class Meta:
        model = Operation
        fields = [
            "id",
            "date",
            "excursion",
            "excursion_name",
            "provider",
            "provider_name",
            "provider_service",
            "provider_service_name",
            "provider_service_cost",
            "provider_service_currency",
            "provider_service_price_type",
            "title",
            "vehicle_name",
            "driver_name",
            "driver_phone",
            "status",
            "notes",
            "reservation_ids",
            "reservations",
            "total_adults",
            "total_children",
            "total_infants",
            "total_pax",
            "sent_at",
            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "excursion": {
                "required": False,
                "allow_null": True,
            },
            "provider_service": {
                "required": False,
                "allow_null": True,
            },
        }


class AgencyExcursionPriceSerializer(serializers.ModelSerializer):
    agency_name = serializers.CharField(
        source="agency.name",
        read_only=True,
    )

    excursion_name = serializers.CharField(
        source="excursion.name",
        read_only=True,
    )

    class Meta:
        model = AgencyExcursionPrice

        fields = [
            "id",

            "agency",
            "agency_name",

            "excursion",
            "excursion_name",

            "adult_price",
            "child_price",

            "currency",
            "is_active",
        ]




class AgencyAccessSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    email = serializers.EmailField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    login_username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    class Meta:
        model = Agency
        fields = [
            "id",
            "name",
            "is_active",
            "username",
            "password",
            "email",
            "login_username",
        ]

    def update(self, instance, validated_data):
        username = validated_data.pop("username", None)
        password = validated_data.pop("password", None)
        email = validated_data.pop("email", "")

        instance = super().update(instance, validated_data)

        if instance.user:
            user = instance.user

            if username:
                user.username = username

            if email is not None:
                user.email = email

            if password:
                user.set_password(password)

            user.save()

        elif username and password:
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
            )

            instance.user = user
            instance.save()

        return instance