"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalT } from '@/components/portal-locale';
import { useConfirmDialog } from '@/components/ui/app-dialog';
import { refundPayment } from '@/lib/payments/refunds';
import { formatMoney } from '@/lib/format/money';

export function RefundPaymentControl({paymentId,remaining,currency,pending}:{paymentId:string;remaining:number;currency:string;pending:boolean}) {
  const t=usePortalT(); const router=useRouter(); const {confirm,dialog}=useConfirmDialog();
  const [reason,setReason]=useState(''); const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null); const [notice,setNotice]=useState<string|null>(null);
  async function submit(event:React.FormEvent) {
    event.preventDefault();if(busy)return;setBusy(true);setError(null);setNotice(null);
    try {
      if(!await confirm(t('Refund {amount} to the original payment method?',{amount:formatMoney(remaining,currency)}),{variant:'destructive',confirmLabel:t('Confirm refund')}))return;
      const result=await refundPayment(paymentId,pending?'Retry existing refund request':reason);
      if('error' in result)setError(t(result.error));
      else {setNotice(t(result.pending?'Refund is pending. Payout is on hold.':'Refund completed.'));router.refresh();}
    } catch {setError(t('Could not complete the operation. Please try again.'));}
    finally{setBusy(false);}
  }
  return <form onSubmit={submit} aria-busy={busy} className="mt-2 flex max-w-xs flex-col gap-2">
    {dialog}
    {!pending&&<label className="text-xs text-ink">{t('Refund reason')}
      <textarea value={reason} onChange={e=>setReason(e.target.value)} required minLength={5} maxLength={1000} rows={2} className="mt-1 w-full rounded-lg border border-line p-2"/>
    </label>}
    {error&&<p role="alert" className="text-xs text-danger">{error}</p>}
    {notice&&<p role="status" className="text-xs text-ink">{notice}</p>}
    <button type="submit" disabled={busy} className="rounded-full border border-danger px-3 py-1.5 text-xs text-danger disabled:opacity-50">{t(busy?'Processing…':pending?'Check refund':'Refund remaining balance')}</button>
  </form>;
}
