from django.apps import AppConfig


class CreditNoteConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'credit_note'

    def ready(self) -> None:
        import credit_note.signals  # noqa: F401
