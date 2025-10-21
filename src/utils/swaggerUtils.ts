import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { logInfo } from '../middlewares/logger.middle';

export function loadSwaggerDocument(__dirname: string): any {
  try {
    logInfo('Loading swagger document...', { dir: __dirname });
    const swaggerPath = path.join(__dirname, 'openapi.yaml');
    if (fs.existsSync(swaggerPath)) {
      const file = fs.readFileSync(swaggerPath, 'utf8');
      return YAML.parse(file);
    }
  } catch (err) {
    // Optionally log error if needed
  }
  return null;
}
