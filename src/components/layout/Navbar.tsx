import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Shop', path: '/products' },
  { name: 'Categories', path: '/categories' },
  { name: 'Customize', path: '/customize' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

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

  const cartItemCount = 3;
  const wishlistCount = 2;

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-border">
      <div className="container-custom">
        <nav className="flex items-center justify-between h-16">
          {/* Logo - Text only, dual color */}
          <Link to="/" className="flex items-center z-10">
            <span className="font-cursive text-2xl md:text-3xl font-bold">
              <span className="text-primary">Studio</span>
              <span className="text-foreground"> Sara</span>
            </span>
          </Link>

          {/* Desktop Navigation - Minimal, no icons */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
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
          <div className="flex items-center gap-2">
            {/* Search */}
            <Button variant="ghost" size="icon" className="hidden md:flex w-9 h-9 rounded-full hover:bg-secondary">
              <i className="fa-solid fa-search text-sm"></i>
            </Button>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-secondary">
                <i className="fa-regular fa-heart text-sm"></i>
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-secondary">
                <i className="fa-solid fa-bag-shopping text-sm"></i>
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User/Login */}
            <Link to="/login" className="hidden md:block">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-secondary">
                <i className="fa-regular fa-user text-sm"></i>
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden w-9 h-9 rounded-full hover:bg-secondary"
              onClick={() => setIsOpen(!isOpen)}
            >
              <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'} text-base`}></i>
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
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
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
                <Button variant="outline" className="flex-1 gap-2 rounded-full text-xs">
                  <i className="fa-solid fa-search"></i>
                  Search
                </Button>
                <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1">
                  <Button className="w-full btn-primary gap-2">
                    <i className="fa-regular fa-user"></i>
                    Login
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
