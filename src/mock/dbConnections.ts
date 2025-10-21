// Mock database connections for seeding and testing
// Modular mock database connections for seeding
export function getMockDatabaseConnections(superadminId: string, adminId: string) {
  return [
    {
      name: 'Main MySQL',
      description: 'Primary MySQL database for production',
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      database: 'calendation_prod',
      username: 'root',
      password: 'password',
      isActive: true,
      ssl: false,
      timeout: 30000,
      backupEnabled: true,
      backupPath: '/backups/prod',
      createdBy: superadminId,
    },
    {
      name: 'Dev MySQL',
      description: 'Development MySQL database',
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      database: 'calendation_dev',
      username: 'devuser',
      password: 'devpass',
      isActive: true,
      ssl: false,
      timeout: 30000,
      backupEnabled: false,
      backupPath: null,
      createdBy: adminId,
    },
  ];
}
