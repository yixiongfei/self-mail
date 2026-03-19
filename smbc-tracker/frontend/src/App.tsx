import { useEffect, useState, useCallback } from 'react';
import MonthlyBarChart from './components/MonthlyBarChart';
import CategoryTreeMap from './components/CategoryTreeMap';
import TransactionTable from './components/TransactionTable';
import {
  getMonthlyStats, getCategoryStats, getTransactions, triggerSync,
  MonthlyStats, CategoryStats, Transaction, TransactionPage,
} from './api';

export default function App() {
  const [monthly, setMonthly]       = useState<MonthlyStats[]>([]);
  const [catStats, setCatStats]     = useState<CategoryStats[]>([]);
  const [txPage, setTxPage]         = useState<TransactionPage | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [filterCat, setFilterCat]   = useState<string>('');
  const [page, setPage]             = useState(1);
  const [syncing, setSyncing]       = useState(false);
  const [syncMsg, setSyncMsg]       = useState('');

  const loadStats = useCallback(async () => {
    const [m, c] = await Promise.all([
      getMonthlyStats(),
      getCategoryStats(),
    ]);
    setMonthly(m);
    setCatStats(c);
  }, []);

  const loadTransactions = useCallback(async () => {
    const [year, month] = selectedMonth ? selectedMonth.split('-').map(Number) : [undefined, undefined];
    const data = await getTransactions({ year, month, category: filterCat || undefined, page, limit: 50 });
    setTxPage(data);
  }, [selectedMonth, filterCat, page]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg('同步中...');
    try {
      const result = await triggerSync() as any;
      if (result.error) {
        setSyncMsg(`错误: ${result.error}`);
        return;
      }
      const modeLabel = result.mode === 'full' ? '全量' : '增量';
      setSyncMsg(`${modeLabel}同步完成：获取 ${result.fetched} 封，新增 ${result.imported} 条`);
      await loadStats();
      await loadTransactions();
    } catch {
      setSyncMsg('同步失败');
    } finally {
      setSyncing(false);
    }
  }

  function handleMonthSelect(month: string) {
    setSelectedMonth((prev) => prev === month ? '' : month);
    setPage(1);
    setFilterCat('');
  }

  function handleCategorySelect(category: string) {
    setFilterCat((prev) => prev === category ? '' : category);
    setPage(1);
  }

  function handleTxUpdated(_updated: Transaction) {
    // Reload all data since same-merchant records are also updated
    loadTransactions();
    loadStats();
  }

  const totalAmount = monthly.reduce((s, m) => s + m.total, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ background: '#1a3a5c', color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>SMBC 消费记录</h1>
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Olive フレキシブルペイ（デビットモード）</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {syncMsg && <span style={{ fontSize: 12, opacity: 0.85 }}>{syncMsg}</span>}
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{ padding: '7px 16px', background: '#e0541e', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer', fontSize: 13 }}
          >
            {syncing ? '同步中...' : '同步邮件'}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="累计消费合计" value={`¥${totalAmount.toLocaleString()}`} />
          <StatCard label="交易笔数" value={`${txPage?.total ?? '-'} 笔`} />
          <StatCard
            label={selectedMonth ? `${selectedMonth} 消费` : '月均消费'}
            value={selectedMonth
              ? `¥${(monthly.find((m) => m.month === selectedMonth)?.total ?? 0).toLocaleString()}`
              : `¥${monthly.length ? Math.round(totalAmount / monthly.length).toLocaleString() : '-'}`
            }
          />
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <MonthlyBarChart data={monthly} selectedMonth={selectedMonth} onSelect={handleMonthSelect} />
          <CategoryTreeMap data={catStats} onSelect={handleCategorySelect} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#666' }}>筛选：</span>
          {selectedMonth && (
            <FilterTag label={`月份：${selectedMonth}`} onRemove={() => { setSelectedMonth(''); setPage(1); }} />
          )}
          {filterCat && (
            <FilterTag label={`分类：${filterCat}`} onRemove={() => { setFilterCat(''); setPage(1); }} />
          )}
          {!selectedMonth && !filterCat && <span style={{ fontSize: 13, color: '#aaa' }}>无（点击图表可筛选）</span>}
        </div>

        {/* Table */}
        {txPage && (
          <TransactionTable
            rows={txPage.rows}
            total={txPage.total}
            page={page}
            limit={txPage.limit}
            onPageChange={setPage}
            onUpdated={handleTxUpdated}
          />
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: '#1a3a5c' }}>{value}</p>
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eef2ff', color: '#3730a3', borderRadius: 4, padding: '3px 8px', fontSize: 12 }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3730a3', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
    </span>
  );
}
