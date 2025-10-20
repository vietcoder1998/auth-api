import { Request, Response } from 'express';
import { seedService } from '../services/seed.service';

// Seed all data
export async function seedAll(req: Request, res: Response) {
  try {
    const result = await seedService.seedAll();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Seed all controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed database',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Seed permissions only
export async function seedPermissions(req: Request, res: Response) {
  try {
    const result = await seedService.seedPermissions();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Seed permissions controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed permissions',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Seed roles only
export async function seedRoles(req: Request, res: Response) {
  try {
    const result = await seedService.seedRoles();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Seed roles controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed roles',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Seed users only
export async function seedUsers(req: Request, res: Response) {
  try {
    const result = await seedService.seedUsers();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Seed users controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed users',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Seed configurations only
export async function seedConfigs(req: Request, res: Response) {
  try {
    const result = await seedService.seedConfigs();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Seed configs controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed configurations',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Seed AI agents only
export async function seedAgents(req: Request, res: Response) {
  try {
    const result = await seedService.seedAgents();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Seed agents controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed AI agents',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Seed API keys only
export async function seedApiKeys(req: Request, res: Response) {
  try {
    const result = await seedService.seedApiKeys();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Seed API keys controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed API keys',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Clear all data (dangerous operation)
export async function clearAll(req: Request, res: Response) {
  try {
    const { confirm } = req.body;

    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required. Send { "confirm": "DELETE_ALL_DATA" } to proceed.',
        errors: ['Missing or invalid confirmation'],
      });
    }

    const result = await seedService.clearAll();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Clear all controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear database',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Get database statistics
export async function getStats(req: Request, res: Response) {
  try {
    const result = await seedService.getStats();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Get stats controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database statistics',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

// Get seed data for viewing
export async function getSeedData(req: Request, res: Response) {
  try {
    const result = await seedService.getSeedData();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Get seed data controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve seed data',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}
