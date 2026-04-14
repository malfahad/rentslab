from django.apps import AppConfig


class LandlordConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'landlord'

    def ready(self) -> None:
        import landlord.signals  # noqa: F401
