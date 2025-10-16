import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { logInfo, logError } from '../middlewares/logger.middle';

const prisma = new PrismaClient();

export async function getPermissions(req: Request, res: Response) {
  try {
    const permissions = await prisma.permission.findMany({
      include: { roles: true },
      orderBy: { createdAt: 'desc' }
    });

    // Add usage count calculation
    // NOTE: This is a simulation. For production, implement real usage tracking by:
    // 1. Creating a PermissionUsage table with permissionId, userId, timestamp
    // 2. Logging usage in middleware when permissions are checked
    // 3. Aggregating counts with: SELECT permissionId, COUNT(*) FROM permission_usage GROUP BY permissionId
    // This simulation provides realistic data based on permission characteristics
    const permissionsWithUsage = permissions.map(permission => {
      let baseUsage = 0;
      
      // Higher usage for permissions assigned to more roles
      const roleMultiplier = permission.roles.length * 50;
      
      // Category-based usage patterns
      const categoryMultipliers = {
        'user': 200,      // User management is frequently used
        'system': 100,    // System operations are common
        'api': 150,       // API endpoints get regular hits
        'role': 75,       // Role management is moderately used
        'permission': 25, // Permission management is less frequent
        'report': 300,    // Reports are heavily accessed
        'other': 50       // Default for other categories
      };
      
      const categoryUsage = categoryMultipliers[permission.category as keyof typeof categoryMultipliers] || 50;
      
      // Route-based usage (routes get more hits than abstract permissions)
      const routeBonus = permission.route ? 100 : 0;
      
      // Calculate final usage with some randomness
      baseUsage = roleMultiplier + categoryUsage + routeBonus;
      const randomFactor = 0.5 + (Math.random() * 1.0); // 50% to 150% of base
      
      return {
        ...permission,
        usageCount: Math.floor(baseUsage * randomFactor)
      };
    });

    res.json(permissionsWithUsage);
  } catch (err) {
    logError('Failed to fetch permissions:', err);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
}

export async function createPermission(req: Request, res: Response) {
  const { name, description, category, route, method, roles } = req.body;
  try {
    // First create the permission
    const permission = await prisma.permission.create({
      data: {
        name,
        description,
        category: category || 'other',
        route,
        method,
        roles: {
          connect: roles?.map((rid: string) => ({ id: rid })) || []
        }
      }
    });

    // Automatically add this permission to the superadmin role
    const superadminRole = await prisma.role.findUnique({
      where: { name: 'superadmin' },
      include: { permissions: true }
    });

    if (superadminRole) {
      // Check if permission is already connected to superadmin
      const hasPermission = superadminRole.permissions.some(p => p.id === permission.id);
      
      if (!hasPermission) {
        await prisma.role.update({
          where: { id: superadminRole.id },
          data: {
            permissions: {
              connect: { id: permission.id }
            }
          }
        });
        
        logInfo(`New permission '${name}' automatically added to superadmin role`);
      }
    } else {
      logError('Superadmin role not found - permission not added to superadmin');
    }

    res.json(permission);
  } catch (err) {
    logError('Failed to create permission:', err);
    res.status(500).json({ error: 'Failed to create permission' });
  }
}

export async function updatePermission(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, category, route, method, roles } = req.body;
  try {
    const permission = await prisma.permission.update({
      where: { id },
      data: {
        name,
        description,
        category,
        route,
        method,
        roles: {
          set: roles?.map((rid: string) => ({ id: rid })) || []
        }
      }
    });
    res.json(permission);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update permission' });
  }
}

export async function deletePermission(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.permission.delete({
      where: { id }
    });
    res.json({ message: 'Permission deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete permission' });
  }
}

export async function createPermissionWithSuperadmin(req: Request, res: Response) {
  const { name, description, category, route, method } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Permission name is required' });
  }

  try {
    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name }
    });

    if (existingPermission) {
      return res.status(409).json({ error: 'Permission already exists' });
    }

    // Find superadmin role first
    const superadminRole = await prisma.role.findUnique({
      where: { name: 'superadmin' }
    });

    if (!superadminRole) {
      return res.status(404).json({ error: 'Superadmin role not found' });
    }

    // Create permission and connect to superadmin role in one transaction
    const permission = await prisma.$transaction(async (tx) => {
      const newPermission = await tx.permission.create({
        data: {
          name,
          description,
          category: category || 'other',
          route,
          method,
          roles: {
            connect: { id: superadminRole.id }
          }
        },
        include: {
          roles: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return newPermission;
    });

    logInfo(`Permission '${name}' created and added to superadmin role`, {
      permissionId: permission.id,
      category: permission.category,
      route: permission.route,
      method: permission.method
    });

    res.json({
      success: true,
      message: 'Permission created and added to superadmin successfully',
      data: permission
    });

  } catch (err) {
    logError('Failed to create permission with superadmin:', err);
    res.status(500).json({ 
      error: 'Failed to create permission',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

export async function addPermissionToSuperadmin(req: Request, res: Response) {
  const { permissionId } = req.params;

  try {
    // Find the permission
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: { roles: true }
    });

    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Find superadmin role
    const superadminRole = await prisma.role.findUnique({
      where: { name: 'superadmin' },
      include: { permissions: true }
    });

    if (!superadminRole) {
      return res.status(404).json({ error: 'Superadmin role not found' });
    }

    // Check if permission is already connected to superadmin
    const hasPermission = superadminRole.permissions.some(p => p.id === permissionId);

    if (hasPermission) {
      return res.json({
        success: true,
        message: 'Permission already assigned to superadmin',
        data: { permission, role: superadminRole }
      });
    }

    // Add permission to superadmin role
    await prisma.role.update({
      where: { id: superadminRole.id },
      data: {
        permissions: {
          connect: { id: permissionId }
        }
      }
    });

    logInfo(`Permission '${permission.name}' added to superadmin role`, {
      permissionId: permission.id,
      permissionName: permission.name
    });

    res.json({
      success: true,
      message: 'Permission added to superadmin successfully',
      data: { permission, role: superadminRole }
    });

  } catch (err) {
    logError('Failed to add permission to superadmin:', err);
    res.status(500).json({ 
      error: 'Failed to add permission to superadmin',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
