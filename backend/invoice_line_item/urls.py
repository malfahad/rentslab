from rest_framework.routers import DefaultRouter

from .views import InvoiceLineItemViewSet

router = DefaultRouter()
router.register(r'', InvoiceLineItemViewSet, basename='invoicelineitem')

urlpatterns = router.urls
