from rest_framework.routers import DefaultRouter

from .views import LandlordViewSet

router = DefaultRouter()
router.register(r'', LandlordViewSet, basename='landlord')

urlpatterns = router.urls
