from django.contrib import admin

from .models import JobOrder


@admin.register(JobOrder)
class JobOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'job_number', 'title', 'org', 'status', 'building')
