from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

# -----------------------------------------------------------------Zone

class Zone(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
# -----------------------------------------------------------------Provider

class Provider(models.Model):
    PROVIDER_TYPE_CHOICES = [
        ("transport", "Transport"),
        ("excursion", "Excursion"),
        ("food", "Food"),
        ("boat", "Boat"),
        ("guide", "Guide"),
        ("hotel", "Hotel"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=150)
    provider_type = models.CharField(max_length=30, choices=PROVIDER_TYPE_CHOICES, default="other")
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

# -----------------------------------------------------------------ProviderService

class ProviderService(models.Model):
    PRICE_TYPE_CHOICES = [
        ("per_person", "Per person"),
        ("per_trip", "Per trip"),
        ("per_group", "Per group"),
        ("fixed", "Fixed"),
    ]

    CURRENCY_CHOICES = [
        ("USD", "USD"),
        ("DOP", "DOP"),
        ("EUR", "EUR"),
    ]

    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name="services")
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)

    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default="USD")
    price_type = models.CharField(max_length=30, choices=PRICE_TYPE_CHOICES, default="per_person")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["provider__name", "name"]

    def __str__(self):
        return f"{self.provider.name} - {self.name}"

# -----------------------------------------------------------------Hotel

class Hotel(models.Model):
    name = models.CharField(max_length=150)

    zone = models.ForeignKey(
        Zone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hotels",
    )

    area = models.CharField(max_length=150, blank=True)
    address = models.CharField(max_length=255, blank=True)
    pickup_note = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
    
# -----------------------------------------------------------------Excursion

class Excursion(models.Model):
    CURRENCY_CHOICES = [
        ("USD", "USD"),
        ("DOP", "DOP"),
        ("EUR", "EUR"),
    ]

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)

    default_sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default="USD")

    default_provider = models.ForeignKey(
        Provider,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="default_excursions",
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

# -----------------------------------------------------------------PickupTime

class PickupTime(models.Model):
    excursion = models.ForeignKey(
        Excursion,
        on_delete=models.CASCADE,
        related_name="pickup_times",
    )

    hotel = models.ForeignKey(
        Hotel,
        on_delete=models.CASCADE,
        related_name="pickup_times",
    )

    zone = models.ForeignKey(
        Zone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pickup_times",
    )

    time = models.TimeField()
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ("excursion", "hotel")
        ordering = ["time", "hotel__name"]

    def save(self, *args, **kwargs):
        if self.hotel_id and not self.zone_id:
            self.zone = self.hotel.zone

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.excursion.name} - {self.hotel.name} - {self.time}"

# -----------------------------------------------------------------Agency

class Agency(models.Model):
    name = models.CharField(max_length=150)
    contact_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

