from rest_framework import serializers


class IssueInvoicesRequestSerializer(serializers.Serializer):
    as_of = serializers.DateField(required=False, allow_null=True)
    dry_run = serializers.BooleanField(default=False)
