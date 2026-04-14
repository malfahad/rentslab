from rest_framework.routers import DefaultRouter

from access.views import RoleDefinitionViewSet, ShareGrantViewSet

router = DefaultRouter()
router.register(r'roles', RoleDefinitionViewSet, basename='roledefinition')
router.register(r'shares', ShareGrantViewSet, basename='sharegrant')

urlpatterns = router.urls
