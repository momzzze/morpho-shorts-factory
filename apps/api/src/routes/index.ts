import Router from 'express';
import { healthRouter } from './health/index.js';
import messagesRouter from './messages/index.js';
import authRouter from './auth/index.js';
import videosRouter from './videos/index.js';
import testRouter from './test/index.js';
import footballRouter from './football/index.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/messages', messagesRouter);
router.use('/videos', videosRouter);
router.use('/test', testRouter);
router.use('/football', footballRouter);

export default router;
