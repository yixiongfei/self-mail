import { google } from 'googleapis';
import { getAuthClient } from './auth';

export interface RawEmail {
  messageId: string;
  subject:   string;
  body:      string;
  date:      string;
  historyId: string;
}

const QUERY = 'from:smbc-debit@smbc-card.com subject:ご利用のお知らせ';

// Full sync: fetch all matching emails, return the latest historyId seen
export async function fetchAllEmails(
  onProgress?: (fetched: number, total: number) => void
): Promise<{ emails: RawEmail[]; latestHistoryId: string }> {
  const auth  = await getAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const messageIds: string[] = [];
  let pageToken: string | undefined;

  do {
    const res = await gmail.users.messages.list({
      userId: 'me', q: QUERY, maxResults: 500, pageToken,
    });
    messageIds.push(...(res.data.messages ?? []).map((m) => m.id!));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  const emails: RawEmail[] = [];
  let latestHistoryId = '';

  for (let i = 0; i < messageIds.length; i++) {
    const msg = await gmail.users.messages.get({ userId: 'me', id: messageIds[i], format: 'full' });
    const headers = msg.data.payload?.headers ?? [];
    emails.push({
      messageId: messageIds[i],
      subject:   headers.find((h) => h.name === 'Subject')?.value ?? '',
      date:      headers.find((h) => h.name === 'Date')?.value    ?? '',
      body:      extractBody(msg.data.payload),
      historyId: msg.data.historyId ?? '',
    });
    if (msg.data.historyId && msg.data.historyId > latestHistoryId) {
      latestHistoryId = msg.data.historyId;
    }
    onProgress?.(i + 1, messageIds.length);
  }

  return { emails, latestHistoryId };
}

// Incremental sync: fetch only emails added since lastHistoryId
export async function fetchNewEmails(
  lastHistoryId: string,
  onProgress?: (fetched: number) => void
): Promise<{ emails: RawEmail[]; latestHistoryId: string }> {
  const auth  = await getAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const newMessageIds: string[] = [];
  let pageToken: string | undefined;
  let latestHistoryId = lastHistoryId;

  try {
    do {
      const res = await gmail.users.history.list({
        userId:         'me',
        startHistoryId: lastHistoryId,
        historyTypes:   ['messageAdded'],
        labelId:        'INBOX',
        pageToken,
      });

      for (const record of res.data.history ?? []) {
        for (const added of record.messagesAdded ?? []) {
          if (added.message?.id) newMessageIds.push(added.message.id);
        }
        if (record.id && record.id > latestHistoryId) {
          latestHistoryId = record.id;
        }
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
  } catch (err: any) {
    // historyId expired or invalid → caller should fall back to full sync
    const is404 = err?.code === 404
      || err?.status === 404
      || err?.message?.includes('Requested entity was not found');
    if (is404) throw new Error('HISTORY_EXPIRED');
    throw err;
  }

  // Filter to only SMBC notification emails
  const emails: RawEmail[] = [];
  for (let i = 0; i < newMessageIds.length; i++) {
    const msg = await gmail.users.messages.get({ userId: 'me', id: newMessageIds[i], format: 'full' });
    const headers = msg.data.payload?.headers ?? [];
    const subject = headers.find((h) => h.name === 'Subject')?.value ?? '';
    if (!subject.includes('ご利用のお知らせ')) continue;  // skip non-SMBC emails
    emails.push({
      messageId: newMessageIds[i],
      subject,
      date:      headers.find((h) => h.name === 'Date')?.value ?? '',
      body:      extractBody(msg.data.payload),
      historyId: msg.data.historyId ?? '',
    });
    onProgress?.(i + 1);
  }

  return { emails, latestHistoryId };
}

function extractBody(payload: any): string {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  for (const part of payload.parts ?? []) {
    const result = extractBody(part);
    if (result) return result;
  }
  return '';
}
