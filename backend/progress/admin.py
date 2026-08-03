from django.contrib import admin
from .models import Activities, Progress


@admin.register(Activities)
class ActivitiesAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'courses', 'due_date', 'optional', 'created_at']
    list_filter = ['optional', 'created_at', 'due_date']
    search_fields = ['name', 'description']
    raw_id_fields = ['courses']
    date_hierarchy = 'due_date'


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ['id', 'students', 'activities', 'value', 'created_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['students__name', 'activities__name']
    raw_id_fields = ['students', 'activities']