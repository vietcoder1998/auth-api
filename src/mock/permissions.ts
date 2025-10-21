// Split permissions into separate files for maintainability
import { userPermissions } from './permissions/user';
import { rolePermissions } from './permissions/role';
import { permissionPermissions } from './permissions/permission';
import { systemPermissions } from './permissions/system';
import { reportPermissions } from './permissions/report';
import { apiPermissions } from './permissions/api';
import { notificationPermissions } from './permissions/notification';
import { mockRoles } from './permissions/roles';
import { otherPermissions } from './permissions/other';
import { faqPermissions } from './permissions/faq';
import { mailTemplatePermissions } from './permissions/mailTemplates';
import { promptPermissions } from './permissions/prompts';
import { socketPermissions } from './permissions/socket';
import { labelPermissions } from './permissions/labels';

export const mockPermissions = [
  ...userPermissions,
  ...rolePermissions,
  ...permissionPermissions,
  ...systemPermissions,
  ...reportPermissions,
  ...apiPermissions,
  ...notificationPermissions,
  ...otherPermissions,
  ...faqPermissions,
  ...mailTemplatePermissions,
  ...promptPermissions,
  ...socketPermissions,
  ...labelPermissions,
];

// Modular mock roles
export { mockRoles }
