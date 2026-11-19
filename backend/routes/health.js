import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'API конструктора туров работает'
  });
});

export default router;