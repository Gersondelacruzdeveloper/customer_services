from django.contrib import admin
from .models import (
    Provider,
    ProviderService,
    Hotel,
    Excursion,
    Agency,
    Reservation,
    ReservationCost,
    ProviderPayment,
    AgencyPayment,
    PickupTime
)

admin.site.register(Provider)
admin.site.register(ProviderService)
admin.site.register(Hotel)
admin.site.register(Excursion)
admin.site.register(Agency)
admin.site.register(Reservation)
admin.site.register(ReservationCost)
admin.site.register(ProviderPayment)
admin.site.register(AgencyPayment)
admin.site.register(PickupTime)