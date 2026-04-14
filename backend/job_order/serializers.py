from rest_framework import serializers

from access.services import get_org_id_from_request

from .models import JobOrder


class JobOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobOrder
        fields = [
            'id',
            'org',
            'job_number',
            'building',
            'unit',
            'vendor',
            'title',
            'description',
            'status',
            'priority',
            'reported_at',
            'scheduled_start',
            'scheduled_end',
            'completed_at',
            'estimated_cost',
            'actual_cost',
            'reported_by',
            'external_reference',
            'created_at',
            'updated_at',
        ]

    def validate_org(self, org):
        request = self.context.get('request')
        oid = get_org_id_from_request(request) if request else None
        if oid is not None and org.pk != oid:
            raise serializers.ValidationError('Organization does not match request context.')
        return org

    def validate(self, attrs):
        request = self.context.get('request')
        org_id = get_org_id_from_request(request) if request else None

        building = attrs.get('building')
        if building is None and self.instance is not None:
            building = self.instance.building

        unit = attrs.get('unit')
        if unit is None and self.instance is not None:
            unit = self.instance.unit

        vendor = attrs.get('vendor')
        if vendor is None and self.instance is not None:
            vendor = self.instance.vendor

        org = attrs.get('org')
        if org is None and self.instance is not None:
            org = self.instance.org

        if building and org_id is not None and building.org_id != org_id:
            raise serializers.ValidationError({'building': 'Building is not in the current organization.'})
        if building and org and building.org_id != org.pk:
            raise serializers.ValidationError({'building': 'Building must belong to the job order organization.'})
        if org and building and building.org_id != org.pk:
            raise serializers.ValidationError({'building': 'Building must belong to the job order organization.'})

        if unit and building and unit.building_id != building.pk:
            raise serializers.ValidationError({'unit': 'Unit must belong to the selected building.'})
        if unit and org_id is not None and unit.building.org_id != org_id:
            raise serializers.ValidationError({'unit': 'Unit is not in the current organization.'})

        if vendor and org_id is not None and vendor.org_id != org_id:
            raise serializers.ValidationError({'vendor': 'Vendor is not in the current organization.'})
        if vendor and org and vendor.org_id != org.pk:
            raise serializers.ValidationError({'vendor': 'Vendor must belong to the job order organization.'})

        return attrs
