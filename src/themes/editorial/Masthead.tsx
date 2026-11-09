import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LayoutDashboard, LogOut, Menu, Package, Search, Settings, ShoppingBag, User, X, Factory } from 'lucide-react';
import { useIsLoggedIn } from '@/hooks/useIsLoggedIn';
import { cartApi, cmsApi, wishlistApi } from '@/lib/api';
import { guestCart } from '@/lib/guestCart';
import { dispatchLoggedOut } from '@/lib/authEvents';
import SearchPopup from '@/components/search/SearchPopup';
import { CategoryDropdown } from '@/components/categories/CategoryDropdown';
import { CurrencySelector } from '@/components/currency/CurrencySelector';

/** Every link the classic header offers, so nothing is lost: shop, categories, custom design, upload, quote form, journal. */
const left = [
  { name: 'Shop', path: '/products', xl: false },
  { name: 'Custom Design', path: '/custom-design', xl: false },
  { name: 'Upload Design', path: '/make-your-own', xl: true },
];
const right = [
  { name: 'Journal', path: '/blog' },
];
const mobileLinks = [
  { name: 'Home', path: '/' },
  { name: 'Shop', path: '/products' },
  { name: 'Collections', path: '/categories' },
  { name: 'Custom Design', path: '/custom-design' },
  { name: 'Upload Design', path: '/make-your-own' },
  { name: 'Get a Quote', path: '/inquiry' },
  { name: 'Journal', path: '/blog' },
];

