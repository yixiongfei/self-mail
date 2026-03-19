const BASE = '/api';

export interface Transaction {
  id: number;
  approvalNumber: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  categorySource: 'auto' | 'manual';
}

export interface MonthlyStats {
  month: string;  // "2026-03"
  total: number;
}

export interface CategoryStats {
  category: string;
  total: number;
}

export interface TransactionPage {
  rows: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export async function getTransactions(params: {
  year?: number;
  month?: number;
  category?: string;
  page?: number;
  limit?: number;
  sortAmount?: 'asc' | 'desc';
}): Promise<TransactionPage> {
  const q = new URLSearchParams();
  if (params.year)        q.set('year',        String(params.year));
  if (params.month)       q.set('month',       String(params.month));
  if (params.category)    q.set('category',    params.category);
  if (params.page)        q.set('page',        String(params.page));
  if (params.limit)       q.set('limit',       String(params.limit));
  if (params.sortAmount)  q.set('sortAmount',  params.sortAmount);
  const res = await fetch(`${BASE}/transactions?${q}`);
  return res.json();
}

export async function updateCategory(id: number, category: string): Promise<Transaction> {
  const res = await fetch(`${BASE}/transactions/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ category }),
  });
  return res.json();
}

export async function getMonthlyStats(): Promise<MonthlyStats[]> {
  const res = await fetch(`${BASE}/transactions/stats/monthly`);
  return res.json();
}

export async function getCategoryStats(year?: number, month?: number): Promise<CategoryStats[]> {
  const q = new URLSearchParams();
  if (year)  q.set('year',  String(year));
  if (month) q.set('month', String(month));
  const res = await fetch(`${BASE}/transactions/stats/category?${q}`);
  return res.json();
}

export interface Category {
  id: number;
  name: string;
  isCustom: boolean;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE}/categories`);
  return res.json();
}

export async function createCategory(name: string): Promise<Category> {
  const res = await fetch(`${BASE}/categories`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name }),
  });
  return res.json();
}

export async function deleteCategory(id: number): Promise<void> {
  await fetch(`${BASE}/categories/${id}`, { method: 'DELETE' });
}

export async function triggerSync(): Promise<{ mode: string; fetched: number; imported: number; skipped: number }> {
  const res = await fetch(`${BASE}/sync`, { method: 'POST' });
  return res.json();
}
