import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { renderCustomValue } from '@/lib/renderCustomValue';

interface OrderItemCustomFieldsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  customData: Record<string, unknown> | null | undefined;
  /** Map of field id (key) -> custom field label/name for display. When provided, labels are shown instead of raw keys. */
  customFieldLabels?: Record<string, string> | null;
}

export function OrderItemCustomFieldsModal({
  open,
  onOpenChange,
  itemName,
  customData,
  customFieldLabels,
}: OrderItemCustomFieldsModalProps) {
  const entries = customData && typeof customData === 'object' ? Object.entries(customData) : [];

  const getFieldName = (key: string) =>
    (customFieldLabels && customFieldLabels[key]) || key;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom fields – {itemName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No custom fields.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {entries.map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1 border-b border-border pb-2 last:border-0">
                  <span className="font-medium text-muted-foreground">{getFieldName(key)}</span>
                  <span className="break-words">{renderCustomValue(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
