import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { usePrice } from '@/lib/currency';
import { Product } from './ProductCard';

interface ListViewProductCardProps {
  product: Product;
  className?: string;
}

export const ListViewProductCard = ({ product, className }: ListViewProductCardProps) => {
  const { format } = usePrice();
  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0;

  return (
    <Link to={`/product/${product.slug}`} className="block">
      <div className={cn('group w-full cursor-pointer border-b border-border hover:bg-muted/30 transition-colors', className)}>
        <div className="flex gap-4 p-4">
          {/* Left: Small Image */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden bg-muted rounded-lg">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Badges */}
            <div className="absolute top-1 left-1 flex flex-col gap-1">
              {product.isNew && (
                <Badge className="bg-foreground text-background text-[9px] px-1.5 py-0.5">NEW</Badge>
              )}
              {product.isSale && discount > 0 && (
                <Badge className="bg-[#2b9d8f] text-white text-[9px] px-1.5 py-0.5">-{discount}%</Badge>
              )}
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider truncate mb-1">
                {product.category}
              </p>
              <h3 className="font-medium text-sm sm:text-base text-foreground group-hover:text-[#2b9d8f] transition-colors line-clamp-2 mb-2">
                {product.name}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-[#2b9d8f]">
                {format(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                  {format(product.originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListViewProductCard;
