"""
Django settings for config project.
"""

from datetime import timedelta
from pathlib import Path
import os

from corsheaders.defaults import default_headers

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-=&lgjf&5dx*_4b)05(kw^@qihv9u+swnw-82$t@k6q_jg$3f%w'

DEBUG = True

ALLOWED_HOSTS: list[str] = []

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
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
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
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
}

# Browser clients (Next.js dev, Playwright) call the API from other origins when DEBUG.
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS: list[str] = []

# Org-scoped API requests send X-Org-ID; preflight must allow it (not in default_headers).
CORS_ALLOW_HEADERS = (*default_headers, "x-org-id")

DEFAULT_FROM_EMAIL = 'noreply@rentslab.com'
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Transactional email branding (app_services.emailer)
SITE_NAME = 'RentSlab'
SUPPORT_EMAIL = 'support@rentslab.com'
# Optional absolute origin for auth links in emails, e.g. https://app.example.com
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3003')

# New orgs created on self-service registration (users.signals)
DEFAULT_NEW_ORG_TYPE = 'property_manager'
