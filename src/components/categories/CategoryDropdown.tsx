import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { categoriesApi } from '@/lib/api';
import { ChevronDown } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories?: Category[];
}

export const CategoryDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch active categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoriesApi.getAll(true),
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredCategory(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get parent categories only
  const parentCategories = categories.filter((cat: Category) => !cat.parentId);

  const handleCategoryClick = (category: Category) => {
    navigate(`/category/${category.slug}`);
    setIsOpen(false);
    setHoveredCategory(null);
  };

  const handleSubcategoryClick = (category: Category, subcategory: Category) => {
    navigate(`/category/${category.slug}/${subcategory.slug}`);
    setIsOpen(false);
    setHoveredCategory(null);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className={cn(
          'text-sm font-medium transition-colors duration-200 link-underline py-1 flex items-center gap-1',
          isOpen ? 'text-primary' : 'text-foreground hover:text-primary'
        )}
      >
        Categories
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white border border-border rounded-lg shadow-lg z-50"
            onMouseLeave={() => {
              setIsOpen(false);
              setHoveredCategory(null);
            }}
          >
            <div className="py-2">
              {parentCategories.length === 0 ? (
                <div className="px-4 py-2 text-sm text-muted-foreground">No categories available</div>
              ) : (
                parentCategories.map((category: Category) => (
                  <div
                    key={category.id}
                    className="relative"
                    onMouseEnter={() => setHoveredCategory(category.id)}
                  >
                    <button
                      onClick={() => handleCategoryClick(category)}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm font-medium transition-colors flex items-center justify-between',
                        hoveredCategory === category.id
                          ? 'bg-secondary text-primary'
                          : 'text-foreground hover:bg-secondary'
                      )}
                    >
                      <span>{category.name}</span>
                      {category.subcategories && category.subcategories.length > 0 && (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Subcategories dropdown */}
                    {category.subcategories && category.subcategories.length > 0 && (
                      <AnimatePresence>
                        {hoveredCategory === category.id && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-full top-0 ml-1 w-56 bg-white border border-border rounded-lg shadow-lg"
                          >
                            <div className="py-2">
                              {category.subcategories.map((subcategory: Category) => (
                                <button
                                  key={subcategory.id}
                                  onClick={() => handleSubcategoryClick(category, subcategory)}
                                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary hover:text-primary transition-colors"
                                >
                                  {subcategory.name}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
