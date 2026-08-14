import type { ChatOptionDto, VisualCardDto, TableCardDto } from '@/lib/api';

export type AdminChatRole = 'user' | 'assistant' | 'system';

export interface AdminChatMessage {
  id: string;
  role: AdminChatRole;
  text: string;
  createdAt: number;
  imageUrls?: string[];
  visualCards?: VisualCardDto[];
  table?: TableCardDto | null;
  suggestedFollowUps?: string[];
}

export type AdminPendingInput =
  | { kind: 'FREE_TEXT' }
  | { kind: 'BUTTONS'; options: ChatOptionDto[]; allowOther: boolean }
  | { kind: 'DROPDOWN'; options: ChatOptionDto[]; allowOther: boolean }
  | { kind: 'MULTI_SELECT'; options: ChatOptionDto[]; allowOther: boolean };

export function makeAdminMsgId() {
  return `adm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
