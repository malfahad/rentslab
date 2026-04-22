from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PaymentCodeUnitViewSet, PublicPaymentLinkView

router = DefaultRouter()
router.register(r'units', PaymentCodeUnitViewSet, basename='payment-code-unit')

urlpatterns = [
    *router.urls,
    path('public/<slug:slug>/', PublicPaymentLinkView.as_view(), name='public-payment-link'),
]
