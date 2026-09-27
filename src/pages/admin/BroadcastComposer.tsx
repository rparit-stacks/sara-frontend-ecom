import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, Send, Image as ImageIcon, X, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { broadcastApi, adminUsersApi, productsApi, categoriesApi } from '@/lib/api';

interface AdminUser {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface PickerProduct {
  id: number;
  name: string;
  slug?: string;
  imageUrl?: string;
}

interface PickerCategory {
  id: number;
  name: string;
  slug?: string;
}

type LinkPageType = 'PRODUCT' | 'CATEGORY' | 'CART' | 'WISHLIST' | 'STUDIO' | 'HOME' | 'CUSTOM';

const LINK_PAGE_TYPES: { value: LinkPageType; label: string }[] = [
  { value: 'PRODUCT', label: 'A specific product' },
  { value: 'CATEGORY', label: 'A specific category' },
  { value: 'CART', label: 'Cart' },
  { value: 'WISHLIST', label: 'Wishlist' },
  { value: 'STUDIO', label: 'Studio (custom orders)' },
  { value: 'HOME', label: 'Home' },
  { value: 'CUSTOM', label: 'Custom URL' },
];

/** Builds the same in-app-path shape openCmsLink() (sara-mobile) already parses — this is the
 *  one string that travels in the push payload's content.link / data.url. */
function buildLinkPath(pageType: LinkPageType, pickedSlug: string, customUrl: string): string {
  switch (pageType) {
    case 'PRODUCT':
      return pickedSlug ? `/product/${pickedSlug}` : '';
    case 'CATEGORY':
      return pickedSlug ? `/categories/${pickedSlug}` : '';
    case 'CART':
      return '/cart';
    case 'WISHLIST':
      return '/wishlist';
    case 'STUDIO':
      return '/studio';
    case 'HOME':
      return '/';
    case 'CUSTOM':
      return customUrl.trim();
  }
}

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
  const [linkPageType, setLinkPageType] = useState<LinkPageType>('PRODUCT');
  const [linkPickedSlug, setLinkPickedSlug] = useState('');
  const [linkCustomUrl, setLinkCustomUrl] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [linkItemPickerOpen, setLinkItemPickerOpen] = useState(false);

  const actionLink = useMemo(
    () => buildLinkPath(linkPageType, linkPickedSlug, linkCustomUrl),
    [linkPageType, linkPickedSlug, linkCustomUrl],
  );

  const { data: pickerProducts } = useQuery({
    queryKey: ['broadcastPickerProducts'],
    queryFn: () => productsApi.getPicker() as Promise<PickerProduct[]>,
    enabled: linkPageType === 'PRODUCT',
  });

  const { data: pickerCategories } = useQuery({
    queryKey: ['broadcastPickerCategories'],
    queryFn: () => categoriesApi.getLeafCategories() as Promise<PickerCategory[]>,
    enabled: linkPageType === 'CATEGORY',
  });

  const { data: tags } = useQuery({
    queryKey: ['broadcastTags'],
    queryFn: () => broadcastApi.getTags(),
  });

  const { data: users } = useQuery({
    queryKey: ['adminUsersForBroadcast'],
    queryFn: () => adminUsersApi.getAll() as Promise<AdminUser[]>,
    enabled: targetType === 'SINGLE',
  });

  const customerLabel = (u: AdminUser) => {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    return name ? `${name} (${u.email})` : u.email;
  };

  const selectedCustomer = useMemo(
    () => (users ?? []).find((u) => u.email === targetValue),
    [users, targetValue],
  );

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
              <SelectItem value="SINGLE">One customer</SelectItem>
              <SelectItem value="TAG">A tagged group</SelectItem>
              <SelectItem value="ALL">Every active user</SelectItem>
            </SelectContent>
          </Select>

          {targetType === 'SINGLE' && (
            <Popover open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerPickerOpen}
                  className="flex-1 min-w-[220px] justify-between font-normal"
                >
                  {selectedCustomer ? customerLabel(selectedCustomer) : 'Select a customer…'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0">
                <Command filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}>
                  <CommandInput placeholder="Search by name or email…" />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      {(users ?? []).map((u) => (
                        <CommandItem
                          key={u.email}
                          value={`${customerLabel(u)} ${u.email}`}
                          onSelect={() => {
                            setTargetValue(u.email);
                            setCustomerPickerOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', targetValue === u.email ? 'opacity-100' : 'opacity-0')} />
                          {customerLabel(u)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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

      <div className="space-y-3 border rounded-lg p-4">
        <p className="text-sm font-medium">Notification button (optional)</p>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Button label</label>
          <Select value={actionLabel} onValueChange={(v) => setActionLabel(v === 'NONE' ? '' : v)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="No button" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">No button</SelectItem>
              <SelectItem value="shop_now">Shop Now</SelectItem>
              <SelectItem value="view_details">View Details</SelectItem>
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground pt-1">
            Shows as a tappable button on the notification itself (Android/iOS) — the label is one of a
            fixed set of presets because the OS requires buttons to be registered ahead of time.
          </p>
        </div>

        {actionLabel && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Opens</label>
            <div className="flex flex-wrap gap-2">
              <Select
                value={linkPageType}
                onValueChange={(v) => {
                  setLinkPageType(v as LinkPageType);
                  setLinkPickedSlug('');
                }}
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_PAGE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {linkPageType === 'PRODUCT' && (
                <Popover open={linkItemPickerOpen} onOpenChange={setLinkItemPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="flex-1 min-w-[220px] justify-between font-normal">
                      {linkPickedSlug
                        ? pickerProducts?.find((p) => p.slug === linkPickedSlug)?.name ?? linkPickedSlug
                        : 'Select a product…'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}>
                      <CommandInput placeholder="Search products…" />
                      <CommandList>
                        <CommandEmpty>No product found.</CommandEmpty>
                        <CommandGroup>
                          {(pickerProducts ?? []).filter((p) => p.slug).map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={() => {
                                setLinkPickedSlug(p.slug!);
                                setLinkItemPickerOpen(false);
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', linkPickedSlug === p.slug ? 'opacity-100' : 'opacity-0')} />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}

              {linkPageType === 'CATEGORY' && (
                <Select value={linkPickedSlug} onValueChange={setLinkPickedSlug}>
                  <SelectTrigger className="flex-1 min-w-[220px]">
                    <SelectValue placeholder="Select a category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(pickerCategories ?? []).filter((c) => c.slug).map((c) => (
                      <SelectItem key={c.id} value={c.slug!}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {linkPageType === 'CUSTOM' && (
                <Input
                  className="flex-1 min-w-[220px]"
                  placeholder="https://… or /some/path"
                  value={linkCustomUrl}
                  onChange={(e) => setLinkCustomUrl(e.target.value)}
                />
              )}
            </div>
          </div>
        )}
      </div>

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
