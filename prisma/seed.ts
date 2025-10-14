import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create permissions with categories and descriptions
  const permissions = [
    { name: 'create_user', description: 'Create new users', category: 'user' },
    { name: 'read_user', description: 'View user information', category: 'user' },
    { name: 'update_user', description: 'Update user information', category: 'user' },
    { name: 'delete_user', description: 'Delete users', category: 'user' },
    { name: 'manage_users', description: 'Full user management access', category: 'user' },
    
    { name: 'create_role', description: 'Create new roles', category: 'role' },
    { name: 'read_role', description: 'View role information', category: 'role' },
    { name: 'update_role', description: 'Update role information', category: 'role' },
    { name: 'delete_role', description: 'Delete roles', category: 'role' },
    { name: 'manage_roles', description: 'Full role management access', category: 'role' },
    
    { name: 'create_permission', description: 'Create new permissions', category: 'permission' },
    { name: 'read_permission', description: 'View permission information', category: 'permission' },
    { name: 'update_permission', description: 'Update permission information', category: 'permission' },
    { name: 'delete_permission', description: 'Delete permissions', category: 'permission' },
    { name: 'manage_permissions', description: 'Full permission management access', category: 'permission' },
    
    { name: 'system_admin', description: 'System administration access', category: 'system' },
    { name: 'system_config', description: 'System configuration access', category: 'system' },
    { name: 'system_logs', description: 'View system logs', category: 'system' },
    { name: 'manage_cache', description: 'Manage cache system', category: 'system' },
    
    { name: 'view_reports', description: 'View system reports', category: 'report' },
    { name: 'create_reports', description: 'Create new reports', category: 'report' },
    { name: 'export_reports', description: 'Export reports', category: 'report' },
    
    { name: 'api_access', description: 'Basic API access', category: 'api' },
    { name: 'api_admin', description: 'Admin API access', category: 'api' },
    
    { name: 'view_self', description: 'View own profile', category: 'user' }
  ];
  
  const permissionRecords = await Promise.all(
    permissions.map(permission => prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        description: permission.description,
        category: permission.category
      },
      create: {
        name: permission.name,
        description: permission.description,
        category: permission.category
      }
    }))
  );

  // Create roles
  const superadminRole = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {},
    create: {
      name: 'superadmin',
      permissions: {
        connect: permissionRecords.map(p => ({ id: p.id }))
      }
    }
  });
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      permissions: {
        connect: permissionRecords.filter(p => ['manage_users', 'view_reports'].includes(p.name)).map(p => ({ id: p.id }))
      }
    }
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      permissions: {
        connect: permissionRecords.filter(p => p.name === 'view_self').map(p => ({ id: p.id }))
      }
    }
  });

  // Create users
  await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      password: 'superadmin123',
      nickname: 'Super Admin',
      roleId: superadminRole.id,
      status: 'active'
    }
  });
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: 'admin123',
      nickname: 'Admin',
      roleId: adminRole.id,
      status: 'active'
    }
  });
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: 'user123',
      nickname: 'User',
      roleId: userRole.id,
      status: 'active'
    }
  });

  // Seed CORS config
  await prisma.config.upsert({
    where: { key: 'cors_origin' },
    update: { value: 'http://localhost:3000' },
    create: { key: 'cors_origin', value: 'http://localhost:3000' }
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
