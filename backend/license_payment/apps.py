from django.apps import AppConfig


class LicensePaymentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'license_payment'

    def ready(self) -> None:
        import license_payment.signals  # noqa: F401
