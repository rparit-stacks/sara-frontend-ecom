import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, ChevronRight, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import FabricSearchPopup from './FabricSearchPopup';

export interface Fabric {
  id: string;
  name: string;
  image: string;
  pricePerMeter: number;
  status: 'active' | 'inactive';
}

interface FabricSelectionPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendedFabrics: Fabric[];
  onFabricSelect: (fabricId: string) => void;
}

const FabricSelectionPopup: React.FC<FabricSelectionPopupProps> = ({
  open,
  onOpenChange,
  recommendedFabrics,
  onFabricSelect,
}) => {
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null);

  const handleFabricClick = (fabricId: string) => {
    setSelectedFabricId(fabricId);
    onFabricSelect(fabricId);
    onOpenChange(false);
  };

  const handleBrowseAll = () => {
    setShowSearchPopup(true);
  };

  const handleSearchFabricSelect = (fabricId: string) => {
    handleFabricClick(fabricId);
    setShowSearchPopup(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
            <DialogTitle className="font-cursive text-3xl flex items-center gap-3">
              <Palette className="w-6 h-6 text-primary" />
              Select Fabric for Your Design
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Choose from recommended fabrics or browse all available options
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Recommended Fabrics Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recommended Fabrics</h3>
                <Badge variant="secondary" className="text-xs">
                  {recommendedFabrics.length} Options
                </Badge>
              </div>
              
              {recommendedFabrics.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {recommendedFabrics.map((fabric) => (
                    <motion.button
                      key={fabric.id}
                      onClick={() => handleFabricClick(fabric.id)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group",
                        selectedFabricId === fabric.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <img
                        src={fabric.image}
                        alt={fabric.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-3">
                        <h4 className="text-white font-semibold text-sm mb-1">{fabric.name}</h4>
                        <p className="text-white/80 text-xs">₹{fabric.pricePerMeter}/meter</p>
                      </div>
                      {selectedFabricId === fabric.id && (
                        <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1.5">
                          <X className="w-3 h-3" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recommended fabrics available</p>
                </div>
              )}
            </div>

            {/* Browse All Button */}
            <div className="pt-4 border-t border-border">
              <Button
                onClick={handleBrowseAll}
                variant="outline"
                className="w-full h-12 text-base gap-2"
              >
                <Search className="w-5 h-5" />
                Browse All Fabrics
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fabric Search Popup */}
      <FabricSearchPopup
        open={showSearchPopup}
        onOpenChange={setShowSearchPopup}
        onFabricSelect={handleSearchFabricSelect}
        excludeFabricIds={recommendedFabrics.map(f => f.id)}
      />
    </>
  );
};

export default FabricSelectionPopup;
