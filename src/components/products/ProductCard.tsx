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
    <motion.div
      whileHover={{ y: -4 }}
      className={cn('group card-floral', className)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-foreground text-background text-[10px] px-2 py-0.5">NEW</Badge>
          )}
          {product.isSale && discount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">-{discount}%</Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            className="w-8 h-8 rounded-full bg-white hover:bg-primary text-foreground hover:text-white shadow-sm"
          >
            <i className="fa-regular fa-heart text-xs"></i>
          </Button>
          <Button
            size="icon"
            className="w-8 h-8 rounded-full bg-white hover:bg-primary text-foreground hover:text-white shadow-sm"
          >
            <i className="fa-regular fa-eye text-xs"></i>
          </Button>
        </div>

        {/* Add to Cart */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button className="w-full bg-foreground hover:bg-foreground/90 text-white rounded-full text-xs h-9">
            <i className="fa-solid fa-bag-shopping mr-2 text-xs"></i>
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Content */}
      <Link to={`/product/${product.id}`} className="block p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.category}</p>
        <h3 className="font-medium text-sm text-foreground mt-1 group-hover:text-primary transition-colors line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold text-sm text-primary">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        {/* Rating */}
        <div className="flex items-center gap-0.5 mt-1">
          {[...Array(5)].map((_, i) => (
            <i key={i} className={`fa-solid fa-star text-[8px] ${i < (product.rating || 4) ? 'text-primary' : 'text-muted'}`}></i>
          ))}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
