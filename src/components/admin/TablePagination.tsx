import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  /** 0-based current page */
  page: number;
  size: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/** Compact "Showing a–b of n" + first/prev/next/last footer shared by admin tables. */
export const TablePagination = ({ page, size, totalElements, onPageChange, disabled }: Props) => {
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  if (totalElements <= size) return null;
  const from = page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        Showing {from}–{to} of {totalElements.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={disabled || page === 0} onClick={() => onPageChange(0)} aria-label="First page">
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={disabled || page === 0} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="px-2 tabular-nums">Page {page + 1} / {totalPages}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={disabled || page >= totalPages - 1} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={disabled || page >= totalPages - 1} onClick={() => onPageChange(totalPages - 1)} aria-label="Last page">
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