/** A magazine masthead: links either side of a large centred wordmark, hairline rules above and below. */
const Masthead = () => {
  const isAuthenticated = useIsLoggedIn();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: announcement } = useQuery({ queryKey: ['announcement'], queryFn: () => cmsApi.getAnnouncement(), staleTime: 60000 });
  const { data: cartCount } = useQuery({ queryKey: ['cart-count'], queryFn: () => cartApi.getCartCount(), enabled: isAuthenticated, refetchInterval: 30000 });
  const { data: wishlist } = useQuery({ queryKey: ['wishlist'], queryFn: () => wishlistApi.getWishlist(), enabled: isAuthenticated, refetchInterval: 30000 });

  useEffect(() => {
    const update = () => setGuestCount(guestCart.getCount());
    update();
    window.addEventListener('guestCartUpdated', update);
    return () => window.removeEventListener('guestCartUpdated', update);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);
  useEffect(() => {
    if (!profileOpen) return;
    const close = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [profileOpen]);

  const count = isAuthenticated ? cartCount?.count || 0 : guestCount;
  const wishCount = wishlist?.length || 0;
  const link = ({ isActive }: { isActive: boolean }) => `ed-kicker ed-link inline-flex h-9 items-center ${isActive ? 'text-primary' : 'text-foreground'}`;

  const go = (tab: string) => { setProfileOpen(false); navigate('/dashboard', { state: { activeTab: tab } }); };
  const logout = () => {
    setProfileOpen(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authEmail');
    dispatchLoggedOut();
    navigate('/', { replace: true });
  };
  const item = 'ed-kicker flex w-full items-center gap-3 px-4 py-3 text-left !text-[11px] transition-colors hover:bg-foreground hover:text-background';

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="border-b ed-hair bg-foreground text-background">
        <p className="ed-kicker py-2 text-center !text-[10px] !font-medium">
          {announcement?.text || 'Made to order · Dispatch in 5–6 days (India)'}
        </p>
      </div>

      <div className="container-custom">
        <div className={`grid grid-cols-[1fr_auto_1fr] items-center transition-[padding] duration-500 ${scrolled ? 'py-2.5' : 'py-5'}`}>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
            {left.slice(0, 1).map((l) => <NavLink key={l.path} to={l.path} className={link}>{l.name}</NavLink>)}
            <div className="ed-catdrop"><CategoryDropdown /></div>
            {left.slice(1).map((l) => <NavLink key={l.path} to={l.path} className={(a) => `${link(a)} ${l.xl ? 'hidden xl:inline-flex' : ''}`}>{l.name}</NavLink>)}
          </nav>
          <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 justify-self-start lg:hidden">
            {menuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
            <span className="ed-kicker hidden sm:inline">Menu</span>
          </button>

          <Link to="/" className="text-center leading-none">
            <span
              className={`block font-serif font-light italic tracking-[-0.04em] transition-[font-size] duration-500 ${scrolled ? 'text-[1.7rem]' : 'text-[clamp(1.8rem,4.6vw,3.4rem)]'}`}
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              Studio Sara
            </span>
          </Link>

          <div className="flex items-center justify-end gap-5">
            <nav className="hidden items-center gap-6 xl:flex" aria-label="Secondary">
              {right.map((l) => <NavLink key={l.path} to={l.path} className={link}>{l.name}</NavLink>)}
            </nav>
            <Link
              to="/inquiry"
              className="hidden bg-foreground px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-background shadow-[3px_3px_0_hsl(var(--primary))] transition-all hover:-translate-y-0.5 hover:bg-primary hover:shadow-[3px_3px_0_hsl(var(--foreground))] lg:inline-block"
            >
              Get a Quote
            </Link>
            <div className="flex items-center gap-3.5 sm:gap-4">
              <button type="button" aria-label="Search" onClick={() => setSearchOpen(true)} className="transition-opacity hover:opacity-60">
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
              <Link
                to={isAuthenticated ? '/wishlist' : { pathname: '/login', state: { returnTo: '/wishlist' } } as any}
                aria-label="Wishlist" className="relative hidden transition-opacity hover:opacity-60 sm:block"
              >
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {wishCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">{wishCount}</span>}
              </Link>
              <div className="ed-currency hidden sm:block"><CurrencySelector /></div>

              {isAuthenticated ? (
                <div ref={profileRef} className="relative hidden md:block" onMouseEnter={() => setProfileOpen(true)} onMouseLeave={() => setProfileOpen(false)}>
                  <button type="button" aria-label="Account" aria-haspopup="menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((o) => !o)} className="transition-opacity hover:opacity-60">
                    <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full z-50 w-60 pt-3"
                      >
                        <div className="border border-foreground bg-background shadow-[8px_8px_0_hsl(var(--primary)/0.25)]">
                          <button type="button" role="menuitem" className={item} onClick={() => { setProfileOpen(false); navigate('/portal'); }}><Factory className="h-4 w-4" />Manufacturing Portal</button>
                          <button type="button" role="menuitem" className={`${item} border-t ed-hair`} onClick={() => go('orders')}><Package className="h-4 w-4" />Orders</button>
                          <button type="button" role="menuitem" className={`${item} border-t ed-hair`} onClick={() => { setProfileOpen(false); navigate('/dashboard'); }}><LayoutDashboard className="h-4 w-4" />Dashboard</button>
                          <button type="button" role="menuitem" className={`${item} border-t ed-hair`} onClick={() => go('profile')}><Settings className="h-4 w-4" />Settings</button>
                          <button type="button" role="menuitem" className={`${item} border-t ed-hair text-primary`} onClick={logout}><LogOut className="h-4 w-4" />Logout</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login" aria-label="Log in" className="hidden transition-opacity hover:opacity-60 md:block">
                  <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </Link>
              )}

              <Link to="/cart" aria-label={`Bag, ${count} items`} className="relative transition-opacity hover:opacity-60">
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {count > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">{count}</span>}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b ed-rule" />

      {/* Phone and tablet menu: every link as a large serif line */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            aria-label="Menu"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.1, 1] }}
            className="max-h-[calc(100dvh-7rem)] overflow-y-auto border-b ed-rule bg-background lg:hidden"
          >
            <div className="container-custom py-4">
              <ul>
                {mobileLinks.map((l, i) => (
                  <li key={l.path} className="border-b ed-hair">
                    <NavLink to={l.path} end={l.path === '/'} onClick={() => setMenuOpen(false)}
                      className={({ isActive }) => `flex items-baseline gap-4 py-4 font-serif text-[2rem] font-light leading-none tracking-[-0.03em] ${isActive ? 'text-primary' : ''}`}>
                      <span className="ed-num w-7 text-base text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>{l.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-5">
                <Link to={isAuthenticated ? '/dashboard' : '/login'} onClick={() => setMenuOpen(false)} className="ed-kicker ed-link">{isAuthenticated ? 'My account' : 'Log in'}</Link>
                <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="ed-kicker ed-link">Wishlist{wishCount > 0 ? ` (${wishCount})` : ''}</Link>
                {isAuthenticated && <Link to="/portal" onClick={() => setMenuOpen(false)} className="ed-kicker ed-link">Manufacturing Portal</Link>}
                {isAuthenticated && <button type="button" onClick={() => { setMenuOpen(false); logout(); }} className="ed-kicker ed-link text-primary">Logout</button>}
                <div className="ed-currency ml-auto"><CurrencySelector /></div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      <SearchPopup open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
};

export default Masthead;
