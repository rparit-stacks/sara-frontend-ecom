import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import SearchPopup from '@/components/search/SearchPopup';
import { cartApi, wishlistApi } from '@/lib/api';
import { guestCart } from '@/lib/guestCart';
import { CategoryDropdown } from '@/components/categories/CategoryDropdown';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { Package, Download, User } from 'lucide-react';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Shop', path: '/products' },
  { name: 'Custom Design', path: '/custom-design' },
  { name: 'Upload Your Design', path: '/make-your-own' },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('authToken');

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fetch cart count (for logged-in users)
  const { data: cartCountData } = useQuery({
    queryKey: ['cart-count'],
    queryFn: () => cartApi.getCartCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch wishlist count
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getWishlist(),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get guest cart count
  const [guestCartCount, setGuestCartCount] = useState(0);
  
  useEffect(() => {
    const updateGuestCartCount = () => {
      setGuestCartCount(guestCart.getCount());
    };
    updateGuestCartCount();
    window.addEventListener('guestCartUpdated', updateGuestCartCount);
    return () => window.removeEventListener('guestCartUpdated', updateGuestCartCount);
  }, []);

  const cartItemCount = isAuthenticated ? (cartCountData?.count || 0) : guestCartCount;
  const wishlistCount = wishlistData?.length || 0;

  // Handle profile menu hover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleProfileMenuClick = (tab: string) => {
    setIsProfileMenuOpen(false);
    navigate('/dashboard', { state: { activeTab: tab } });
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-border">
      {/* Global marquee */}
      <div className="bg-foreground text-background text-[10px] xs:text-[11px] sm:text-xs">
        <div className="container-custom overflow-hidden">
          <div className="marquee py-1">
            <span className="mx-6">Made to order. Dispatch takes 5–6 days (India)</span>
            <span className="mx-6">Made to order. Dispatch takes 5–6 days (India)</span>
          </div>
        </div>
      </div>
      <div className="container-custom">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo - Text only, dual color */}
          <Link to="/" className="flex items-center z-10">
            <span className="font-cursive text-xl xs:text-2xl md:text-3xl font-bold">
              <span className="text-primary">Studio</span>
              <span className="text-foreground"> Sara</span>
            </span>
          </Link>

          {/* Desktop Navigation - Minimal, no icons */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Home */}
            <Link
              to="/"
              className={cn(
                'text-sm font-medium transition-colors duration-200 link-underline py-1',
                location.pathname === '/'
                  ? 'text-primary'
                  : 'text-foreground hover:text-primary'
              )}
            >
              Home
            </Link>
            
            {/* Category Dropdown */}
            <CategoryDropdown />
            
            {/* Other nav links */}
            {navLinks.filter(link => link.name !== 'Home').map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  'text-sm font-medium transition-colors duration-200 link-underline py-1',
                  location.pathname === link.path
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Actions - Compact */}
          <div className="flex items-center gap-2 xs:gap-3">
            {/* Search */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex w-11 h-11 rounded-full hover:bg-secondary"
              onClick={() => setIsSearchOpen(true)}
            >
              <i className="fa-solid fa-search text-base"></i>
            </Button>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative">
              <Button variant="ghost" size="icon" className="w-10 h-10 xs:w-11 xs:h-11 rounded-full hover:bg-secondary">
                <i className="fa-regular fa-heart text-sm xs:text-base"></i>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 xs:w-5.5 xs:h-5.5 bg-primary text-primary-foreground text-[10px] xs:text-[11px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="w-10 h-10 xs:w-11 xs:h-11 rounded-full hover:bg-secondary">
                <i className="fa-solid fa-bag-shopping text-sm xs:text-base"></i>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 xs:w-5.5 xs:h-5.5 bg-primary text-primary-foreground text-[10px] xs:text-[11px] font-bold rounded-full flex items-center justify-center">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Currency Selector */}
            <div className="block">
              <CurrencySelector />
            </div>

            {/* User/Login */}
            {isAuthenticated ? (
              <div 
                ref={profileMenuRef}
                className="hidden md:block relative"
                onMouseEnter={() => setIsProfileMenuOpen(true)}
                onMouseLeave={() => setIsProfileMenuOpen(false)}
              >
                <Button variant="ghost" size="icon" className="w-11 h-11 rounded-full hover:bg-secondary">
                  <i className="fa-regular fa-user text-base"></i>
                </Button>
                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-56 bg-white border border-border rounded-lg shadow-lg z-50"
                    >
                      <div className="py-2">
                        <button
                          onClick={() => handleProfileMenuClick('orders')}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-3"
                        >
                          <Package className="w-4 h-4" />
                          Your Orders
                        </button>
                        <button
                          onClick={() => handleProfileMenuClick('downloads')}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-3"
                        >
                          <Download className="w-4 h-4" />
                          Your Downloads
                        </button>
                        <button
                          onClick={() => handleProfileMenuClick('profile')}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-3"
                        >
                          <User className="w-4 h-4" />
                          Edit Profile
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="hidden md:block">
                <Button variant="ghost" size="icon" className="w-11 h-11 rounded-full hover:bg-secondary">
                  <i className="fa-regular fa-user text-base"></i>
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden w-8 h-8 xs:w-9 xs:h-9 rounded-full hover:bg-secondary"
              onClick={() => setIsOpen(!isOpen)}
            >
              <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'} text-sm xs:text-base`}></i>
            </Button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu - Clean slide down */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-t border-border overflow-hidden"
          >
            <div className="container-custom py-4">
              {/* Navigation Links */}
              <div className="space-y-1">
                {/* Home */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0 * 0.05 }}
                >
                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'block py-3 px-4 rounded-lg text-sm font-medium transition-colors',
                      location.pathname === '/'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-secondary'
                    )}
                  >
                    Home
                  </Link>
                </motion.div>
                
                {/* Category Dropdown (mobile-friendly, full-width) */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 * 0.05 }}
                >
                  <div className="px-4 py-3">
                    <CategoryDropdown />
                  </div>
                </motion.div>
                
                {/* Other nav links */}
                {navLinks.filter(link => link.name !== 'Home').map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (index + 2) * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'block py-3 px-4 rounded-lg text-sm font-medium transition-colors',
                        location.pathname === link.path
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-secondary'
                      )}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
              
              {/* Bottom Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 pt-4 border-t border-border flex gap-3"
              >
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 rounded-full text-xs"
                  onClick={() => {
                    setIsSearchOpen(true);
                    setIsOpen(false);
                  }}
                >
                  <i className="fa-solid fa-search"></i>
                  Search
                </Button>
                <Link to={isAuthenticated ? "/dashboard" : "/login"} onClick={() => setIsOpen(false)} className="flex-1">
                  <Button className="w-full btn-primary gap-2">
                    <i className="fa-regular fa-user"></i>
                    {isAuthenticated ? 'Dashboard' : 'Login'}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Popup */}
      <SearchPopup open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
};

export default Navbar;
