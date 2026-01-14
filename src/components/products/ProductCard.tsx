import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
  isSale?: boolean;
  rating?: number;
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard = ({ product, className }: ProductCardProps) => {
  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0;

  return (
    <Link to={`/product/${product.id}`} className="block">
      <motion.div
        whileHover={{ y: -4 }}
        className={cn('group card-floral w-full cursor-pointer', className)}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Badges */}
          <div className="absolute top-2 xs:top-3 left-2 xs:left-3 flex flex-col gap-1 xs:gap-1.5">
            {product.isNew && (
              <Badge className="bg-foreground text-background text-[10px] xs:text-xs px-2 xs:px-2.5 py-0.5 xs:py-1">NEW</Badge>
            )}
            {product.isSale && discount > 0 && (
              <Badge className="bg-[#2b9d8f] text-white text-[10px] xs:text-xs px-2 xs:px-2.5 py-0.5 xs:py-1">-{discount}%</Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-2 xs:top-3 right-2 xs:right-3 flex flex-col gap-1.5 xs:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="icon"
              className="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-white hover:bg-[#2b9d8f] text-foreground hover:text-white shadow-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <i className="fa-regular fa-heart text-xs xs:text-sm"></i>
            </Button>
            <Button
              size="icon"
              className="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-white hover:bg-[#2b9d8f] text-foreground hover:text-white shadow-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <i className="fa-regular fa-eye text-xs xs:text-sm"></i>
            </Button>
          </div>

          {/* Add to Cart */}
          <div className="absolute inset-x-0 bottom-0 p-2 xs:p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Button 
              className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white rounded-full text-xs xs:text-sm h-9 xs:h-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <i className="fa-solid fa-bag-shopping mr-1.5 xs:mr-2 text-xs xs:text-sm"></i>
              <span className="truncate">Add to Cart</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-2 xs:p-3 sm:p-4">
          <p className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider truncate">{product.category}</p>
          <h3 className="font-medium text-xs xs:text-sm sm:text-base text-foreground mt-1 xs:mt-1.5 group-hover:text-[#2b9d8f] transition-colors line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 flex-wrap">
            <span className="font-bold text-xs xs:text-sm sm:text-base text-[#2b9d8f]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {/* Rating */}
          <div className="flex items-center gap-0.5 xs:gap-1 mt-1 xs:mt-2">
            {[...Array(5)].map((_, i) => (
              <i key={i} className={`fa-solid fa-star text-[7px] xs:text-[8px] sm:text-[10px] md:text-xs ${i < (product.rating || 4) ? 'text-[#2b9d8f]' : 'text-muted'}`}></i>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard;
