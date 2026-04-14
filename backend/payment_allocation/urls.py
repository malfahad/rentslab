from rest_framework.routers import DefaultRouter

from .views import PaymentAllocationViewSet

router = DefaultRouter()
router.register(r'', PaymentAllocationViewSet, basename='paymentallocation')

urlpatterns = router.urls
