import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { CategoryStats } from '../api';

interface Props {
  data: CategoryStats[];
  onSelect?: (category: string) => void;
}

const PALETTE = [
  '#4f86c6', '#e0541e', '#2ca02c', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22',
  '#17becf', '#aec7e8',
];

interface TreeNode {
  name: string;
  size: number;
  fill: string;
}

function CustomContent(props: any) {
  const { x, y, width, height, name, value, fill } = props;
  if (width < 40 || height < 30) return <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" strokeWidth={2} />;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" strokeWidth={2} rx={4} />
      <text x={x + width / 2} y={y + height / 2 - 8} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={600}>
        {name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,.85)" fontSize={11}>
        ¥{Number(value).toLocaleString()}
      </text>
    </g>
  );
}

export default function CategoryTreeMap({ data, onSelect }: Props) {
  const treeData: TreeNode[] = data.map((d, i) => ({
    name: d.category,
    size: d.total,
    fill: PALETTE[i % PALETTE.length],
  }));

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: '16px 8px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <h3 style={{ marginBottom: 12, paddingLeft: 8, fontSize: 15, color: '#555' }}>按分类消费（树状图）</h3>
      <ResponsiveContainer width="100%" height={300}>
        <Treemap
          data={treeData}
          dataKey="size"
          aspectRatio={4 / 3}
          content={<CustomContent />}
          onClick={(node: any) => node?.name && onSelect?.(node.name)}
        >
          <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
