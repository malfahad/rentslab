# Shell commands

Paths are relative to the repository root unless noted.

## Environment

Copy env templates when setting up a machine:

```sh
cp .env.example .env
cp frontend-app/.env.example frontend-app/.env
cp frontend-landing/.env.example frontend-landing/.env
```

Edit `.env` to match local ports and secrets. See `.env.example` for variables used by Docker and Django (for example `POSTGRES_*`, `DB_*`, `DJANGO_SERVER_PORT`, `FRONTEND_URL`).

## Docker Compose (Postgres + backend)

From the repo root:

```sh
docker compose up -d
docker compose up --build
docker compose logs -f backend
docker compose logs -f db
docker compose down
docker compose down -v
```

The `backend` service runs `migrate` then `runserver` (see `docker-compose.yml`). Database data persists in the `postgres_data` volume.

## Backend (Django)

Working directory: `backend/`. Use a virtualenv and install dependencies:

```sh
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### Server and database

```sh
cd backend
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Use the host/port that matches your `.env` (`DJANGO_SERVER_PORT` when using Compose).

### Django built-ins you will use often

```sh
cd backend
python manage.py makemigrations
python manage.py showmigrations
python manage.py shell
python manage.py dbshell
python manage.py createsuperuser
python manage.py test
```

### Custom management commands (this repo)

**Seed demo organizations** — `org.management.commands.seed_demo_orgs`:

```sh
cd backend
python manage.py seed_demo_orgs
python manage.py seed_demo_orgs --config small
python manage.py seed_demo_orgs --config medium
python manage.py seed_demo_orgs --config large
python manage.py seed_demo_orgs --config all
python manage.py seed_demo_orgs --password 'YourSecurePassword'
python manage.py seed_demo_orgs --replace
```

`--config` defaults to `all` (creates small, medium, and large demo orgs). `--replace` deletes an existing demo org with the same generated name before re-seeding.

**Issue catch-up invoices** — `invoice.management.commands.issue_invoices`:

```sh
cd backend
python manage.py issue_invoices --org-id 1
python manage.py issue_invoices --org-id 1 --as-of 2026-01-15
python manage.py issue_invoices --org-id 1 --dry-run
```

**License payment cycle** — `license_payment.management.commands.license_payment_cycle`:

```sh
cd backend
python manage.py license_payment_cycle --org-id 1 --cycle-year 2026
python manage.py license_payment_cycle --org-id 1 --mode monthly --cycle-year 2026 --cycle-month 4
python manage.py license_payment_cycle --org-id 1 --mode yearly --cycle-year 2026
```

Optional flags: `--tenant-id`, `--status` (`upcoming` | `due` | `paid` | `void`), `--unit-price`, `--units-count` (default: current org unit count), `--credit-balance`, `--notes`, `--period-start` / `--period-end` (`YYYY-MM-DD`; if both set, they override the computed period). Monthly mode requires `--cycle-month` 1–12.

### Help for any command

```sh
cd backend
python manage.py help
python manage.py seed_demo_orgs --help
python manage.py issue_invoices --help
python manage.py license_payment_cycle --help
```

## Frontend — main app (`frontend-app/`)

```sh
cd frontend-app
npm install
npm run dev
npm run build
npm run start
npm run lint
npm run test:e2e
npm run test:e2e:ui
```

## Frontend — marketing site (`frontend-landing/`)

```sh
cd frontend-landing
npm install
npm run dev
npm run build
npm run start
npm run lint
```
