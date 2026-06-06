import { BRAND_CONTACT_EMAIL, BRAND_NAME } from "@/lib/brand";

/**
 * Full-site maintenance: no router, no API listeners, no other routes reachable.
 */
const Maintenance = () => (
  <div className="font-sans min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex flex-col items-center justify-center px-6 py-16 text-center antialiased">
    <p className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[hsl(var(--primary))] mb-2">
      {BRAND_NAME}
    </p>
    <p className="text-xs tracking-[0.2em] uppercase text-[hsl(var(--muted-foreground))] mb-8">
      Prints &amp; embroidery studio
    </p>
    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[hsl(var(--foreground))] mb-4">
      Site under maintenance
    </h1>
    <p className="max-w-md text-[hsl(var(--muted-foreground))] text-sm sm:text-base leading-relaxed mb-2">
      We are upgrading the store. Please check back soon — shopping, accounts, and admin are
      temporarily unavailable.
    </p>
    <p className="max-w-md text-[hsl(var(--muted-foreground))] text-sm leading-relaxed mb-8">
      हम साइट पर काम कर रहे हैं। जल्द वापस आएँ।
    </p>
    <p className="text-sm text-[hsl(var(--muted-foreground))]">
      Questions?{" "}
      <a
        href={`mailto:${BRAND_CONTACT_EMAIL}`}
        className="text-[hsl(var(--primary))] underline underline-offset-4 hover:opacity-90"
      >
        {BRAND_CONTACT_EMAIL}
      </a>
    </p>
  </div>
);

export default Maintenance;
