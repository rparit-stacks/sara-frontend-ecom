import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { marketingApi } from '@/lib/api';

/** Tell the backend this person agreed. Never blocks the form: a failure here must not stop a signup or an order. */
export const recordMarketingConsent = async (data: { email?: string; phone?: string; name?: string; source: string }) => {
  if (!data.email && !data.phone) return;
  try {
    await marketingApi.recordConsent(data);
  } catch (error) {
    console.warn('Could not save marketing consent', error);
  }
};

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}

/** Unticked by default on purpose: a pre-ticked box is not consent. Used on signup, login, every form and checkout. */
export const MarketingConsentCheckbox = ({ checked, onChange, id = 'marketing-consent', className = '' }: Props) => (
  <div className={`flex items-start gap-2.5 ${className}`}>
    <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
    <label htmlFor={id} className="cursor-pointer text-sm leading-snug text-muted-foreground">
      Send me offers, news and updates by email and WhatsApp. I can unsubscribe at any time. See the{' '}
      <Link to="/marketing-terms" target="_blank" className="text-primary underline">Marketing Terms</Link>.
    </label>
  </div>
);
