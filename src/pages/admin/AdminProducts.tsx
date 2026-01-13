import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Package, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductFormDialog from '@/components/admin/ProductFormDialog';
import { PlainProduct } from '@/components/admin/PlainProductSelector';
import { ProductType } from '@/components/admin/ProductTypeSelector';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Mock plain products - in real app, fetch from API: GET /api/products?type=PLAIN
const mockPlainProducts: PlainProduct[] = [
  { id: 'p1', name: 'Premium Silk Fabric', image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=200', pricePerMeter: 100, status: 'active' },
  { id: 'p2', name: 'Cotton Blue Fabric', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200', pricePerMeter: 80, status: 'active' },
  { id: 'p3', name: 'Linen Cream Fabric', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200', pricePerMeter: 120, status: 'active' },
  { id: 'p4', name: 'Cotton White Fabric', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200', pricePerMeter: 75, status: 'active' },
  { id: 'p5', name: 'Silk Gold Fabric', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=200', pricePerMeter: 150, status: 'active' },
];

const mockCategories = [
  { id: '1', name: 'Clothing', subcategories: [{ id: '1-1', name: 'Menswear' }, { id: '1-2', name: 'Womenswear' }] },
  { id: '2', name: 'Home Decor', subcategories: [{ id: '2-1', name: 'Cushions' }, { id: '2-2', name: 'Bedding' }] },
];

const mockProducts = [
  { id: 1, name: 'Floral Block Print Quilt', type: 'DESIGNED', category: 'Bedding', status: 'active', createdAt: '2024-01-15' },
  { id: 2, name: 'Botanical Cushion Cover', type: 'DESIGNED', category: 'Cushions', status: 'active', createdAt: '2024-01-20' },
  { id: 3, name: 'Premium Silk Fabric', type: 'PLAIN', category: 'Fabrics', status: 'active', createdAt: '2024-01-25' },
  { id: 4, name: 'Cotton Blue Fabric', type: 'PLAIN', category: 'Fabrics', status: 'active', createdAt: '2024-01-26' },
  { id: 5, name: 'Digital Pattern Pack', type: 'DIGITAL', category: 'Templates', status: 'active', createdAt: '2024-02-01' },
];


const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | ProductType>(() => {
    const typeParam = searchParams.get('type') as ProductType | null;
    return typeParam || 'ALL';
  });

  // Update filter when URL param changes
  useEffect(() => {
    const typeParam = searchParams.get('type') as ProductType | null;
    if (typeParam) {
      setFilterType(typeParam);
    }
  }, [searchParams]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'DESIGNED': return <Badge className="bg-pink-100 text-pink-700 border-pink-200">Designed</Badge>;
      case 'DIGITAL': return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Digital</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Plain</Badge>;
    }
  };

  // Handle form submission
  const handleSaveProduct = (payload: any) => {
    // TODO: Call API
    // if (payload.id) {
    //   // Update
    //   await fetch(`/api/admin/products/${payload.id}`, { method: 'PUT', ... });
    // } else {
    //   // Create
    //   await fetch('/api/admin/products', { method: 'POST', ... });
    // }
    
    console.log('Product Payload:', payload);
    toast.success(payload.id ? 'Product updated successfully!' : 'Product created successfully!');
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (productId: number) => {
    setDeleteProductId(productId);
  };

  const confirmDelete = () => {
    // TODO: Call API
    // await fetch(`/api/admin/products/${deleteProductId}`, { method: 'DELETE' });
    toast.success('Product deleted successfully!');
    setDeleteProductId(null);
  };

  // Filter products by type
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || product.type === filterType;
    return matchesSearch && matchesType;
  });

  // Add custom field

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
              Product <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-lg">Create and manage all product types</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="btn-primary gap-2" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Add New Product
            </Button>
          </motion.div>
          
          <ProductFormDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            mode="create"
            plainProducts={mockPlainProducts}
            categories={mockCategories}
            onSave={handleSaveProduct}
          />
          <ProductFormDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            mode="edit"
            productId={editingProduct?.id}
            initialData={editingProduct}
            plainProducts={mockPlainProducts}
            categories={mockCategories}
            onSave={handleSaveProduct}
          />
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search products by name, category, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select 
            value={filterType} 
            onValueChange={(v) => {
              setFilterType(v as any);
              if (v === 'ALL') {
                setSearchParams({});
              } else {
                setSearchParams({ type: v });
              }
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-11">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Products</SelectItem>
              <SelectItem value="PLAIN">Plain Products (Fabrics)</SelectItem>
              <SelectItem value="DESIGNED">Design Products</SelectItem>
              <SelectItem value="DIGITAL">Digital Products</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Product</th>
                  <th className="text-left p-4 font-semibold text-sm">Type</th>
                  <th className="text-left p-4 font-semibold text-sm">Category</th>
                  <th className="text-left p-4 font-semibold text-sm">Price</th>
                  <th className="text-left p-4 font-semibold text-sm">Status</th>
                  <th className="text-left p-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="border-t border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/product/${product.id}?type=${product.type}`}
                            target="_blank"
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {product.name}
                          </Link>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getTypeBadge(product.type)}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{product.category}</Badge>
                    </td>
                    <td className="p-4 font-medium">
                      ₹{product.type === 'PLAIN' ? '100/m' : product.type === 'DESIGNED' ? '1000' : '500'}
                    </td>
                    <td className="p-4">
                      <Badge 
                        className={product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                      >
                        {product.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteProductId !== null} onOpenChange={(open) => !open && setDeleteProductId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this product? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
