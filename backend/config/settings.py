"""
Django settings for config project.
"""

from datetime import timedelta
from pathlib import Path
import os

from corsheaders.defaults import default_headers
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR.parent / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-me')

DEBUG = os.getenv('DEBUG', '1').strip().lower() in {'1', 'true', 'yes', 'on'}

ALLOWED_HOSTS: list[str] = [
    host.strip()
    for host in os.getenv('ALLOWED_HOSTS', '').split(',')
    if host.strip()
]

INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',
    # domain apps (dependency order: users + org first)
    'users',
    'org',
    'access',
    'user_role',
    'landlord',
    'building',
    'unit',
    'tenant',
    'lease',
    'service',
    'service_subscription',
    'invoice',
    'invoice_line_item',
    'credit_note',
    'payment',
    'payment_allocation',
    'payment_link',
    'license_payment',
    'vendor',
    'expense_category',
    'job_order',
    'expense',
    'reports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'access.middleware.OrgContextMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'app_services' / 'emailer' / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.getenv('DB_NAME', 'rentslab'),
        'USER': os.getenv('DB_USER', 'rentslab'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'rentslab'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5422'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    # Keep query key "format" available for report filters (e.g. format=pdf)
    # instead of DRF content-negotiation override.
    'URL_FORMAT_OVERRIDE': None,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
}

# Browser clients (Next.js dev, Playwright) call the API from other origins.
# Keep CORS behavior fully env-driven for both DEBUG and non-DEBUG modes.
CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', '0').strip().lower() in {
    '1',
    'true',
    'yes',
    'on',
}
CORS_ALLOWED_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
    if origin.strip()
]

# Org-scoped API requests send X-Org-ID; preflight must allow it (not in default_headers).
CORS_ALLOW_HEADERS = (*default_headers, "x-org-id")

DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@rentslab.com')
EMAIL_BACKEND = (
    'django.core.mail.backends.console.EmailBackend'
    if DEBUG
    else 'django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_HOST = os.getenv('EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '25'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', '0').strip().lower() in {'1', 'true', 'yes', 'on'}
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', '0').strip().lower() in {'1', 'true', 'yes', 'on'}

# Transactional email branding (app_services.emailer)
SITE_NAME = os.getenv('SITE_NAME', 'RentSlab')
SUPPORT_EMAIL = os.getenv('SUPPORT_EMAIL', 'support@rentslab.com')
# Optional absolute origin for auth links in emails, e.g. https://app.example.com
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3003')

# Transactional SMS (app_services.sms)
SMS_BACKEND = os.getenv('SMS_BACKEND', 'app_services.sms.backends.ConsoleSmsBackend')
SMS_DEFAULT_SENDER = os.getenv('SMS_DEFAULT_SENDER', SITE_NAME)
SMS_AT_API_KEY = os.getenv('SMS_AT_API_KEY', os.getenv('AT_PROVIDER_API_KEY', ''))
SMS_AT_USERNAME = os.getenv('SMS_AT_USERNAME', 'sandbox')

# New orgs created on self-service registration (users.signals)
DEFAULT_NEW_ORG_TYPE = os.getenv('DEFAULT_NEW_ORG_TYPE', 'property_manager')
