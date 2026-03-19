import { useState, useEffect } from 'react';
import { Transaction, updateCategory, getCategories, createCategory, deleteCategory, Category } from '../api';

interface Props {
  rows: Transaction[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onUpdated: (tx: Transaction) => void;
  sortAmount?: 'asc' | 'desc';
  onSortAmount: (sort: 'asc' | 'desc' | undefined) => void;
}

export default function TransactionTable({ rows, total, page, limit, onPageChange, onUpdated, sortAmount, onSortAmount }: Props) {
  const [editing, setEditing]         = useState<number | null>(null);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [newCatName, setNewCatName]   = useState('');
  const [addError, setAddError]       = useState('');
  const totalPages = Math.ceil(total / limit);

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    const data = await getCategories();
    setCategories(data);
  }

  async function handleCategoryChange(id: number, category: string) {
    const updated = await updateCategory(id, category);
    onUpdated(updated);
    setEditing(null);
  }

  async function handleAddCategory() {
    const name = newCatName.trim();
    if (!name) return;
    const result = await createCategory(name) as any;
    if (result.error) { setAddError(result.error); return; }
    setNewCatName('');
    setAddError('');
    await loadCategories();
  }

  async function handleDeleteCategory(id: number) {
    await deleteCategory(id);
    await loadCategories();
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>

      {/* Category Manager Toggle */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setShowManager((v) => !v)} style={{ ...btn, color: '#3730a3', borderColor: '#c7d2fe' }}>
          {showManager ? '收起' : '⚙ 管理分类'}
        </button>
      </div>

      {/* Category Manager Panel */}
      {showManager && (
        <div style={{ padding: '12px 16px', background: '#f8f9ff', borderBottom: '1px solid #e0e7ff' }}>
          <p style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
            点击 <span style={{ color: '#dc2626' }}>✕</span> 可删除自定义分类（默认分类不可删除）
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {categories.map((cat) => (
              <span key={cat.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 4, fontSize: 12,
                background: cat.isCustom ? '#fef3c7' : '#eef2ff',
                color: cat.isCustom ? '#92400e' : '#3730a3',
                border: `1px solid ${cat.isCustom ? '#fcd34d' : '#c7d2fe'}`,
              }}>
                {cat.name}
                {cat.isCustom && (
                  <button onClick={() => handleDeleteCategory(cat.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 13, padding: 0, lineHeight: 1 }}>
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
          {/* Add custom category */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="输入自定义分类名称..."
              style={{ flex: 1, maxWidth: 200, padding: '5px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
            />
            <button onClick={handleAddCategory} style={{ ...btn, background: '#3730a3', color: '#fff', border: 'none' }}>
              + 添加
            </button>
            {addError && <span style={{ fontSize: 12, color: '#dc2626' }}>{addError}</span>}
          </div>
        </div>
      )}

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: 110 }} />
          <col />
          <col style={{ width: 110 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 70 }} />
        </colgroup>
        <thead>
          <tr style={{ background: '#f0f4f8', textAlign: 'left' }}>
            <th style={th}>日期</th>
            <th style={th}>商户名称</th>
            <th style={{ ...th, textAlign: 'right' }}>
              <button
                onClick={() => onSortAmount(sortAmount === 'desc' ? 'asc' : sortAmount === 'asc' ? undefined : 'desc')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, color: sortAmount ? '#3730a3' : '#555', padding: 0 }}
              >
                金额 {sortAmount === 'desc' ? '↓' : sortAmount === 'asc' ? '↑' : '↕'}
              </button>
            </th>
            <th style={th}>分类</th>
            <th style={th}>来源</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => (
            <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}>{new Date(tx.date).toLocaleDateString('zh-CN')}</td>
              <td style={td}>{tx.merchant}</td>
              <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                ¥{tx.amount.toLocaleString()}
              </td>
              <td style={td}>
                {editing === tx.id ? (
                  <select
                    autoFocus
                    defaultValue={tx.category}
                    onBlur={() => setTimeout(() => setEditing(null), 150)}
                    onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                    style={{ fontSize: 12, padding: '2px 4px' }}
                  >
                    {categories.length === 0
                      ? <option value={tx.category}>{tx.category}</option>
                      : categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)
                    }
                  </select>
                ) : (
                  <span
                    onClick={() => setEditing(tx.id)}
                    style={{ cursor: 'pointer', padding: '2px 6px', borderRadius: 4, background: '#eef2ff', color: '#3730a3', fontSize: 12 }}
                    title="点击修改分类"
                  >
                    {tx.category}
                  </span>
                )}
              </td>
              <td style={{ ...td, fontSize: 11, color: tx.categorySource === 'manual' ? '#059669' : '#aaa' }}>
                {tx.categorySource === 'manual' ? '手动' : '自动'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #eee', fontSize: 13, color: '#666' }}>
        <span>共 {total} 笔</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} style={btn}>‹ 上一页</button>
          <span style={{ padding: '4px 8px' }}>{page} / {totalPages}</span>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} style={btn}>下一页 ›</button>
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: '10px 14px', fontWeight: 600, fontSize: 12, color: '#555' };
const td: React.CSSProperties = { padding: '9px 14px', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const btn: React.CSSProperties = {
  padding: '4px 10px', border: '1px solid #ddd', borderRadius: 4,
  background: '#fff', cursor: 'pointer', fontSize: 12,
};
