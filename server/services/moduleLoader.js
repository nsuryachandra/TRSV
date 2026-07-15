import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODULES_DIR = path.join(__dirname, '../modules');

// Keep track of registered modules metadata for analytics/settings/palette indexing
export const registeredModules = [];

export async function loadModules(app) {
  console.log('🔌 [Module Loader] Scanning server modules directory...');
  
  if (!fs.existsSync(MODULES_DIR)) {
    console.warn('⚠️ [Module Loader] Modules directory does not exist at:', MODULES_DIR);
    return;
  }

  const items = fs.readdirSync(MODULES_DIR);

  for (const item of items) {
    const itemPath = path.join(MODULES_DIR, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      const indexFile = path.join(itemPath, 'index.js');
      if (fs.existsSync(indexFile)) {
        try {
          // Dynamically import module definition
          const moduleUrl = `file://${indexFile.replace(/\\/g, '/')}`;
          const moduleObj = await import(moduleUrl);
          const moduleDef = moduleObj.default;

          if (!moduleDef || !moduleDef.id) {
            console.error(`🚨 [Module Loader] Invalid module export in "${item}"`);
            continue;
          }

          // Register router under api/modules/:id
          if (moduleDef.router) {
            app.use(`/api/modules/${moduleDef.id}`, moduleDef.router);
            console.log(`✅ [Module Loader] Registered API routes for: "${moduleDef.name || moduleDef.id}" -> /api/modules/${moduleDef.id}`);
          }

          // Register event listeners for the Automation Engine
          if (moduleDef.listeners) {
            const eventEmitter = (await import('./eventEmitter.js')).default;
            for (const [event, handler] of Object.entries(moduleDef.listeners)) {
              eventEmitter.on(event, handler);
              console.log(`🤖 [Module Loader] Registered listener: "${event}" -> ${moduleDef.id}`);
            }
          }

          // Save module metadata
          registeredModules.push({
            id: moduleDef.id,
            name: moduleDef.name || moduleDef.id,
            description: moduleDef.description || '',
            permissions: moduleDef.permissions || []
          });

        } catch (err) {
          console.error(`🚨 [Module Loader] Failed to load module "${item}":`, err.message);
        }
      }
    }
  }

  console.log(`🎉 [Module Loader] Successfully loaded ${registeredModules.length} modular plug-ins.`);
}
