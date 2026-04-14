from django.apps import AppConfig


class UnitConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'unit'

    def ready(self) -> None:
        import unit.signals  # noqa: F401
