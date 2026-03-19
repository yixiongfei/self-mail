import { fetchAllEmails, fetchNewEmails } from '../gmail/fetcher';
import { parseEmail } from '../parser/emailParser';
import prisma from '../db/client';

export interface SyncResult {
  mode:     'full' | 'incremental';
  fetched:  number;
  imported: number;
  skipped:  number;
  errors:   string[];
}

export async function runSync(): Promise<SyncResult> {
  // Load saved historyId
  const state = await prisma.syncState.upsert({
    where:  { id: 1 },
    update: {},
    create: { id: 1, historyId: '' },
  });

  const isFirstSync = !state.historyId;
  let emails: Awaited<ReturnType<typeof fetchAllEmails>>['emails'];
  let latestHistoryId: string;
  let mode: SyncResult['mode'];

  if (isFirstSync) {
    // --- Full sync ---
    console.log('首次同步：获取全部邮件...');
    mode = 'full';
    const result = await fetchAllEmails((done, total) => {
      process.stdout.write(`\r同步进度: ${done}/${total}`);
    });
    emails          = result.emails;
    latestHistoryId = result.latestHistoryId;
    console.log(`\n获取完成: ${emails.length} 封`);
  } else {
    // --- Incremental sync ---
    console.log(`增量同步：上次 historyId=${state.historyId}`);
    mode = 'incremental';
    try {
      const result = await fetchNewEmails(state.historyId, (done) => {
        process.stdout.write(`\r新邮件: ${done} 封`);
      });
      emails          = result.emails;
      latestHistoryId = result.latestHistoryId;
      console.log(`\n新邮件: ${emails.length} 封`);
    } catch (err: any) {
      if (err.message === 'HISTORY_EXPIRED') {
        // historyId 过期（超过约1周未同步），回退到全量同步
        console.log('historyId 已过期，回退到全量同步...');
        mode = 'full';
        const result = await fetchAllEmails((done, total) => {
          process.stdout.write(`\r同步进度: ${done}/${total}`);
        });
        emails          = result.emails;
        latestHistoryId = result.latestHistoryId;
        console.log(`\n获取完成: ${emails.length} 封`);
      } else {
        throw err;
      }
    }
  }

  // Save emails to DB
  let imported = 0;
  let skipped  = 0;
  const errors: string[] = [];

  for (const email of emails) {
    const parsed = parseEmail(email.body);
    if (!parsed) {
      errors.push(`解析失败: ${email.messageId}`);
      continue;
    }
    try {
      await prisma.transaction.upsert({
        where:  { approvalNumber: parsed.approvalNumber },
        update: {},
        create: {
          approvalNumber: parsed.approvalNumber,
          date:           parsed.date,
          merchant:       parsed.merchant,
          amount:         parsed.amount,
          category:       parsed.category,
          categorySource: 'auto',
          gmailMessageId: email.messageId,
        },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  // Save latest historyId
  if (latestHistoryId) {
    await prisma.syncState.update({
      where: { id: 1 },
      data:  { historyId: latestHistoryId },
    });
  }

  return { mode, fetched: emails.length, imported, skipped, errors };
}
