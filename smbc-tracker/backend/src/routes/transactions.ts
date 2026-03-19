import { Router } from 'express';
import prisma from '../db/client';

const router = Router();

// GET /api/transactions?year=2026&month=3&category=コンビニ&page=1&limit=50
router.get('/', async (req, res) => {
  const { year, month, category, page = '1', limit = '50' } = req.query as Record<string, string>;

  const where: any = {};
  if (year && month) {
    const from = new Date(`${year}-${month.padStart(2, '0')}-01T00:00:00+09:00`);
    const to   = new Date(from);
    to.setMonth(to.getMonth() + 1);
    where.date = { gte: from, lt: to };
  }
  if (category) where.category = category;

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const take  = parseInt(limit);

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy: { date: 'desc' }, skip, take }),
    prisma.transaction.count({ where }),
  ]);

  res.json({ rows, total, page: parseInt(page), limit: take });
});

// PATCH /api/transactions/:id  — update category manually (applies to all same-merchant records)
router.patch('/:id', async (req, res) => {
  const id           = parseInt(req.params.id);
  const { category } = req.body as { category: string };

  if (!category) {
    res.status(400).json({ error: 'category is required' });
    return;
  }

  // Find the merchant name for this transaction
  const target = await prisma.transaction.findUnique({ where: { id } });
  if (!target) {
    res.status(404).json({ error: 'transaction not found' });
    return;
  }

  // Update ALL transactions with the same merchant
  await prisma.transaction.updateMany({
    where: { merchant: target.merchant },
    data:  { category, categorySource: 'manual' },
  });

  // Return the updated record for the original id
  const updated = await prisma.transaction.findUnique({ where: { id } });
  res.json(updated);
});

// GET /api/transactions/stats/monthly — bar chart data
router.get('/stats/monthly', async (_req, res) => {
  const rows = await prisma.$queryRaw<{ month: string; total: bigint }[]>`
    SELECT
      strftime('%Y-%m', datetime(date / 1000, 'unixepoch', '+9 hours')) AS month,
      SUM(amount) AS total
    FROM "Transaction"
    GROUP BY month
    ORDER BY month ASC
  `;
  res.json(rows.map((r) => ({ month: r.month, total: Number(r.total) })));
});

// GET /api/transactions/stats/category — treemap data
router.get('/stats/category', async (req, res) => {
  const { year, month } = req.query as Record<string, string>;

  let dateFilter = '';
  const params: any[] = [];
  if (year && month) {
    dateFilter = `WHERE strftime('%Y-%m', datetime(date / 1000, 'unixepoch', '+9 hours')) = ?`;
    params.push(`${year}-${month.padStart(2, '0')}`);
  }

  const rows = await prisma.$queryRawUnsafe<{ category: string; total: bigint }[]>(
    `SELECT category, SUM(amount) AS total FROM "Transaction" ${dateFilter} GROUP BY category ORDER BY total DESC`,
    ...params
  );
  res.json(rows.map((r) => ({ category: r.category, total: Number(r.total) })));
});

export default router;
