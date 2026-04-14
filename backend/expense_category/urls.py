from rest_framework.routers import DefaultRouter

from .views import ExpenseCategoryViewSet

router = DefaultRouter()
router.register(r'', ExpenseCategoryViewSet, basename='expense-category')

urlpatterns = router.urls
