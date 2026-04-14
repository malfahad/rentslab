from access.constants import ROLE_ADMIN
from access.models import RoleDefinition
from access.services import provision_default_roles_for_org
from test_helpers import create_org, create_user, create_user_role
from testing_common import DRFTestCase


class UserRoleAPITests(DRFTestCase):
    base = '/api/v1/user-roles/'

    def test_crud(self):
        org = create_org(name='UR Org')
        provision_default_roles_for_org(org)
        member_rd = RoleDefinition.objects.get(org=org, key='org_member')
        user = create_user(username='ur_user', email='ur@example.com')
        create_user_role(user=user, org=org, role='org_admin')
        other = create_user(username='ur_other', email='ur_o@example.com')
        self.client.force_authenticate(user=user)
        self.client.credentials(HTTP_X_ORG_ID=str(org.pk))
        created = self.assert_create(
            self.base,
            {'user': other.pk, 'role_definition': member_rd.pk},
        )
        pk = created['id']
        self.assert_retrieve_ok(f'{self.base}{pk}/')
        self.assert_patch_ok(f'{self.base}{pk}/', {'role_definition': member_rd.pk})
        self.assert_delete_ok(f'{self.base}{pk}/')
