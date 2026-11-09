/**
 * What the Marketplace shows about each product: words, pictures, the pages it covers. Price and trial length are decided
 * by the server (MarketplaceCatalog.java), never here, so this file can describe a product but not re-price it.
 *
 * To list another product: add an entry here, give it the same key as in MarketplaceCatalog.java, drop its pictures in
 * public/marketplace/<folder>/. The cards, the listing page and the buy flow all read from this list.
 */
import type { LucideIcon } from 'lucide-react';
import { BellOff, Boxes, Brush, Clock, Gauge, GitBranch, LayoutDashboard, MessageCircle, MonitorSmartphone, MousePointerClick, Palette, ShieldCheck, Smartphone, Sparkles, Type, Wand2 } from 'lucide-react';

export interface ListingPreview {
  id: string;
  label: string;
  /** Normal-sized picture, shown still. */
  image: string;
  /** Optional tall picture of the whole page: the showcase scrolls it slowly. */
  tall?: string;
  /** Path on the storefront for the live preview. */
  path: string;
  caption: string;
}

export interface ListingHighlight {
  icon: LucideIcon;
  title: string;
  text: string;
}

export interface MarketplaceListing {
  key: string;
  kind: 'theme' | 'bot';
  folder: string;
  /** Shown only if the server cannot be reached. The server's own price and trial length are the real ones. */
  priceInr: number;
  trialDays: number;
  name: string;
  tagline: string;
  summary: string;
  tags: string[];
  /** The theme id the storefront understands (src/themes/<id>). Themes only. */
  themeId?: string;
  /** Pictures for the showcase. An add-on with none shows no showcase. */
  previews: ListingPreview[];
  /** Words the page uses for the product ("theme", "bot") and what switching it on does. Defaults suit a theme. */
  noun?: string;
  /** Four short points under the title. */
  points?: string[];
  /** The three "how the trial works" steps. */
  steps?: { title: string; text: string }[];
  /** Where the owner goes to use it once it is on. */
  openPath?: string;
  openLabel?: string;
  coverageTitle?: string;
  coverageText?: string;
  /** Heading and line above the screenshots, and the address shown in their window frame. */
  showcaseTitle?: string;
  showcaseText?: string;
  showcaseHost?: string;
  highlights: ListingHighlight[];
  pagesCovered: { group: string; pages: string[] }[];
  included: string[];
  faq: { q: string; a: string }[];
}

const shot = (folder: string, name: string) => `/marketplace/${folder}/${name}.jpg`;

