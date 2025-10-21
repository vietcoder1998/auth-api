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
import { dbConnectionPermissions } from './permissions/dbConnections';
import { loginHistoryPermissions } from './permissions/loginHistory';
import { logicHistoryPermissions } from './permissions/logicHistory';
import { configPermissions } from './permissions/config';
import { agentPermissions } from './permissions/agents';
import { jobPermissions } from './permissions/jobs';
import { notificationPermissionsExtra } from './permissions/notifications';
import { seedPermissions } from './permissions/seed';

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
  ...dbConnectionPermissions,
  ...loginHistoryPermissions,
  ...logicHistoryPermissions,
  ...configPermissions,
  ...agentPermissions,
  ...jobPermissions,
  ...notificationPermissionsExtra,
  ...seedPermissions,
];

// Modular mock roles
export { mockRoles }
