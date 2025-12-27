import Router from 'express';
import { healthRouter } from './health/index.js';
import messagesRouter from './messages/index.js';
import authRouter from './auth/index.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/messages', messagesRouter);

export default router;
