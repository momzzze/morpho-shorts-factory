import type { Router } from 'express';

export interface ApiModule {
  name: string;
  basePath: string;
  router: Router;
}
