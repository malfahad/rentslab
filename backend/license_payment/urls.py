from rest_framework.routers import DefaultRouter

from .views import LicensePaymentViewSet

router = DefaultRouter()
router.register(r'', LicensePaymentViewSet, basename='license-payment')

urlpatterns = router.urls
