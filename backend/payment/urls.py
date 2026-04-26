from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PaymentViewSet, PublicReceiptView

router = DefaultRouter()
router.register(r'', PaymentViewSet, basename='payment')

urlpatterns = [
    path('public-receipts/<str:hashed_payment_id>/', PublicReceiptView.as_view(), name='public-receipt'),
    *router.urls,
]
