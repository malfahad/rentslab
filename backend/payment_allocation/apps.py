from django.apps import AppConfig


class PaymentAllocationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'payment_allocation'

    def ready(self) -> None:
        import payment_allocation.signals  # noqa: F401
