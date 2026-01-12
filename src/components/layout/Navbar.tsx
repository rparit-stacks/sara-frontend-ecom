import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, Heart, ShoppingBag, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navLinks = [
  { name: 'Home', path: '/' },
  { 
    name: 'Shop', 
    path: '/products',
    children: [
      { name: 'All Products', path: '/products' },
      { name: 'Categories', path: '/categories' },
      { name: 'New Arrivals', path: '/products?filter=new' },
      { name: 'Best Sellers', path: '/products?filter=best' },
    ]
  },
  { name: 'Customize', path: '/customize' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
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

  const cartItemCount = 3; // Mock cart count
  const wishlistCount = 2; // Mock wishlist count

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/95 backdrop-blur-md shadow-soft py-2'
          : 'bg-transparent py-4'
      )}
    >
      <div className="container-custom">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 z-10">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif text-xl">F</span>
            </div>
            <span className="font-serif text-xl md:text-2xl font-semibold text-foreground">
              Florelia
            </span>
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
                    'flex items-center gap-1 font-medium transition-colors duration-200 link-underline',
                    location.pathname === link.path
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary'
                  )}
                >
                  {link.name}
                  {link.children && (
                    <ChevronDown className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      activeDropdown === link.name && 'rotate-180'
                    )} />
                  )}
                </Link>

                {/* Dropdown */}
                <AnimatePresence>
                  {link.children && activeDropdown === link.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-card rounded-xl shadow-medium border border-border overflow-hidden"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.path}
                          className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary hover:text-primary transition-colors"
                        >
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
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search */}
            <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-secondary rounded-full">
              <Search className="w-5 h-5" />
            </Button>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative">
              <Button variant="ghost" size="icon" className="hover:bg-secondary rounded-full">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="hover:bg-secondary rounded-full">
                <ShoppingBag className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User/Login */}
            <Link to="/login" className="hidden md:block">
              <Button variant="ghost" size="icon" className="hover:bg-secondary rounded-full">
                <User className="w-5 h-5" />
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-secondary rounded-full"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-background border-t border-border overflow-hidden"
          >
            <div className="container-custom py-4 space-y-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={link.path}
                    className={cn(
                      'block py-3 px-4 rounded-lg font-medium transition-colors',
                      location.pathname === link.path
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-secondary'
                    )}
                  >
                    {link.name}
                  </Link>
                  {link.children && (
                    <div className="ml-4 mt-1 space-y-1">
                      {link.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.path}
                          className="block py-2 px-4 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Mobile Search & Login */}
              <div className="pt-4 border-t border-border flex gap-4">
                <Button className="flex-1 btn-primary">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className="w-full btn-outline">
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
