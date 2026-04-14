from rest_framework.routers import DefaultRouter

from .views import CreditNoteViewSet

router = DefaultRouter()
router.register(r'', CreditNoteViewSet, basename='creditnote')

urlpatterns = router.urls
