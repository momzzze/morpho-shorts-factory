import Router from 'express';
import { healthRouter } from './health/index.js';
import { apiModules, registerModules } from '../modules/index.js';

const router = Router();

router.use('/health', healthRouter);

registerModules(router, apiModules);

export default router;
