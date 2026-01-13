import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import CategoryProducts from "./pages/CategoryProducts";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Login from "./pages/Login";
import Contact from "./pages/Contact";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";
import NotFound from "./pages/NotFound";
import Customize from "./pages/Customize";
import CustomDesign from "./pages/CustomDesign";
import MakeYourOwn from "./pages/MakeYourOwn";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminFabrics from "./pages/admin/AdminFabrics";
import AdminDesigns from "./pages/admin/AdminDesigns";
import AdminCMS from "./pages/admin/AdminCMS";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCustomConfig from "./pages/admin/AdminCustomConfig";
import AdminUsers from "./pages/admin/AdminUsers";
import CustomProductDetail from "./pages/CustomProductDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:id" element={<CategoryProducts />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/customize" element={<Customize />} />
          <Route path="/custom-design" element={<CustomDesign />} />
          <Route path="/make-your-own" element={<MakeYourOwn />} />
          <Route path="/custom-product" element={<CustomProductDetail />} />
          
          {/* Admin Routes */}
          <Route path="/admin-sara/login" element={<AdminLogin />} />
          <Route path="/admin-sara" element={<AdminDashboard />} />
          <Route path="/admin-sara/products" element={<AdminProducts />} />
          <Route path="/admin-sara/fabrics" element={<AdminFabrics />} />
          <Route path="/admin-sara/designs" element={<AdminDesigns />} />
          <Route path="/admin-sara/cms" element={<AdminCMS />} />
          <Route path="/admin-sara/custom-config" element={<AdminCustomConfig />} />
          <Route path="/admin-sara/categories" element={<AdminCategories />} />
          <Route path="/admin-sara/users" element={<AdminUsers />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