export const LISTINGS: MarketplaceListing[] = [
  {
    key: 'theme-editorial',
    kind: 'theme',
    folder: 'editorial',
    themeId: 'editorial',
    priceInr: 2000,
    trialDays: 10,
    name: 'Editorial',
    tagline: 'Your shop, set like a print magazine.',
    summary:
      'A complete storefront theme for brands that sell with pictures: large serif headlines, staggered photography, hairline rules and a teal accent. It re-lays out your pages, it does not just re-colour them.',
    tags: ['Storefront theme', 'Whole site', 'Animated', 'Responsive'],
    previews: [
      { id: 'home', label: 'Home', image: shot('editorial', 'home-view'), tall: shot('editorial', 'home-tall'), path: '/', caption: 'A cover with your CMS banners as slides, a collections index, a lookbook, the process, new arrivals, journal and Instagram.' },
      { id: 'shop', label: 'Shop', image: shot('editorial', 'shop-view'), tall: shot('editorial', 'shop-tall'), path: '/products', caption: 'A ruled filter bar, an index of collections and an even product grid with a "turn the page" button.' },
      { id: 'collections', label: 'Collections', image: shot('editorial', 'collections-view'), path: '/categories', caption: 'Every collection as a full-bleed numbered tile, in rows that always fill the width.' },
      { id: 'collection', label: 'A collection', image: shot('editorial', 'collection-view'), tall: shot('editorial', 'collection-tall'), path: '/category/cotton-fabric', caption: 'A breadcrumb trail, a big title, sub-collections as photo tiles, then the pieces.' },
      { id: 'product', label: 'Product', image: shot('editorial', 'product-view'), tall: shot('editorial', 'product-tall'), path: '/product/summer-vibes-11', caption: 'A sticky gallery with a thumbnail strip beside the details. Variants, fabrics and custom forms work as before.' },
      { id: 'login', label: 'Sign in', image: shot('editorial', 'login-view'), path: '/login', caption: 'A paper sheet with underlined tabs and a tilted photo panel.' },
      { id: 'custom', label: 'Custom design', image: shot('editorial', 'custom-view'), path: '/custom-design', caption: 'The custom-design brief as a ruled paper form with a dashed upload frame.' },
      { id: 'upload', label: 'Upload design', image: shot('editorial', 'upload-view'), path: '/make-your-own', caption: 'Upload a design and generate a mock-up, set in the same editorial frame.' },
      { id: 'quote', label: 'Get a quote', image: shot('editorial', 'quote-view'), path: '/inquiry', caption: 'The quote form, a button in the header, a band on the home page.' },
      { id: 'cart', label: 'Cart', image: shot('editorial', 'cart-view'), path: '/cart', caption: 'Items as paper slips beside a dark order bag.' },
    ],
    highlights: [
      { icon: LayoutDashboard, title: 'New layouts, not a re-skin', text: 'Pages are rearranged: checkout becomes numbered steps, the account page gets a profile strip and a contents list, the cart pairs slips with a dark bag.' },
      { icon: Type, title: 'Serif headlines', text: 'Fraunces for display and Instrument Sans for text, set with tight tracking and a clear scale.' },
      { icon: Palette, title: 'Paper, ink and one accent', text: 'Warm paper, deep teal-black ink and your brand teal. Change one value to retint the whole site.' },
      { icon: Sparkles, title: 'Motion that earns its place', text: 'Headlines slide out of masks, photos are uncovered like turned pages, a text strip runs along. It all stops for people who ask for reduced motion.' },
      { icon: Brush, title: 'Abstract artwork', text: 'Soft colour washes, thread rings and nested arches sit behind sections so pages never feel flat.' },
      { icon: Boxes, title: 'Reads your CMS', text: 'Hero slides come from your banners, collections from your categories, then best sellers, new arrivals, testimonials, journal and Instagram.' },
      { icon: MonitorSmartphone, title: 'Phone to widescreen', text: 'A full-screen menu with every link on phones, a bag and wishlist on every screen.' },
      { icon: ShieldCheck, title: 'Nothing is lost', text: 'Search, categories, currency, wishlist, account menu, quote link, chat assistant and every checkout rule still work.' },
    ],
    pagesCovered: [
      { group: 'Shop', pages: ['Home', 'Shop', 'Collections', 'A collection', 'Product', 'Search'] },
      { group: 'Buying', pages: ['Cart', 'Checkout', 'Wishlist', 'Payment', 'Order pages'] },
      { group: 'Account', pages: ['Sign in and sign up', 'My account', 'Orders', 'Profile'] },
      { group: 'Custom work', pages: ['Custom design', 'Upload design', 'Get a quote'] },
      { group: 'Everywhere', pages: ['Header', 'Mobile menu', 'Footer', 'Fabric picker', 'Assistant chat'] },
    ],
    included: [
      'The full theme: header, footer and every storefront page',
      'Animated home page driven by your banners and catalogue',
      'Fabric picker, search and assistant chat in the same style',
      'Switch it on and off any time from this page',
      'Updates to the theme while you own it',
    ],
    faq: [
      { q: 'How does the free trial work?', a: 'You get 10 days of use. Start it once and the theme goes live; the clock runs only while the theme is switched on. Switch it off and the clock stops, switch it on and it carries on from where it stopped. When the 10 days of use are spent, the shop returns to your current look by itself.' },
      { q: 'Will it change my admin panel?', a: 'No. The theme only dresses the public storefront. The admin panel and the portal stay as they are.' },
      { q: 'Can I go back to my old look?', a: 'Yes, at any time. Use the switch on this page. Your data, products and orders are never touched.' },
      { q: 'What happens after the trial?', a: 'Once your 10 days of use are spent, the storefront goes back to the classic look. To keep the theme, buy it for ₹2,000. We will switch it on for you once your payment is confirmed.' },
      { q: 'How do I pay?', a: 'Press Buy and scan the QR code with any UPI app. After you pay, contact us and we will unlock the theme.' },
    ],
  },
  {
    key: 'bot-whatsapp',
    kind: 'bot',
    folder: 'bot',
    priceInr: 3999,
    trialDays: 10,
    noun: 'bot',
    name: 'WhatsApp bot',
    tagline: 'Answer your customers on WhatsApp, and send them to the app.',
    summary:
      'Build a short chat flow once: a greeting, a few options, quick answers about orders and products. The bot replies on your WhatsApp number and, when someone needs a person or a quote, sends them to the app, where chat is free.',
    tags: ['WhatsApp add-on', 'Flow builder', 'Business hours', 'Daily limits'],
    openPath: '/admin-sara/whatsapp/bot',
    openLabel: 'Open the bot builder',
    coverageTitle: 'What the bot can do',
    coverageText: 'It runs the flow you publish, inside limits you can trust.',
    points: ['Drag-and-drop flow builder', 'Replies inside the 24-hour window', 'Sends people to the app for quotes', 'Daily message and AI limits'],
    steps: [
      { title: 'Start the trial', text: 'One click. The bot is switched on and your 10 days of use begin counting.' },
      { title: 'Build and publish a flow', text: 'Open the builder, set a greeting and a few options, test it in the chat preview, then publish.' },
      { title: 'Keep it or switch it off', text: 'The clock runs only while the bot is on. When the 10 days of use are spent, the bot stops replying.' },
    ],
    showcaseTitle: 'See it working',
    showcaseText: 'The flow builder, the test chat and the AI assistant, as you will use them.',
    showcaseHost: 'Admin · WhatsApp · Bot',
    previews: [
      { id: 'canvas', label: 'Flow builder', image: shot('bot', 'canvas-view'), path: '/', caption: 'Every chat starts at the left. Events are what customers ask for, outcomes are what the bot does. The starter flow already covers hello, orders, quotes, people and product questions.' },
      { id: 'test', label: 'Test chat', image: shot('bot', 'test-view'), path: '/', caption: 'Try the flow as a customer before it goes live. Switch "open now" or "has orders" and see the reply, the buttons and the approximate cost.' },
      { id: 'ai', label: 'Build with AI', image: shot('bot', 'ai-view'), path: '/', caption: 'Describe the bot in plain words. The assistant suggests changes, you see them first, and nothing happens until you accept. One click undoes it.' },
    ],
    highlights: [
      { icon: GitBranch, title: 'A visual flow builder', text: 'Place steps on a canvas, connect them, and check for mistakes before you publish.' },
      { icon: MessageCircle, title: 'Replies, not broadcasts', text: 'The bot answers people who message you. It never sends marketing messages by itself.' },
      { icon: Smartphone, title: 'Hands off to the app', text: 'Quotes, long questions and talking to a person go to the app, where chat costs nothing.' },
      { icon: Clock, title: 'Business hours', text: 'Set the days and hours the bot is on, with a polite notice outside them.' },
      { icon: Gauge, title: 'Daily limits', text: 'A cap on messages and on AI answers per day keeps WhatsApp costs predictable.' },
      { icon: BellOff, title: 'Switch off any time', text: 'Turn it off from this page and it stops at once. Your flow is kept.' },
    ],
    pagesCovered: [
      { group: 'Builder', pages: ['Flow canvas', 'Test chat', 'Checks before publishing', 'Import and export'] },
      { group: 'Running', pages: ['Greeting and menus', 'Order and product answers', 'App links', 'Business-hours notice'] },
      { group: 'Control', pages: ['On and off switch', 'Daily message limit', 'Daily AI limit'] },
    ],
    included: [
      'The flow builder with a test chat',
      'The bot running on your WhatsApp number',
      'Business hours and daily limits',
      'Switch it on and off any time from this page',
    ],
    faq: [
      { q: 'How does the free trial work?', a: 'You get 10 days of use. Start it once and the bot is switched on; the clock runs only while it is on. Switch it off and the clock stops, switch it on and it carries on. When the 10 days of use are spent, the bot stops replying.' },
      { q: 'Does it cost me WhatsApp charges?', a: 'Replies to someone who messaged you in the last 24 hours are the cheapest kind of WhatsApp message. The bot never sends marketing templates, and the daily limits cap what it can send.' },
      { q: 'What if a customer needs a person?', a: 'The bot sends them to the app, where they can chat with you for free.' },
      { q: 'Can I turn it off?', a: 'Yes, at any time with the switch on this page. Your published flow is kept.' },
      { q: 'What does it cost to keep?', a: 'A one-time price of ₹3,999. Try it free for 10 days of use first. To keep it, press Buy and scan the QR code with any UPI app; after you pay, contact us and we will unlock it.' },
    ],
  },
];

export const findListing = (key: string | undefined) => LISTINGS.find((l) => l.key === key);
