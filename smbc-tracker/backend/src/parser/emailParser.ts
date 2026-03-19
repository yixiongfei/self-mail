import { matchCategory } from './categoryMatcher';

export interface ParsedTransaction {
  approvalNumber: string;
  date: Date;
  merchant: string;
  amount: number;
  category: string;
}

// Matches lines like:
// ◇利用日  ：2026/03/19 21:09:05
// ◇利用先　：MCDONALDS MOBILE ORDER
// ◇利用金額：1,700円
// ◇承認番号：652482
const DATE_RE     = /◇利用日[　 ]*：(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/;
const MERCHANT_RE = /◇利用先[　 ]*：(.+)/;
const AMOUNT_RE   = /◇利用金額：([\d,]+)円/;
const APPROVAL_RE = /◇承認番号：(\d+)/;

export function parseEmail(body: string): ParsedTransaction | null {
  const dateMatch     = body.match(DATE_RE);
  const merchantMatch = body.match(MERCHANT_RE);
  const amountMatch   = body.match(AMOUNT_RE);
  const approvalMatch = body.match(APPROVAL_RE);

  if (!dateMatch || !merchantMatch || !amountMatch || !approvalMatch) {
    return null;
  }

  const merchant = merchantMatch[1].trim();
  const amount   = parseInt(amountMatch[1].replace(/,/g, ''), 10);
  const date     = new Date(dateMatch[1].replace(/\//g, '-').replace(' ', 'T') + '+09:00');

  return {
    approvalNumber: approvalMatch[1],
    date,
    merchant,
    amount,
    category: matchCategory(merchant),
  };
}
