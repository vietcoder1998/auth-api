// Split permissions into separate files for maintainability
import { userPermissions } from './permissions/user';
import { rolePermissions } from './permissions/role';
import { permissionPermissions } from './permissions/permission';
import { cachePermissions } from './permissions/cache';
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
import { notificationTemplatePermissions } from './permissions/notificationTemplates';
import { documentPermissions } from './permissions/documents';
import { filePermissions } from './permissions/files';
import { tokenPermissions } from './permissions/tokens';
import { conversationPermissions } from './permissions/conversations';
import { ssoPermissions } from './permissions/sso';
import { apiKeyPermissions } from './permissions/apiKeys';

import { blogPermissions, categoryPermissions } from './permissions/blog';
import { jobExamplePermissions } from './permissions/jobExamples';

import { aiPlatformPermissions } from './permissions/aiPlatform';
import { aiKeyPermissions } from './permissions/aiKey';
import { billingPermissions } from './permissions/billing';

export const mockPermissions = [
  ...blogPermissions,
  ...categoryPermissions,
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
  ...cachePermissions,
  ...dbConnectionPermissions,
  ...loginHistoryPermissions,
  ...logicHistoryPermissions,
  ...configPermissions,
  ...agentPermissions,
  ...jobPermissions,
  ...notificationPermissionsExtra,
  ...seedPermissions,
  ...notificationTemplatePermissions,
  ...documentPermissions,
  ...filePermissions,
  ...tokenPermissions,
  ...conversationPermissions,
  ...ssoPermissions,
  ...apiKeyPermissions,
  ...jobExamplePermissions,
  ...aiPlatformPermissions,
  ...aiKeyPermissions,
  ...billingPermissions,
];

// Modular mock roles
export { mockRoles };
