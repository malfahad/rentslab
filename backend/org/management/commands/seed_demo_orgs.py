from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal

from django.apps import apps
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.utils.text import slugify

from access.constants import ROLE_ADMIN, ROLE_ORG_MEMBER
from access.models import RoleDefinition
from access.services import provision_default_roles_for_org
from building.models import Building
from landlord.models import Landlord
from lease.models import Lease
from org.models import Org
from service.models import Service
from service_subscription.models import ServiceSubscription
from tenant.models import Tenant
from unit.models import Unit
from user_role.models import UserRole

User = get_user_model()


def _sync_postgresql_pk_sequences() -> None:
    """If SERIAL/IDENTITY sequences lag behind MAX(pk), inserts fail with duplicate pkey."""
    if connection.vendor != "postgresql":
        return
    with connection.cursor() as cursor:
        for model in apps.get_models():
            opts = model._meta
            if opts.abstract or not opts.managed:
                continue
            pk = opts.pk
            if pk.get_internal_type() not in ("AutoField", "BigAutoField"):
                continue
            table, column = opts.db_table, pk.column
            cursor.execute("SELECT pg_get_serial_sequence(%s, %s)", [table, column])
            row = cursor.fetchone()
            if not row or not row[0]:
                continue
            seq = row[0]
            q_table = connection.ops.quote_name(table)
            q_column = connection.ops.quote_name(column)
            cursor.execute(
                f"SELECT setval(%s::regclass, COALESCE((SELECT MAX({q_column}) FROM {q_table}), 1), "
                f"(SELECT MAX({q_column}) FROM {q_table}) IS NOT NULL)",
                [seq],
            )


@dataclass(frozen=True)
class CityContext:
    city: str
    region: str
    country_code: str
    org_label: str
    website_domain: str
    org_phone_prefix: str
    landlord_names: tuple[str, ...]
    building_prefixes: tuple[str, ...]
    tenant_first_names: tuple[str, ...]
    tenant_last_names: tuple[str, ...]
    street_prefixes: tuple[str, ...]
    service_names: tuple[str, ...]
    currency: str


CITY_CONTEXTS: dict[str, CityContext] = {
    "kampala": CityContext(
        city="Kampala",
        region="Central Region",
        country_code="UG",
        org_label="Kampala",
        website_domain="kampala.demo.rentslab.local",
        org_phone_prefix="+256700",
        landlord_names=(
            "Nakasero Holdings",
            "Kololo Estates",
            "Makerere Property Trust",
            "Muyenga Homes Group",
            "Kansanga Urban Lettings",
        ),
        building_prefixes=(
            "Nile View",
            "Bukoto Heights",
            "Luwum Court",
            "Muyenga Terrace",
            "Ntinda Gardens",
            "Lubiri Residences",
        ),
        tenant_first_names=(
            "Amina",
            "Isaac",
            "Joan",
            "Moses",
            "Patricia",
            "Brian",
            "Sarah",
            "Derrick",
            "Gloria",
            "Emmanuel",
        ),
        tenant_last_names=(
            "Ssemanda",
            "Namakula",
            "Ocan",
            "Kato",
            "Nsubuga",
            "Ssekimpi",
            "Nansubuga",
            "Kizza",
            "Mugisha",
            "Turyahikayo",
        ),
        street_prefixes=(
            "Plot 14 Yusuf Lule Rd",
            "Plot 21 Acacia Ave",
            "Kira Road Block",
            "Ggaba Road Plot",
            "Bukoto Street Section",
            "Old Port Bell Rd Plot",
            "Ntinda II Road Block",
            "Muyenga Tank Hill Lane",
        ),
        service_names=("Water", "Security", "Garbage Collection", "Common Area Cleaning"),
        currency="UGX",
    ),
    "nairobi": CityContext(
        city="Nairobi",
        region="Nairobi County",
        country_code="KE",
        org_label="Nairobi",
        website_domain="nairobi.demo.rentslab.local",
        org_phone_prefix="+254700",
        landlord_names=(
            "Upperhill Properties",
            "Westlands Asset Group",
            "Kilimani Prime Holdings",
            "Runda Residential Trust",
            "South B Lettings Co",
        ),
        building_prefixes=(
            "Karura Residences",
            "Langata Suites",
            "Ngong Lane Plaza",
            "Kileleshwa Court",
            "Parklands Towers",
            "Embakasi View",
        ),
        tenant_first_names=(
            "Brian",
            "Wanjiku",
            "Achieng",
            "Kamau",
            "Njeri",
            "Kevin",
            "Mercy",
            "Faith",
            "Dennis",
            "Sharon",
        ),
        tenant_last_names=(
            "Mwangi",
            "Otieno",
            "Mutiso",
            "Kimani",
            "Kariuki",
            "Ndegwa",
            "Maina",
            "Wafula",
            "Odhiambo",
            "Musyoka",
        ),
        street_prefixes=(
            "Mombasa Rd Lot",
            "Waiyaki Way Block",
            "Argwings Kodhek House",
            "Kiambu Road Plot",
            "Ngong Road Section",
            "Thika Road Block",
            "Lenana Road House",
            "Kangundo Road Plot",
        ),
        service_names=("Water", "Security", "Internet", "Waste Collection"),
        currency="KES",
    ),
    "kigali": CityContext(
        city="Kigali",
        region="Kigali City",
        country_code="RW",
        org_label="Kigali",
        website_domain="kigali.demo.rentslab.local",
        org_phone_prefix="+250780",
        landlord_names=(
            "Kigali Prime Estates",
            "Kimihurura Ventures",
            "Gasabo Property Group",
            "Kacyiru Living Spaces",
            "Nyarugenge Asset Trust",
        ),
        building_prefixes=(
            "Kacyiru Gardens",
            "Remera Point",
            "Nyarutarama Heights",
            "Kimironko Residences",
            "Gisozi Court",
            "Kibagabaga View",
        ),
        tenant_first_names=(
            "Jean",
            "Aline",
            "Eric",
            "Claudine",
            "Didier",
            "Patrick",
            "Sandrine",
            "Yvette",
            "Emmanuel",
            "Chantal",
        ),
        tenant_last_names=(
            "Uwimana",
            "Mukasa",
            "Niyonsaba",
            "Habimana",
            "Nyiraneza",
            "Mukamana",
            "Ndayishimiye",
            "Uwera",
            "Mugabo",
            "Iradukunda",
        ),
        street_prefixes=(
            "KG 7 Ave",
            "KN 5 Rd",
            "KK 11 St",
            "KG 9 Ave",
            "KN 7 Rd",
            "KK 15 St",
            "KG 17 Ave",
            "KN 15 Rd",
        ),
        service_names=("Water", "Security", "Cleaning", "Generator Backup"),
        currency="RWF",
    ),
}

