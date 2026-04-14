from django.apps import AppConfig


class JobOrderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'job_order'

    def ready(self) -> None:
        import job_order.signals  # noqa: F401
