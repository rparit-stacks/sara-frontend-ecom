import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Image as ImageIcon, X } from 'lucide-react';
import { broadcastApi } from '@/lib/api';

type TargetType = 'SINGLE' | 'TAG' | 'ALL';

/**
 * Broadcast Composer — lets an admin hand-write a one-off message (not tied to any business
 * event) and fan it out to one customer, a CustomerTag group, or every active user. PUSH + EMAIL
 * only: WhatsApp needs a pre-approved Meta template per message shape, so free-text can't go out
 * on that channel here (see AdminBroadcastController's javadoc on the backend).
 */
export function BroadcastComposer() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetType, setTargetType] = useState<TargetType>('SINGLE');
  const [targetValue, setTargetValue] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [actionLink, setActionLink] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const { data: tags } = useQuery({
    queryKey: ['broadcastTags'],
    queryFn: () => broadcastApi.getTags(),
  });

  const targetValueForPreview = targetType === 'ALL' ? undefined : targetValue || undefined;
  const canPreview = targetType === 'ALL' || !!targetValue;

  const { data: preview, isFetching: isPreviewLoading } = useQuery({
    queryKey: ['broadcastPreview', targetType, targetValueForPreview],
    queryFn: () => broadcastApi.preview(targetType, targetValueForPreview),
    enabled: canPreview,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      broadcastApi.send({
        targetType,
        targetValue: targetType === 'ALL' ? undefined : targetValue,
        title,
        body,
        actionLabel: actionLabel || undefined,
        actionLink: actionLink || undefined,
        image,
      }),
    onSuccess: (res) => {
      toast.success(`Broadcast sent to ${res.sent} recipient${res.sent === 1 ? '' : 's'}`);
      setTitle('');
      setBody('');
      setActionLabel('');
      setActionLink('');
      clearImage();
      queryClient.invalidateQueries({ queryKey: ['notificationLogs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Broadcast failed to send');
    },
  });

  const clearImage = () => {
    setImage(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onPickImage = (file: File | undefined) => {
    if (!file) return;
    setImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const canSend = title.trim().length > 0 && body.trim().length > 0 && (targetType === 'ALL' || targetValue.trim().length > 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Send to</label>
        <div className="flex flex-wrap gap-3">
          <Select
            value={targetType}
            onValueChange={(v) => {
              setTargetType(v as TargetType);
              setTargetValue('');
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">One customer (email)</SelectItem>
              <SelectItem value="TAG">A tagged group</SelectItem>
              <SelectItem value="ALL">Every active user</SelectItem>
            </SelectContent>
          </Select>

          {targetType === 'SINGLE' && (
            <Input
              className="flex-1 min-w-[220px]"
              placeholder="customer@email.com"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          )}

          {targetType === 'TAG' && (
            <Select value={targetValue} onValueChange={setTargetValue}>
              <SelectTrigger className="flex-1 min-w-[220px]">
                <SelectValue placeholder="Choose a tag…" />
              </SelectTrigger>
              <SelectContent>
                {(tags ?? []).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
                {(tags ?? []).length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No tags exist yet</div>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
        {canPreview && (
          <p className="text-xs text-muted-foreground pt-1">
            {isPreviewLoading ? (
              'Counting recipients…'
            ) : preview ? (
              <>
                Will reach <span className="font-medium text-foreground">{preview.count}</span> recipient
                {preview.count === 1 ? '' : 's'}
                {preview.sample.length > 0 && (
                  <span> — {preview.sample.slice(0, 3).join(', ')}{preview.count > 3 ? ', …' : ''}</span>
                )}
              </>
            ) : null}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Title</label>
        <Input placeholder="e.g. Diwali Sale is live!" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Message</label>
        <Textarea
          placeholder="Write the message body…"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Button label (optional)</label>
          <Input placeholder="e.g. Shop Now" value={actionLabel} onChange={(e) => setActionLabel(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Button link (optional)</label>
          <Input
            placeholder="https://… or studiosara://…"
            value={actionLink}
            onChange={(e) => setActionLink(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        Tapping the notification opens this link — there's no separate on-notification action button on
        Android/iOS, this is a tap-to-open target.
      </p>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Image (optional)</label>
        {imagePreviewUrl ? (
          <div className="relative inline-block">
            <img src={imagePreviewUrl} alt="" className="h-32 rounded-md border object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-background border rounded-full p-1 shadow-sm"
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="w-4 h-4 mr-2" />
            Choose image
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickImage(e.target.files?.[0])}
        />
      </div>

      <Button
        onClick={() => sendMutation.mutate()}
        disabled={!canSend || sendMutation.isPending}
        className="w-full sm:w-auto"
      >
        {sendMutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Send className="w-4 h-4 mr-2" />
        )}
        Send broadcast
      </Button>
    </div>
  );
}
