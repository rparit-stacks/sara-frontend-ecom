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
      whileHover={{ y: -8 }}
      className={cn('group card-floral', className)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary/20">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <Badge className="bg-accent text-accent-foreground font-semibold">
              <i className="fa-solid fa-sparkles mr-1"></i> New
            </Badge>
          )}
          {product.isSale && discount > 0 && (
            <Badge className="bg-secondary text-secondary-foreground font-semibold">
              <i className="fa-solid fa-tag mr-1"></i> -{discount}%
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <Button
            size="icon"
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-secondary text-foreground hover:text-white shadow-medium"
          >
            <i className="fa-regular fa-heart"></i>
          </Button>
          <Button
            size="icon"
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-accent text-foreground hover:text-white shadow-medium"
          >
            <i className="fa-regular fa-eye"></i>
          </Button>
        </div>

        {/* Add to Cart Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-semibold gap-2 shadow-glow">
            <i className="fa-solid fa-bag-shopping"></i>
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Content */}
      <Link to={`/product/${product.id}`} className="block p-4">
        <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">{product.category}</p>
        <h3 className="font-elegant text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl text-primary">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <i key={i} className={`fa-solid fa-star text-xs ${i < (product.rating || 4) ? 'text-warm' : 'text-muted'}`}></i>
          ))}
          <span className="text-xs text-muted-foreground ml-1">(24)</span>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
