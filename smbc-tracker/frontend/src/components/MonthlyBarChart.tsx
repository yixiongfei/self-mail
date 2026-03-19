import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { MonthlyStats } from '../api';

interface Props {
  data: MonthlyStats[];
  selectedMonth?: string;
  onSelect?: (month: string) => void;
}

const COLORS = {
  default:  '#4f86c6',
  selected: '#e0541e',
};

function formatYen(value: number) {
  return `¥${value.toLocaleString()}`;
}

export default function MonthlyBarChart({ data, selectedMonth, onSelect }: Props) {
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: '16px 8px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <h3 style={{ marginBottom: 12, paddingLeft: 8, fontSize: 15, color: '#555' }}>按月消费金额</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} onClick={(e) => e?.activeLabel && onSelect?.(e.activeLabel as string)}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => formatYen(value)} labelStyle={{ fontWeight: 600 }} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} cursor="pointer">
            {data.map((entry) => (
              <Cell
                key={entry.month}
                fill={entry.month === selectedMonth ? COLORS.selected : COLORS.default}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {selectedMonth && (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 4 }}>
          点击柱子可按月筛选 — 当前选中：{selectedMonth}
        </p>
      )}
    </div>
  );
}
