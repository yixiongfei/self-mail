import { Router } from 'express';
import prisma from '../db/client';
import { DEFAULT_CATEGORIES } from '../parser/categoryMatcher';

const router = Router();

// Seed default categories if table is empty
async function ensureDefaults() {
  // Always upsert all default categories so they are never missing
  for (const name of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where:  { name },
      update: { isCustom: false },  // ensure default ones stay non-custom
      create: { name, isCustom: false },
    });
  }
}

// GET /api/categories
router.get('/', async (_req, res) => {
  await ensureDefaults();
  const rows = await prisma.category.findMany({ orderBy: [{ isCustom: 'asc' }, { id: 'asc' }] });
  res.json(rows);
});

// POST /api/categories  { name: "新分类" }
router.post('/', async (req, res) => {
  const { name } = req.body as { name: string };
  if (!name?.trim()) {
    res.status(400).json({ error: '分类名称不能为空' });
    return;
  }
  try {
    const created = await prisma.category.create({ data: { name: name.trim(), isCustom: true } });
    res.json(created);
  } catch {
    res.status(409).json({ error: '该分类已存在' });
  }
});

// DELETE /api/categories/:id  (only custom categories)
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) { res.status(404).json({ error: '分类不存在' }); return; }
  if (!cat.isCustom) { res.status(403).json({ error: '默认分类不能删除' }); return; }
  await prisma.category.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
