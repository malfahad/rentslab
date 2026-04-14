from rest_framework import serializers

from access.services import get_org_id_from_request
from invoice.models import Invoice

from .constants import is_transition_allowed
from .models import JobOrder
from .services import next_job_number


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
        extra_kwargs = {
            'job_number': {'required': False, 'allow_blank': True},
        }
        # Default UniqueTogetherValidator requires job_number in input; we assign it in create().
        validators = []

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

        if 'status' in attrs and self.instance is not None:
            old = self.instance.status
            new = attrs['status']
            if not is_transition_allowed(old, new):
                raise serializers.ValidationError(
                    {'status': f'Transition from {old!r} to {new!r} is not allowed.'}
                )

        return attrs

    def create(self, validated_data):
        org = validated_data['org']
        jn = validated_data.get('job_number')
        if jn is None or not str(jn).strip():
            validated_data['job_number'] = next_job_number(org.pk)
        instance = JobOrder(**validated_data)
        instance.full_clean()
        instance.save()
        return instance

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.full_clean()
        instance.save()
        return instance


class JobOrderRechargeSerializer(serializers.Serializer):
    invoice = serializers.PrimaryKeyRelatedField(
        queryset=Invoice.objects.select_related('lease', 'lease__unit', 'lease__unit__building', 'org'),
    )
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    description = serializers.CharField(max_length=512)
