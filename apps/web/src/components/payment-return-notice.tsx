"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { usePortalT } from '@/components/portal-locale';

/** A redirect is never evidence of payment. Only the database-backed table is. */
export function PaymentReturnNotice() {
  const params=useSearchParams(); const router=useRouter(); const t=usePortalT();
  const state=params.get('checkout');
  if(state!=='returned'&&state!=='cancelled')return null;
  return <section role="status" className="mt-6 rounded-xl border border-line bg-surface p-4 text-sm">
    <p>{t(state==='returned'?'Check the payment status below. Bank confirmation can take a little time.':'Checkout was cancelled. You can resume payment from your booking.')}</p>
    {state==='returned'&&<button type="button" onClick={()=>router.refresh()} className="mt-2 underline underline-offset-4">{t('Refresh payment status')}</button>}
  </section>;
}
