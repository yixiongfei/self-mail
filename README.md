# SMBC Card Transaction Tracker

三井住友银行卡消费记录整理与可视化系统

## 项目概览

本项目通过 Gmail API 自动抓取三井住友银行（SMBC）发送的消费通知邮件，解析交易数据并存入本地数据库，提供 Web 前端界面进行可视化分析。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + TypeScript + Recharts / ECharts |
| 后端 | Node.js + TypeScript + Express |
| 数据库 | SQLite（本地，无需额外安装服务） |
| 邮件抓取 | Google Gmail API（OAuth 2.0） |
| ORM | Prisma |

> 数据库默认选用 SQLite，无需配置服务器，开箱即用。如有需要可切换为 PostgreSQL / MySQL。

---

## 目录结构（规划）

```
smbc-tracker/
├── backend/                  # 后端服务
│   ├── src/
│   │   ├── gmail/            # Gmail API 抓取与解析
│   │   ├── parser/           # 邮件正文解析器（提取金额、商户、日期等）
│   │   ├── db/               # Prisma 数据库模型与迁移
│   │   ├── api/              # REST API 路由
│   │   └── index.ts          # 入口
│   ├── prisma/
│   │   └── schema.prisma     # 数据库 Schema
│   └── package.json
│
├── frontend/                 # 前端 React 应用
│   ├── src/
│   │   ├── components/
│   │   │   ├── BarChart/     # 月度消费条形图
│   │   │   ├── TreeMap/      # 消费分类树状图
│   │   │   ├── Timeline/     # 消费时间线
│   │   │   └── Table/        # 明细表格
│   │   ├── pages/
│   │   │   ├── Dashboard/    # 总览页
│   │   │   └── Transactions/ # 交易明细页
│   │   └── App.tsx
│   └── package.json
│
└── README.md
```

---

## 核心功能

### 数据抓取
- 通过 Gmail API 搜索 SMBC 发送的消费通知邮件
- 支持首次全量同步 + 增量同步（避免重复导入）
- 本地持久化 Gmail 抓取进度（`historyId`）

### 数据解析
邮件发件人：`smbc-debit@smbc-card.com`，主题：`ご利用のお知らせ【三井住友カード】`

正文字段（正则提取）：
```
◇利用日  ：2026/03/19 21:09:05   → 消费时间
◇利用先　：MCDONALDS MOBILE ORDER → 商户名称
◇利用金額：1,700円                → 消费金额（日元）
◇承認番号：652482                 → 授权编号（用作唯一键，防重复导入）
```

卡片类型：Olive フレキシブルペイ（デビットモード）

### 数据存储
- SQLite 本地数据库，零配置
- 字段：交易 ID、日期、金额、商户、分类、原始邮件 ID

### 可视化展示
| 图表 | 说明 |
|------|------|
| 条形图（Bar Chart） | 按月/按周查看消费总额趋势 |
| 树状图（TreeMap） | 按消费分类查看占比 |
| 折线图（Line Chart） | 消费趋势对比 |
| 明细表格 | 可搜索、排序、筛选的交易记录 |

---

## 快速开始（草稿，待完善）

### 前置条件
- Node.js >= 18
- Google Cloud 项目，已启用 Gmail API
- OAuth 2.0 客户端凭据（`credentials.json`）

### 安装与运行
```bash
# 1. 克隆项目
git clone <repo>

# 2. 后端
cd backend
npm install
npx prisma migrate dev
npm run dev

# 3. 前端
cd frontend
npm install
npm run dev
```

---

## 待确认事项

以下细节需要与你进一步确认，将逐步推进：

1. **SMBC 邮件格式** — 消费通知邮件的语言（日文/英文）及正文结构，决定解析器写法
2. **数据库选型** — SQLite 是否满足需求，还是偏好 PostgreSQL/MySQL
3. **分类规则** — 消费类别如何判断（关键词匹配 / 手动打标 / AI 分类）
4. **Gmail 授权方式** — 使用个人账号 OAuth，还是 Service Account
5. **前端框架偏好** — 图表库偏好 Recharts、ECharts 还是其他
6. **多卡支持** — 是否需要支持多张 SMBC 卡片的数据汇总

---

## License

MIT
