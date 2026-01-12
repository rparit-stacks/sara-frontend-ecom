import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Edit, Trash2, Plus, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  subcategories?: Category[];
  status: 'active' | 'inactive';
}

interface CategoryTreeProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onAddSubcategory: (parentId: string) => void;
}

const CategoryNode: React.FC<{
  category: Category;
  level: number;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onAddSubcategory: (parentId: string) => void;
}> = ({ category, level, onEdit, onDelete, onAddSubcategory }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent",
          level === 0 ? "bg-white shadow-sm border-border mb-2" : "mb-1 ml-6 border-dashed border-border/50"
        )}
      >
        <div className="flex items-center gap-2">
          {hasSubcategories ? (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-muted rounded-md transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          
          <FolderTree className={cn(
            "w-4 h-4",
            category.status === 'active' ? "text-primary" : "text-muted-foreground opacity-50"
          )} />
          
          <span className={cn(
            "font-medium",
            category.status === 'inactive' && "text-muted-foreground line-through"
          )}>
            {category.name}
          </span>
          
          {category.status === 'inactive' && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase font-bold">
              Inactive
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => onAddSubcategory(category.id)}
            title="Add Subcategory"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(category)}
            title="Edit Category"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(category.id)}
            title="Delete Category"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && hasSubcategories && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {category.subcategories?.map((sub) => (
              <CategoryNode 
                key={sub.id} 
                category={sub} 
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddSubcategory={onAddSubcategory}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CategoryTree: React.FC<CategoryTreeProps> = ({ 
  categories, 
  onEdit, 
  onDelete, 
  onAddSubcategory 
}) => {
  return (
    <div className="space-y-1">
      {categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-border">
          <FolderTree className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">No categories found. Create your first category to get started.</p>
        </div>
      ) : (
        categories.map((category) => (
          <CategoryNode 
            key={category.id} 
            category={category} 
            level={0}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubcategory={onAddSubcategory}
          />
        ))
      )}
    </div>
  );
};
