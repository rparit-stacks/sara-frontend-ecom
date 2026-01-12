import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navLinks = [
  { name: 'Home', path: '/', icon: 'fa-home' },
  { 
    name: 'Shop', 
    path: '/products',
    icon: 'fa-bag-shopping',
    children: [
      { name: 'All Products', path: '/products', icon: 'fa-th-large' },
      { name: 'Categories', path: '/categories', icon: 'fa-layer-group' },
      { name: 'New Arrivals', path: '/products?filter=new', icon: 'fa-sparkles' },
      { name: 'Best Sellers', path: '/products?filter=best', icon: 'fa-fire' },
    ]
  },
  { name: 'Customize', path: '/customize', icon: 'fa-palette' },
  { name: 'About', path: '/about', icon: 'fa-heart' },
  { name: 'Contact', path: '/contact', icon: 'fa-envelope' },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setActiveDropdown(null);
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

  const cartItemCount = 3;
  const wishlistCount = 2;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-background/98 backdrop-blur-lg shadow-medium py-2'
          : 'bg-gradient-to-b from-background/80 to-transparent py-4'
      )}
    >
      <div className="container-custom">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 z-10 group">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-secondary to-tertiary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-cursive text-2xl font-bold">S</span>
            </div>
            <div className="flex flex-col">
              <span className="font-cursive text-2xl md:text-3xl font-bold text-gradient leading-none">
                Studio Sara
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hidden sm:block">
                Premium Textiles
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <div
                key={link.name}
                className="relative"
                onMouseEnter={() => link.children && setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to={link.path}
                  className={cn(
                    'flex items-center gap-2 font-medium transition-all duration-300 link-underline py-2',
                    location.pathname === link.path
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary'
                  )}
                >
                  <i className={`fa-solid ${link.icon} text-sm`}></i>
                  {link.name}
                  {link.children && (
                    <i className={cn(
                      'fa-solid fa-chevron-down text-xs transition-transform duration-300',
                      activeDropdown === link.name && 'rotate-180'
                    )}></i>
                  )}
                </Link>

                {/* Dropdown */}
                <AnimatePresence>
                  {link.children && activeDropdown === link.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-card rounded-2xl shadow-medium border border-border overflow-hidden"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.path}
                          className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <i className={`fa-solid ${child.icon} w-4`}></i>
                          {child.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Search */}
            <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-primary/10 rounded-full w-11 h-11">
              <i className="fa-solid fa-search text-lg"></i>
            </Button>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative">
              <Button variant="ghost" size="icon" className="hover:bg-secondary/20 rounded-full w-11 h-11">
                <i className="fa-solid fa-heart text-lg text-secondary"></i>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 rounded-full w-11 h-11">
                <i className="fa-solid fa-bag-shopping text-lg"></i>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce-soft">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User/Login */}
            <Link to="/login" className="hidden md:block">
              <Button variant="ghost" size="icon" className="hover:bg-accent/20 rounded-full w-11 h-11">
                <i className="fa-solid fa-user text-lg text-accent"></i>
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-primary/10 rounded-full w-11 h-11"
              onClick={() => setIsOpen(!isOpen)}
            >
              <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
            </Button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu - Full Screen */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 top-0 lg:hidden bg-background z-40"
          >
            {/* Decorative background */}
            <div className="absolute inset-0 bg-pattern-floral opacity-30" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
            
            <div className="relative h-full flex flex-col pt-20 pb-8 px-6 overflow-y-auto">
              {/* Navigation Links */}
              <div className="flex-1 space-y-2">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-4 py-4 px-6 rounded-2xl font-semibold text-lg transition-all',
                        location.pathname === link.path
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-colored'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        location.pathname === link.path ? 'bg-white/20' : 'bg-primary/10'
                      )}>
                        <i className={`fa-solid ${link.icon} text-xl ${location.pathname === link.path ? 'text-white' : 'text-primary'}`}></i>
                      </div>
                      {link.name}
                    </Link>
                    
                    {/* Sub-links */}
                    {link.children && (
                      <div className="ml-6 mt-2 space-y-1">
                        {link.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.path}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 py-3 px-6 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <i className={`fa-solid ${child.icon} text-sm`}></i>
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              
              {/* Bottom Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-6 border-t border-border space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Button className="btn-primary gap-2 py-6">
                    <i className="fa-solid fa-search"></i>
                    Search
                  </Button>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="block">
                    <Button variant="outline" className="w-full btn-outline gap-2 py-6">
                      <i className="fa-solid fa-user"></i>
                      Login
                    </Button>
                  </Link>
                </div>
                
                {/* Social Links */}
                <div className="flex justify-center gap-4 pt-4">
                  {['facebook', 'instagram', 'twitter', 'pinterest'].map((social) => (
                    <a
                      key={social}
                      href="#"
                      className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all"
                    >
                      <i className={`fa-brands fa-${social} text-lg`}></i>
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