# -----------------------------------------------------------------Reservation
class Reservation(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
        ("no_show", "No show"),
    ]

    LANGUAGE_CHOICES = [
        ("en", "English"),
        ("es", "Spanish"),
        ("fr", "French"),
        ("it", "Italian"),
        ("pt", "Portuguese"),
        ("de", "German"),
        ("other", "Other"),
    ]

    CURRENCY_CHOICES = [
        ("USD", "USD"),
        ("DOP", "DOP"),
        ("EUR", "EUR"),
    ]

    PAYMENT_METHOD_CHOICES = [
    ("cash", "Cash"),
    ("card", "Card"),
    ("bank_transfer", "Bank transfer"),
    ("agency_collects", "Agency collects"),
    ("mixed", "Mixed"),
    ]

    COLLECTION_TYPE_CHOICES = [
    ("we_collect_full", "We collect full amount"),
    ("agency_collects_full", "Agency collects full amount"),
    ("agency_collects_commission", "Agency collects commission only"),
    ("agency_pays_balance", "Agency pays balance"),
    ]

    payment_method = models.CharField(
    max_length=30,
    choices=PAYMENT_METHOD_CHOICES,
    default="cash",
    )

    collection_type = models.CharField(
    max_length=40,
    choices=COLLECTION_TYPE_CHOICES,
    default="we_collect_full",
    )

    card_fee_percent = models.DecimalField(
    max_digits=5,
    decimal_places=2,
    default=Decimal("12.00"),
    )

    card_fee_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    final_total_with_card_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    agency_commission = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    default=Decimal("0.00"),
    validators=[MinValueValidator(Decimal("0.00"))],
    )
    customer_paid_to_us = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    default=Decimal("0.00"),
    validators=[MinValueValidator(Decimal("0.00"))],
   )
    
    customer_paid_to_agency = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    default=Decimal("0.00"),
    validators=[MinValueValidator(Decimal("0.00"))],
    )

    agency_owes_us = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    we_owe_agency = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
    )


    locator = models.CharField(max_length=50, unique=True)

    lead_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)

    excursion = models.ForeignKey(
        Excursion,
        on_delete=models.PROTECT,
        related_name="reservations",
    )

    hotel = models.ForeignKey(
        Hotel,
        on_delete=models.PROTECT,
        related_name="reservations",
    )

    agency = models.ForeignKey(
        Agency,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reservations",
    )

    service_date = models.DateField()
    pickup_time = models.TimeField(null=True, blank=True)

    adults = models.PositiveIntegerField(default=1)
    children = models.PositiveIntegerField(default=0)
    infants = models.PositiveIntegerField(default=0)

    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default="en")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    sale_price_per_person = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    sale_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default="USD")

    agency_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    agency_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )



    notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-service_date", "-id"]

    @property
    def total_pax(self):
        return self.adults + self.children + self.infants

    @property
    def balance_due(self):
        return self.sale_total - self.paid_amount

    @property
    def agency_balance(self):
        return self.agency_price - self.agency_paid

    @property
    def total_costs(self):
        return sum((cost.total_cost for cost in self.costs.all()), Decimal("0.00"))

    @property
    def profit(self):
        return self.sale_total - self.total_costs
    def calculate_agency_settlement(self):
        sale_total = self.sale_total or Decimal("0.00")
        agency_commission = self.agency_commission or Decimal("0.00")
        paid_to_us = self.customer_paid_to_us or Decimal("0.00")
        paid_to_agency = self.customer_paid_to_agency or Decimal("0.00")

        self.agency_owes_us = Decimal("0.00")
        self.we_owe_agency = Decimal("0.00")

        if not self.agency:
            return

        if self.collection_type == "we_collect_full":
            self.we_owe_agency = agency_commission

        elif self.collection_type == "agency_collects_full":
            self.agency_owes_us = max(
                sale_total - agency_commission,
                Decimal("0.00"),
            )

        elif self.collection_type == "agency_collects_commission":
            self.we_owe_agency = max(
                agency_commission - paid_to_agency,
                Decimal("0.00"),
            )

        elif self.collection_type == "agency_pays_balance":
            self.agency_owes_us = max(
                sale_total - agency_commission - paid_to_us,
                Decimal("0.00"),
            )

    def save(self, *args, **kwargs):
        sale_total = self.sale_total or Decimal("0.00")
        self.card_fee_amount = Decimal("0.00")
        self.final_total_with_card_fee = sale_total

        if self.payment_method == "card":
                self.card_fee_amount = (
                    sale_total * self.card_fee_percent
                ) / Decimal("100.00")

                self.final_total_with_card_fee = (
                    sale_total + self.card_fee_amount
                )
        self.calculate_agency_settlement()
        if not self.pickup_time and self.excursion_id and self.hotel_id:
            pickup = PickupTime.objects.filter(
                excursion_id=self.excursion_id,
                hotel_id=self.hotel_id,
            ).first()

            if pickup:
                self.pickup_time = pickup.time

        if self.sale_total == Decimal("0.00") and self.sale_price_per_person:
            self.sale_total = self.sale_price_per_person * Decimal(self.total_pax)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.locator} - {self.lead_name}"

