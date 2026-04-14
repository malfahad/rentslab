from rest_framework.routers import DefaultRouter

from .views import ServiceSubscriptionViewSet

router = DefaultRouter()
router.register(r'', ServiceSubscriptionViewSet, basename='servicesubscription')

urlpatterns = router.urls
