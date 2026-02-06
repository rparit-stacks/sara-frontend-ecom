import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { COUNTRY_CODES } from '@/lib/countryCodes';

interface MandatoryProfileDialogProps {
  open: boolean;
  email: string;
  onComplete: (data: { firstName: string; lastName: string; phoneNumber: string }) => void;
  onCancel: () => void;
}

export const MandatoryProfileDialog = ({ open, email, onComplete, onCancel }: MandatoryProfileDialogProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    countryCode: '+91',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    const digits = formData.phoneNumber.replace(/\D/g, '');
    if (!digits) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (digits.length < 7 || digits.length > 15) {
      newErrors.phoneNumber = 'Please enter a valid phone number (7-15 digits)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const digits = formData.phoneNumber.replace(/\D/g, '');
      const codeDigits = formData.countryCode.replace(/\D/g, '');
      const fullPhone = codeDigits ? `${formData.countryCode}${digits}` : digits;
      
      await onComplete({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: fullPhone,
      });
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            <DialogTitle className="text-xl">Complete Your Profile</DialogTitle>
          </div>
          <DialogDescription>
            Please provide your name and phone number to continue. This information is required to access your dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="email" className="text-muted-foreground">Email</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="mt-1 bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                First Name *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value });
                  if (errors.firstName) setErrors({ ...errors, firstName: '' });
                }}
                className={`mt-1 ${errors.firstName ? 'border-destructive' : ''}`}
                placeholder="Enter first name"
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value });
                  if (errors.lastName) setErrors({ ...errors, lastName: '' });
                }}
                className={`mt-1 ${errors.lastName ? 'border-destructive' : ''}`}
                placeholder="Enter last name"
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="phoneNumber" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number *
            </Label>
            <div className="flex gap-2 mt-1">
              <Select
                value={formData.countryCode}
                onValueChange={(v) => {
                  setFormData({ ...formData, countryCode: v });
                  if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
                }}
              >
                <SelectTrigger className="w-[140px] shrink-0">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px] overflow-y-auto">
                  {COUNTRY_CODES.map((c) => (
                    <SelectItem key={c.code + c.country} value={c.code}>
                      {c.code} {c.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                  setFormData({ ...formData, phoneNumber: value });
                  if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
                }}
                className={`flex-1 ${errors.phoneNumber ? 'border-destructive' : ''}`}
                placeholder="Phone number"
                disabled={isSubmitting}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Select country code and enter your phone number</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-3 mt-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              <strong>Note:</strong> This information is required to access your dashboard. If you cancel, you will be logged out and need to log in again.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 btn-primary"
            >
              {isSubmitting ? 'Saving...' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
