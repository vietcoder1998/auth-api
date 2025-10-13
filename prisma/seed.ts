import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create permissions
  const permissions = [
    'manage_users',
    'manage_roles',
    'view_reports',
    'view_self'
  ];
  const permissionRecords = await Promise.all(
    permissions.map(name => prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name }
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
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
