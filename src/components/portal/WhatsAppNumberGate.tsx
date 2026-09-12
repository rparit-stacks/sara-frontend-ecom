import { useState } from 'react';
import { toast } from 'sonner';
import { Sym } from './Sym';
import { adminAuthApi } from '@/lib/api';

/**
 * Blocks the portal until this admin has a WhatsApp number on file. Every admin-facing
 * notification (new customer message, handover/call request, etc.) goes out over WhatsApp —
 * see AdminNotificationRouter/WhatsAppAdminNotifier on the backend — so an admin with no
 * number set would silently never be reachable, with nothing on either side to say why.
 *
 * Rendered by AdminShell right after it fetches /api/admin/auth/me; shown as a full-screen
 * overlay (not a dismissible dialog — there is no "skip" or backdrop-click-to-close) whenever
 * that admin's whatsappNumber comes back empty. Saving calls the self-service endpoint and
 * the parent re-fetches, so this un-mounts itself once the number is set.
 */
export default function WhatsAppNumberGate({ onSaved }: { onSaved: () => void }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const digits = value.replace(/[^0-9]/g, '');
  const valid = digits.length >= 10;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await adminAuthApi.updateOwnWhatsappNumber(digits);
      toast.success('WhatsApp number saved.');
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save that number.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 sm:p-7" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(0,103,106,0.12)', color: 'var(--p-primary)' }}>
          <Sym name="chat" className="text-[24px]" />
        </div>
        <h2 className="font-bold text-[18px]">Add your WhatsApp number</h2>
        <p className="text-[13px] mt-2 leading-relaxed" style={{ color: 'var(--p-on-surface-variant)' }}>
          Studio Sara notifies admins over WhatsApp — a new customer message, a request to talk
          to a human, a call request. Without a number on file, you won't be reached for any of
          these, so we need it before you can continue into the portal. You can update it later
          from Settings.
        </p>

        <div className="mt-5">
          <label className="text-[12px] font-semibold" style={{ color: 'var(--p-on-surface-variant)' }}>WhatsApp number</label>
          <input
            type="tel"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void save()}
            placeholder="e.g. 9876543210"
            className="mt-1.5 w-full h-11 px-3.5 rounded-xl border text-[14px] outline-none focus:ring-2"
            style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface)' }}
          />
          {value && !valid && (
            <p className="text-[11.5px] mt-1.5" style={{ color: 'var(--p-error, #b42318)' }}>Enter at least 10 digits.</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void save()}
          disabled={!valid || saving}
          className="mt-5 w-full h-11 rounded-xl font-semibold text-[14px] disabled:opacity-50"
          style={{ background: 'var(--p-primary)', color: 'var(--p-on-primary)' }}
        >
          {saving ? 'Saving…' : 'Save and continue'}
        </button>
      </div>
    </div>
  );
}
