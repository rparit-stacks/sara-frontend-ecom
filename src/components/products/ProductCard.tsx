import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
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
      whileHover={{ y: -5 }}
      className={cn('group card-floral', className)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <Badge className="bg-accent text-accent-foreground">New</Badge>
          )}
          {product.isSale && discount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">-{discount}%</Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <Button
            size="icon"
            variant="secondary"
            className="w-9 h-9 rounded-full shadow-soft"
          >
            <Heart className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="w-9 h-9 rounded-full shadow-soft"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        {/* Add to Cart Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button className="w-full btn-primary gap-2">
            <ShoppingBag className="w-4 h-4" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Content */}
      <Link to={`/product/${product.id}`} className="block p-4">
        <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
        <h3 className="font-serif text-lg font-medium text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg text-primary">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
