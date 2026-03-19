import { Router } from 'express';
import { runSync } from '../services/syncService';

const router = Router();

router.post('/', async (_req, res) => {
  try {
    const result = await runSync();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
