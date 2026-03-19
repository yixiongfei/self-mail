import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import transactionsRouter from './routes/transactions';
import syncRouter from './routes/sync';
import categoriesRouter from './routes/categories';
import { runSync } from './services/syncService';

const app  = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/transactions', transactionsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/categories', categoriesRouter);

app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
});

// 每天晚上 8 点自动同步（中国时间 Asia/Shanghai）
cron.schedule('0 20 * * *', async () => {
  console.log(`[${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}] 开始定时同步邮件...`);
  try {
    const result = await runSync();
    console.log(`定时同步完成: 获取 ${result.fetched} 封，新增 ${result.imported} 条`);
  } catch (err: any) {
    console.error(`定时同步失败: ${err.message}`);
  }
}, {
  timezone: 'Asia/Shanghai',
});

console.log('定时任务已设置：每天 20:00 (中国时间) 自动同步');