PRESET_UNITS = {"small": 30, "medium": 100, "large": 200}
ADMIN_USERNAME_BY_PRESET = {
    "small": "demo_small_admin",
    "medium": "demo_medium_admin",
    "large": "demo_large_admin",
}
RENT_BASE_BY_CURRENCY = {
    "UGX": Decimal("800000.00"),
    "KES": Decimal("15000.00"),
    "RWF": Decimal("250000.00"),
}
RENT_STEP_BY_CURRENCY = {
    "UGX": Decimal("25000.00"),
    "KES": Decimal("750.00"),
    "RWF": Decimal("12000.00"),
}
SERVICE_RATE_BASE_BY_CURRENCY = {
    "UGX": Decimal("60000.00"),
    "KES": Decimal("1200.00"),
    "RWF": Decimal("18000.00"),
}
SERVICE_RATE_STEP_BY_CURRENCY = {
    "UGX": Decimal("5000.00"),
    "KES": Decimal("100.00"),
    "RWF": Decimal("1500.00"),
}


class Command(BaseCommand):
    help = (
        "Seed demo organizations with realistic East Africa context. "
        "Creates orgs, users, buildings, units, tenants, services, service subscriptions, and leases."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--config",
            choices=["small", "medium", "large", "all"],
            default="all",
            help="Dataset size to create. 'all' creates small + medium + large.",
        )
        parser.add_argument(
            "--password",
            default="DemoPass!123",
            help="Password for generated users.",
        )
        parser.add_argument(
            "--replace",
            action="store_true",
            help="Delete existing demo org with same generated name before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        config = options["config"]
        password = options["password"]
        replace = options["replace"]

        _sync_postgresql_pk_sequences()
        if int(options.get("verbosity", 1)) >= 2:
            self.stdout.write("Synced PostgreSQL primary-key sequences before seeding.")

        runs = ["small", "medium", "large"] if config == "all" else [config]
        city_order = ["kampala", "nairobi", "kigali"]

        for idx, preset in enumerate(runs):
            context = CITY_CONTEXTS[city_order[idx % len(city_order)]]
            unit_count = PRESET_UNITS[preset]
            self._seed_one(preset=preset, unit_count=unit_count, context=context, password=password, replace=replace)

    def _seed_one(self, *, preset: str, unit_count: int, context: CityContext, password: str, replace: bool) -> None:
        org_name = f"Demo {context.org_label} {preset.title()} Org"

        if replace:
            self._delete_existing_org(org_name)

        if Org.objects.filter(name=org_name).exists():
            raise CommandError(f"Org '{org_name}' already exists. Use --replace to regenerate.")

        org = Org.objects.create(
            name=org_name,
            org_type="property_manager",
            legal_name=f"{context.org_label} Property Managers Ltd",
            email=f"ops@{context.website_domain}",
            phone=f"{context.org_phone_prefix}000111",
            website=f"https://{context.website_domain}",
            address_line1=f"{context.city} Business Park",
            city=context.city,
            region=context.region,
            country_code=context.country_code,
            settings={"demo_seed": True, "preset": preset, "units": unit_count, "city": context.city},
        )
        admin_role, member_role = provision_default_roles_for_org(org)
        if admin_role.key != ROLE_ADMIN:
            admin_role = RoleDefinition.objects.get(org=org, key=ROLE_ADMIN)
        if member_role.key != ROLE_ORG_MEMBER:
            member_role = RoleDefinition.objects.get(org=org, key=ROLE_ORG_MEMBER)

        users = self._create_users(
            org=org,
            context=context,
            preset=preset,
            password=password,
            admin_role=admin_role,
            member_role=member_role,
        )
        managed_by = users[0]

        landlords = self._create_landlords(org=org, context=context)
        services = self._create_services(org=org, context=context)

        buildings_count = max(2, min(8, (unit_count + 14) // 15))
        buildings = self._create_buildings(
            org=org,
            context=context,
            landlords=landlords,
            buildings_count=buildings_count,
        )
        units = self._create_units(buildings=buildings, unit_count=unit_count)
        tenants = self._create_tenants(org=org, context=context, unit_count=unit_count)
        leases = self._create_leases(
            units=units,
            tenants=tenants,
            managed_by=managed_by,
            currency=context.currency,
            context=context,
        )
        subs = self._create_subscriptions(leases=leases, services=services, currency=context.currency)

        self.stdout.write(
            self.style.SUCCESS(
                (
                    f"Seeded {org.name}: users={len(users)}, buildings={len(buildings)}, "
                    f"units={len(units)}, tenants={len(tenants)}, leases={len(leases)}, "
                    f"services={len(services)}, subscriptions={len(subs)}"
                )
            )
        )
        self.stdout.write(
            self.style.WARNING(
                f"Login -> org='{org.name}' username='{users[0].username}' password='{password}'"
            )
        )

    def _delete_existing_org(self, org_name: str) -> None:
        existing = Org.objects.filter(name=org_name).first()
        if existing is None:
            return
        # RoleDefinition is protected by UserRole FK, so remove user roles first.
        UserRole.objects.filter(org=existing).delete()
        Org.objects.filter(pk=existing.pk).delete()

    def _create_users(
        self,
        *,
        org: Org,
        context: CityContext,
        preset: str,
        password: str,
        admin_role: RoleDefinition,
        member_role: RoleDefinition,
    ) -> list[User]:
        users: list[User] = []
        base_slug = slugify(org.name)
        admin_username = ADMIN_USERNAME_BY_PRESET[preset]
        specs = [
            (admin_username, "Org Admin", admin_role, f"{context.org_phone_prefix}100100"),
            ("manager", "Portfolio Manager", member_role, f"{context.org_phone_prefix}100200"),
            ("operations", "Operations Officer", member_role, f"{context.org_phone_prefix}100300"),
        ]
        for key, name, role, phone in specs:
            if role.key == ROLE_ADMIN:
                username = key
            else:
                username = f"{base_slug}_{key}"
            email = f"{username}@demo.rentslab.com"
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "name": f"{context.org_label} {name}",
                    "phone": phone,
                    "city": context.city,
                    "region": context.region,
                    "country_code": context.country_code,
                },
            )
            if created:
                user.set_password(password)
            else:
                user.email = email
                user.name = f"{context.org_label} {name}"
                user.phone = phone
                user.city = context.city
                user.region = context.region
                user.country_code = context.country_code
                user.set_password(password)
            user.save()
            UserRole.objects.get_or_create(user=user, org=org, role_definition=role)
            users.append(user)
        return users

    def _create_landlords(self, *, org: Org, context: CityContext) -> list[Landlord]:
        landlords: list[Landlord] = []
        for idx, name in enumerate(context.landlord_names, start=1):
            landlords.append(
                Landlord.objects.create(
                    org=org,
                    name=name,
                    legal_name=f"{name} Ltd",
                    email=f"landlord{idx}@{slugify(org.name)}.demo.rentslab.local",
                    phone=f"{context.org_phone_prefix}{200000 + idx}",
                    address_line1=f"{context.street_prefixes[idx % len(context.street_prefixes)]} {idx}",
                    city=context.city,
                    region=context.region,
                    country_code=context.country_code,
                )
            )
        return landlords

    def _create_services(self, *, org: Org, context: CityContext) -> list[Service]:
        return [
            Service.objects.create(
                org=org,
                name=name,
                billing_type="fixed",
                currency=context.currency,
                is_active=True,
            )
            for name in context.service_names
        ]

    def _create_buildings(
        self,
        *,
        org: Org,
        context: CityContext,
        landlords: list[Landlord],
        buildings_count: int,
    ) -> list[Building]:
        buildings: list[Building] = []
        for idx in range(buildings_count):
            prefix = context.building_prefixes[idx % len(context.building_prefixes)]
            buildings.append(
                Building.objects.create(
                    org=org,
                    landlord=landlords[idx % len(landlords)],
                    name=f"{prefix} {idx + 1}",
                    address_line1=f"{context.street_prefixes[idx % len(context.street_prefixes)]} {10 + idx}",
                    city=context.city,
                    region=context.region,
                    postal_code=f"{10000 + idx}",
                    country_code=context.country_code,
                    building_type="residential",
                )
            )
        return buildings

    def _create_units(self, *, buildings: list[Building], unit_count: int) -> list[Unit]:
        units: list[Unit] = []
        for idx in range(unit_count):
            building = buildings[idx % len(buildings)]
            floor = idx // len(buildings) + 1
            unit_number = f"{floor:02d}{(idx % 10) + 1:02d}"
            units.append(
                Unit.objects.create(
                    building=building,
                    unit_number=unit_number,
                    floor=str(floor),
                    unit_type="apartment",
                    status="occupied",
                )
            )
        return units

    def _create_tenants(self, *, org: Org, context: CityContext, unit_count: int) -> list[Tenant]:
        tenants: list[Tenant] = []
        for idx in range(unit_count):
            first = context.tenant_first_names[idx % len(context.tenant_first_names)]
            last = context.tenant_last_names[(idx // len(context.tenant_first_names)) % len(context.tenant_last_names)]
            full_name = f"{first} {last}"
            tenants.append(
                Tenant.objects.create(
                    org=org,
                    name=full_name,
                    tenant_type="individual",
                    email=f"{slugify(first)}.{slugify(last)}.{idx + 1}@tenant.demo.rentslab.local",
                    phone=f"{context.org_phone_prefix}{300000 + idx:06d}",
                    address_line1=f"{context.street_prefixes[idx % len(context.street_prefixes)]} {100 + idx}",
                    city=context.city,
                    region=context.region,
                    country_code=context.country_code,
                )
            )
        return tenants

    def _create_leases(
        self,
        *,
        units: list[Unit],
        tenants: list[Tenant],
        managed_by: User,
        currency: str,
        context: CityContext,
    ) -> list[Lease]:
        leases: list[Lease] = []
        base_date = date.today().replace(day=1)
        rent_base = RENT_BASE_BY_CURRENCY.get(currency, Decimal("1000.00"))
        rent_step = RENT_STEP_BY_CURRENCY.get(currency, Decimal("50.00"))
        for idx, (unit, tenant) in enumerate(zip(units, tenants)):
            rent = rent_base + (rent_step * Decimal(idx % 10))
            start_date = base_date - timedelta(days=30 * ((idx % 6) + 1))
            leases.append(
                Lease.objects.create(
                    unit=unit,
                    tenant=tenant,
                    managed_by=managed_by,
                    start_date=start_date,
                    end_date=None,
                    rent_amount=rent,
                    rent_currency=currency,
                    deposit_amount=rent,
                    deposit_currency=currency,
                    billing_cycle="monthly",
                    status="active",
                    billing_same_as_tenant_address=True,
                    billing_city=context.city,
                    billing_region=context.region,
                    billing_country_code=context.country_code,
                    external_reference=f"LEASE-{slugify(context.city).upper()}-{idx + 1:04d}",
                )
            )
        return leases

    def _create_subscriptions(
        self,
        *,
        leases: list[Lease],
        services: list[Service],
        currency: str,
    ) -> list[ServiceSubscription]:
        subs: list[ServiceSubscription] = []
        rate_base = SERVICE_RATE_BASE_BY_CURRENCY.get(currency, Decimal("20.00"))
        rate_step = SERVICE_RATE_STEP_BY_CURRENCY.get(currency, Decimal("2.00"))
        for idx, lease in enumerate(leases):
            for service in services[:2]:
                rate = rate_base + (rate_step * Decimal(idx % 7))
                subs.append(
                    ServiceSubscription.objects.create(
                        lease=lease,
                        service=service,
                        rate=rate,
                        currency=currency,
                        billing_cycle="monthly",
                        effective_from=lease.start_date,
                    )
                )
        return subs
