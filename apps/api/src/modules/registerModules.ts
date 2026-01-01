import type { Router } from 'express';
import type { ApiModule } from './module.types.js';

export function registerModules(router: Router, modules: ApiModule[]): void {
  modules.forEach((module) => {
    router.use(module.basePath, module.router);
  });
}
