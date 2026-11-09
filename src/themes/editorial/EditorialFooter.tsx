import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Abstract } from './Abstract';

const columns = [
  { title: 'Shop', links: [['All products', '/products'], ['Collections', '/categories'], ['New in', '/products?filter=new'], ['Best sellers', '/products?filter=best']] },
  { title: 'Make it yours', links: [['Custom design', '/custom-design'], ['Upload your design', '/make-your-own'], ['Get a quote', '/inquiry'], ['Journal', '/blog']] },
  { title: 'Help', links: [['About the studio', '/about'], ['Contact', '/contact'], ['FAQ', '/faq'], ['Shipping', '/shipping']] },
  { title: 'Fine print', links: [['Terms', '/terms'], ['Privacy', '/privacy'], ['Marketing terms', '/marketing-terms'], ['Data deletion', '/data-deletion']] },
];

/** Ink-coloured colophon: a running stitch across the top, a short statement, four link columns, a small signature row. */
const EditorialFooter = () => (
  <footer className="relative mt-16 overflow-hidden bg-foreground text-background">
    <Abstract variant="arches" dark className="-bottom-10 -right-16 h-[110%] w-auto opacity-60" />
    <div className="ed-stitch-light relative" />
    <div className="container-custom relative py-14 lg:py-16">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Link to="/" className="font-serif text-3xl font-light italic tracking-[-0.03em]" style={{ fontVariationSettings: "'opsz' 144" }}>Studio Sara</Link>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-background/65">
            A print and embroidery studio. Made to order from two pieces, designed in India with intention.
          </p>
          <ul className="ed-kicker mt-6 space-y-2 !text-[11px] text-background/55">
            <li>Prints from 2 pieces</li>
            <li>Embroidery from 10 metres</li>
            <li>Dispatch in 5–6 days</li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:col-span-8">
          {columns.map((c) => (
            <div key={c.title}>
              <h4 className="ed-kicker mb-4 !font-sans !text-[10px] text-background/45">{c.title}</h4>
              <ul className="space-y-2.5 text-[15px]">
                {c.links.map(([name, path]) => (
                  <li key={path}><Link to={path} onClick={() => window.scrollTo({ top: 0 })} className="ed-link">{name}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="relative border-t border-background/15">
      <div className="container-custom flex flex-wrap items-center justify-between gap-3 py-5">
        <p className="ed-kicker !text-[10px] !font-medium text-background/50">© {new Date().getFullYear()} Studio Sara · Made with care in India</p>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="ed-kicker ed-link inline-flex items-center gap-2 !text-[10px]">
          Back to top <ArrowUp className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </footer>
);

export default EditorialFooter;
