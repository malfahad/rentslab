"""Aggregate API routes under /api/v1/."""

from django.urls import include, path

urlpatterns = [
    path('auth/', include('users.auth_urls')),
    path('users/', include('users.urls')),
    path('user-roles/', include('user_role.urls')),
    path('access/', include('access.urls')),
    path('orgs/', include('org.urls')),
    path('landlords/', include('landlord.urls')),
    path('buildings/', include('building.urls')),
    path('units/', include('unit.urls')),
    path('tenants/', include('tenant.urls')),
    path('leases/', include('lease.urls')),
    path('services/', include('service.urls')),
    path('service-subscriptions/', include('service_subscription.urls')),
    path('invoices/', include('invoice.urls')),
    path('invoice-line-items/', include('invoice_line_item.urls')),
    path('credit-notes/', include('credit_note.urls')),
    path('payments/', include('payment.urls')),
    path('payment-allocations/', include('payment_allocation.urls')),
    path('payment-links/', include('payment_link.urls')),
    path('license-payments/', include('license_payment.urls')),
    path('vendors/', include('vendor.urls')),
    path('expense-categories/', include('expense_category.urls')),
    path('job-orders/', include('job_order.urls')),
    path('expenses/', include('expense.urls')),
    path('reports/', include('reports.urls')),
]
