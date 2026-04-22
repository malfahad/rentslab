from django.urls import path

from .views import ReportLookupView

urlpatterns = [
    # Use ``str`` (not ``slug``) so multi-segment slugs like ``rent-roll`` and
    # ``income-statement`` always match the same way across Django versions.
    path('<str:slug>/', ReportLookupView.as_view(), name='report-lookup'),
]
