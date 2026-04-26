from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import InvoiceViewSet, PublicInvoiceDocumentView

router = DefaultRouter()
router.register(r'', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('public-docs/<str:hashed_doc_id>/', PublicInvoiceDocumentView.as_view(), name='public-invoice-doc'),
    *router.urls,
]
