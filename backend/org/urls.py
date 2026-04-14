from rest_framework.routers import DefaultRouter

from .views import OrgViewSet

router = DefaultRouter()
router.register(r'', OrgViewSet, basename='org')

urlpatterns = router.urls
