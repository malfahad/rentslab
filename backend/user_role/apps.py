from django.apps import AppConfig


class UserRoleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'user_role'

    def ready(self) -> None:
        import user_role.signals  # noqa: F401
