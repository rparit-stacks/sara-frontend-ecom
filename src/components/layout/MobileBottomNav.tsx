import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cartApi, wishlistApi } from '@/lib/api';

const navItems = [
  { href: '/', label: 'Home', icon: 'fa-home' },
  { href: '/categories', label: 'Categories', icon: 'fa-th-large' },
  { href: '/products', label: 'Shop', icon: 'fa-bag-shopping' },
  { href: '/wishlist', label: 'Wishlist', icon: 'fa-heart' },
  { href: '/login', label: 'Account', icon: 'fa-user' },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('authToken');

  // Fetch cart count
  const { data: cartCountData } = useQuery({
    queryKey: ['cart-count'],
    queryFn: () => cartApi.getCartCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  // Fetch wishlist count
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getWishlist(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const cartItemCount = cartCountData?.count || 0;
  const wishlistCount = wishlistData?.length || 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href === '/products' && location.pathname.startsWith('/products')) ||
            (item.href === '/categories' && location.pathname.startsWith('/category'));
          
          // Get count for wishlist and cart
          let count = 0;
          if (item.href === '/wishlist') {
            count = wishlistCount;
          } else if (item.href === '/cart') {
            count = cartItemCount;
          }
          
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
              <div className="relative">
                <i className={`fa-solid ${item.icon} text-xl ${isActive ? 'scale-110' : ''} transition-transform`}></i>
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
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
