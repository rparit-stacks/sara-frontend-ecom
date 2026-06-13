// ============================================================================
// Feature catalog types shared by the admin "what's new" / feature-info popups.
//
// (The subscription "Plans" page and its pricing tiers were removed; only the
// feature-demo type shapes remain, used by FeatureInfoDialog / WhatsNewDialog.)
// ============================================================================

// Animation keys the FeatureInfoDialog knows how to render.
export type FeatureAnim =
  | 'product-listing'
  | 'mockup'
  | 'social-post'
  | 'cart-recovery'
  | 'fault-check'
  | 'seo'
  | 'watermark'
  | 'storage'
  | 'payment-link'
  | 'chatbot'
  | 'size-fit'
  | 'product-editor'
  | 'store-themes';

export interface PlanFeature {
  key: string;
  label: string;
  icon: string;            // fontawesome icon name (faXxx -> 'wand-magic-sparkles')
  anim: FeatureAnim;
  /** Short one-liner shown under the ⓘ tooltip / popup header. */
  short: string;
  /** Longer "how it works" paragraph for the popup body. */
  how: string;
  /** Step-by-step bullets for the popup. */
  steps: string[];
  beta?: boolean;
}
