import type { ChatOptionDto, VisualCardDto, TableCardDto, PortalRedirectDto } from '@/lib/api';

export type ChatRole = 'user' | 'assistant' | 'divider';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Optional short label shown in the bubble when `text` is a long prepared prompt. */
  displayText?: string;
  createdAt: number;
  /** Uploaded image URLs attached to a USER message (Feature 4: image-based fabric advice). */
  imageUrls?: string[];
  visualCards?: VisualCardDto[];
  table?: TableCardDto | null;
  suggestedFollowUps?: string[];
  portalRedirect?: PortalRedirectDto | null;
  /** True for the one assistant reply immediately after a guest→login attach (Phase C spec). */
  justLinkedToAccount?: boolean;
}

export type PendingInput =
  | { kind: 'FREE_TEXT' }
  | { kind: 'BUTTONS'; options: ChatOptionDto[]; allowOther: boolean }
  | { kind: 'DROPDOWN'; options: ChatOptionDto[]; allowOther: boolean }
  | { kind: 'MULTI_SELECT'; options: ChatOptionDto[]; allowOther: boolean };

export type AuthStage =
  | { stage: 'none' }
  | { stage: 'awaiting-email'; reason: string }
  | { stage: 'awaiting-otp'; email: string; reason: string }
  | { stage: 'verifying' };