# -----------------------------------------------------------------ReservationCost
class ReservationCost(models.Model):
    CURRENCY_CHOICES = [
        ("USD", "USD"),
        ("DOP", "DOP"),
        ("EUR", "EUR"),
    ]

    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.CASCADE,
        related_name="costs",
    )

    provider_service = models.ForeignKey(
        ProviderService,
        on_delete=models.PROTECT,
        related_name="reservation_costs",
    )

    provider = models.ForeignKey(
        Provider,
        on_delete=models.PROTECT,
        related_name="reservation_costs",
        null=True,
        blank=True,
    )

    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("1.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    unit_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    total_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default="USD")
    is_paid = models.BooleanField(default=False)

    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    @property
    def balance_due(self):
        return self.total_cost - self.paid_amount
    

    def save(self, *args, **kwargs):
        if self.provider_service:
            if not self.provider_id:
                self.provider = self.provider_service.provider

            if self.unit_cost == Decimal("0.00"):
                self.unit_cost = self.provider_service.cost_price

            if not self.currency:
                self.currency = self.provider_service.currency

        self.total_cost = self.quantity * self.unit_cost

        if self.paid_amount >= self.total_cost and self.total_cost > Decimal("0.00"):
            self.is_paid = True

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reservation.locator} - {self.provider_service.name}"

# -----------------------------------------------------------------ProviderPayment

class ProviderPayment(models.Model):
    CURRENCY_CHOICES = [
        ("USD", "USD"),
        ("DOP", "DOP"),
        ("EUR", "EUR"),
    ]

    provider = models.ForeignKey(
        Provider,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default="USD")
    payment_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-payment_date", "-id"]

    def __str__(self):
        return f"{self.provider.name} - {self.amount} {self.currency}"

# -----------------------------------------------------------------AgencyPayment

class AgencyPayment(models.Model):
    CURRENCY_CHOICES = [
        ("USD", "USD"),
        ("DOP", "DOP"),
        ("EUR", "EUR"),
    ]

    agency = models.ForeignKey(
        Agency,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default="USD")
    payment_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-payment_date", "-id"]

    def __str__(self):
        return f"{self.agency.name} - {self.amount} {self.currency}"


# -----------------------------------------------------------------Operation

class Operation(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent", "Sent to provider"),
        ("confirmed", "Confirmed"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    date = models.DateField()
    excursion = models.ForeignKey(
        Excursion,
        null= True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="operations",
    
    )
    provider = models.ForeignKey(
        Provider,
        on_delete=models.PROTECT,
        related_name="operations",
    )
    provider_service = models.ForeignKey(
    ProviderService,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="operations",
    )

    title = models.CharField(max_length=180, blank=True)
    vehicle_name = models.CharField(max_length=120, blank=True)
    driver_name = models.CharField(max_length=120, blank=True)
    driver_phone = models.CharField(max_length=50, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    notes = models.TextField(blank=True)

    reservations = models.ManyToManyField(
        Reservation,
        related_name="operations",
        blank=True,
    )

    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "excursion__name", "provider__name"]

    @property
    def total_adults(self):
        return sum(r.adults for r in self.reservations.all())

    @property
    def total_children(self):
        return sum(r.children for r in self.reservations.all())

    @property
    def total_infants(self):
        return sum(r.infants for r in self.reservations.all())

    @property
    def total_pax(self):
        return sum(r.total_pax for r in self.reservations.all())

    def save(self, *args, **kwargs):
        if not self.title and self.excursion_id and self.provider_id:
            self.title = f"{self.excursion.name} - {self.provider.name} - {self.date}"

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title or f"Operation {self.id}"
    
# -----------------------------------------------------------------AgencyExcursionPrice

class AgencyExcursionPrice(models.Model):
    agency = models.ForeignKey(
        Agency,
        on_delete=models.CASCADE,
        related_name="excursion_prices",
    )

    excursion = models.ForeignKey(
        Excursion,
        on_delete=models.CASCADE,
        related_name="agency_prices",
    )

    adult_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    child_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    currency = models.CharField(
        max_length=10,
        choices=Excursion.CURRENCY_CHOICES,
        default="USD",
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["agency__name", "excursion__name"]
        unique_together = ("agency", "excursion")

    def __str__(self):
        return f"{self.agency} - {self.excursion}"