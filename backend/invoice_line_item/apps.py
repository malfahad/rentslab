from django.apps import AppConfig


class InvoiceLineItemConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'invoice_line_item'

    def ready(self) -> None:
        import invoice_line_item.signals  # noqa: F401
