from django.apps import AppConfig


class ExpenseCategoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'expense_category'

    def ready(self) -> None:
        import expense_category.signals  # noqa: F401
