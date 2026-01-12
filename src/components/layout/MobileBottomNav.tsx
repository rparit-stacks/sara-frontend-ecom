import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { href: '/', label: 'Home', icon: 'fa-home' },
  { href: '/categories', label: 'Categories', icon: 'fa-th-large' },
  { href: '/products', label: 'Shop', icon: 'fa-bag-shopping' },
  { href: '/wishlist', label: 'Wishlist', icon: 'fa-heart' },
  { href: '/login', label: 'Account', icon: 'fa-user' },
];

export const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href === '/products' && location.pathname.startsWith('/products')) ||
            (item.href === '/categories' && location.pathname.startsWith('/category'));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-lg ${isActive ? 'scale-110' : ''} transition-transform`}></i>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
