import { beforeEach,expect,it,vi } from 'vitest';
import { fireEvent,render,screen,waitFor } from '@testing-library/react';
const state=vi.hoisted(()=>({confirm:vi.fn(),refund:vi.fn(),refresh:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:state.refresh})}));
vi.mock('@/components/portal-locale',()=>({usePortalT:()=>(s:string)=>s}));
vi.mock('@/components/ui/app-dialog',()=>({useConfirmDialog:()=>({confirm:state.confirm,dialog:null})}));
vi.mock('@/lib/payments/refunds',()=>({refundPayment:state.refund}));
import { RefundPaymentControl } from './refund-payment-control';
beforeEach(()=>{vi.clearAllMocks();state.confirm.mockResolvedValue(false);state.refund.mockResolvedValue({ok:true,pending:true});});
it('cancelling the confirmation never requests a refund',async()=>{
 render(<RefundPaymentControl paymentId="payment" remaining={75} currency="EUR" pending={false}/>);
 fireEvent.change(screen.getByLabelText('Refund reason'),{target:{value:'Client cancellation'}});
 fireEvent.click(screen.getByRole('button',{name:'Refund remaining balance'}));
 await waitFor(()=>expect(state.confirm).toHaveBeenCalled());expect(state.refund).not.toHaveBeenCalled();
});
it('requires confirmation and distinguishes a pending refund from completion',async()=>{
 state.confirm.mockResolvedValue(true);
 render(<RefundPaymentControl paymentId="payment" remaining={75} currency="EUR" pending={false}/>);
 fireEvent.change(screen.getByLabelText('Refund reason'),{target:{value:'Client cancellation'}});
 fireEvent.click(screen.getByRole('button',{name:'Refund remaining balance'}));
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('Refund is pending. Payout is on hold.'));
 expect(state.refund).toHaveBeenCalledWith('payment','Client cancellation');expect(state.refresh).toHaveBeenCalled();
});
