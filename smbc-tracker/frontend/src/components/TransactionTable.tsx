import { useState } from 'react';
import { Transaction, updateCategory } from '../api';

const CATEGORIES = [
  'コンビニ', 'スーパー', '飲食・レストラン', 'カフェ', '交通',
  'ショッピング', 'エンタメ', '医療・薬局', '公共料金', 'ATM・銀行', '未分類',
];

interface Props {
  rows: Transaction[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onUpdated: (tx: Transaction) => void;
}

export default function TransactionTable({ rows, total, page, limit, onPageChange, onUpdated }: Props) {
  const [editing, setEditing] = useState<number | null>(null);
  const totalPages = Math.ceil(total / limit);

  async function handleCategoryChange(id: number, category: string) {
    const updated = await updateCategory(id, category);
    onUpdated(updated);
    setEditing(null);
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f0f4f8', textAlign: 'left' }}>
            <th style={th}>日期</th>
            <th style={th}>商户名称</th>
            <th style={{ ...th, textAlign: 'right' }}>金额</th>
            <th style={th}>分类</th>
            <th style={th}>来源</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => (
            <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}>{new Date(tx.date).toLocaleDateString('ja-JP')}</td>
              <td style={td}>{tx.merchant}</td>
              <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                ¥{tx.amount.toLocaleString()}
              </td>
              <td style={td}>
                {editing === tx.id ? (
                  <select
                    autoFocus
                    defaultValue={tx.category}
                    onBlur={() => setEditing(null)}
                    onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                    style={{ fontSize: 12, padding: '2px 4px' }}
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
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
const td: React.CSSProperties = { padding: '9px 14px', color: '#333' };
const btn: React.CSSProperties = {
  padding: '4px 10px', border: '1px solid #ddd', borderRadius: 4,
  background: '#fff', cursor: 'pointer', fontSize: 12,
};
