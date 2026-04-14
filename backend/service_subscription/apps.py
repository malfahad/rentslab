from django.apps import AppConfig


class ServiceSubscriptionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'service_subscription'

    def ready(self) -> None:
        import service_subscription.signals  # noqa: F401
