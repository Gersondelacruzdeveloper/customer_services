from django.contrib import admin
from .models import Hotel, Guide, Excursion, TourOperator, Survey

admin.site.register(Hotel)
admin.site.register(Guide)
admin.site.register(Excursion)
admin.site.register(TourOperator)
admin.site.register(Survey)