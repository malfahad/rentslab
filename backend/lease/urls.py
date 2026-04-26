from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import LeaseViewSet, PublicLeaseDocumentView

router = DefaultRouter()
router.register(r'', LeaseViewSet, basename='lease')

urlpatterns = [
    path('public-docs/<str:hashed_doc_id>/', PublicLeaseDocumentView.as_view(), name='public-lease-doc'),
    *router.urls,
]
