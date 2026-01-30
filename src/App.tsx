import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { LoadingProvider } from "@/context/LoadingContext";
import ScrollToTop from "./components/ScrollToTop";
import AuthSessionListener from "./components/AuthSessionListener";
import VisitTracker from "./components/VisitTracker";
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import CategoryProducts from "./pages/CategoryProducts";
import CategoryHierarchy from "./pages/CategoryHierarchy";
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
import Shipping from "./pages/Shipping";
import NotFound from "./pages/NotFound";
import Customize from "./pages/Customize";
import CustomDesign from "./pages/CustomDesign";
import MakeYourOwn from "./pages/MakeYourOwn";
import Dashboard from "./pages/Dashboard";
import OrderDetail from "./pages/OrderDetail";
import OrderConfirmation from "./pages/OrderConfirmation";
import TestimonialSubmit from "./pages/TestimonialSubmit";
import AuthCallback from "./pages/AuthCallback";
import AdminInvite from "./pages/admin/AdminInvite";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminFabrics from "./pages/admin/AdminFabrics";
import AdminDesigns from "./pages/admin/AdminDesigns";
import AdminCMS from "./pages/admin/AdminCMS";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCustomConfig from "./pages/admin/AdminCustomConfig";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAdmins from "./pages/admin/AdminAdmins";
import CustomProductDetail from "./pages/CustomProductDetail";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminHomepageBlogs from "./pages/admin/AdminHomepageBlogs";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminContactSubmissions from "./pages/admin/AdminContactSubmissions";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminBusinessConfig from "./pages/admin/AdminBusinessConfig";
import AdminPaymentConfig from "./pages/admin/AdminPaymentConfig";
import AdminCurrencyMultipliers from "./pages/admin/AdminCurrencyMultipliers";
import AdminWhatsApp from "./pages/admin/AdminWhatsApp";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CurrencyProvider>
    <LoadingProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthSessionListener />
        <VisitTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/*" element={<CategoryHierarchy />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          <Route path="/testimonial/:linkId" element={<TestimonialSubmit />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/customize" element={<Customize />} />
          <Route path="/custom-design" element={<CustomDesign />} />
          <Route path="/make-your-own" element={<MakeYourOwn />} />
          <Route path="/custom-product/:id" element={<CustomProductDetail />} />
          <Route path="/custom-product" element={<CustomProductDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          
          {/* Admin Routes */}
          <Route path="/admin-sara/login" element={<AdminLogin />} />
          <Route path="/admin-sara/invite/:token" element={<AdminInvite />} />
          <Route 
            path="/admin-sara" 
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/products" 
            element={
              <ProtectedAdminRoute>
                <AdminProducts />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/fabrics" 
            element={
              <ProtectedAdminRoute>
                <AdminFabrics />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/designs" 
            element={
              <ProtectedAdminRoute>
                <AdminDesigns />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/cms" 
            element={
              <ProtectedAdminRoute>
                <AdminCMS />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/blog" 
            element={
              <ProtectedAdminRoute>
                <AdminBlog />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/homepage-blogs" 
            element={
              <ProtectedAdminRoute>
                <AdminHomepageBlogs />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/faq" 
            element={
              <ProtectedAdminRoute>
                <AdminFAQ />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/custom-config" 
            element={
              <ProtectedAdminRoute>
                <AdminCustomConfig />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/categories" 
            element={
              <ProtectedAdminRoute>
                <AdminCategories />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/users" 
            element={
              <ProtectedAdminRoute>
                <AdminUsers />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/admins" 
            element={
              <ProtectedAdminRoute>
                <AdminAdmins />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/coupons" 
            element={
              <ProtectedAdminRoute>
                <AdminCoupons />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/shipping" 
            element={
              <ProtectedAdminRoute>
                <AdminShipping />
              </ProtectedAdminRoute>
            } 
          />
          <Route
            path="/admin-sara/contact-submissions"
            element={
              <ProtectedAdminRoute>
                <AdminContactSubmissions />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-sara/orders"
            element={
              <ProtectedAdminRoute>
                <AdminOrders />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-sara/orders/:id"
            element={
              <ProtectedAdminRoute>
                <AdminOrderDetail />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-sara/business-config"
            element={
              <ProtectedAdminRoute>
                <AdminBusinessConfig />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-sara/payment-config"
            element={
              <ProtectedAdminRoute>
                <AdminPaymentConfig />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-sara/currency-multipliers"
            element={
              <ProtectedAdminRoute>
                <AdminCurrencyMultipliers />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-sara/whatsapp"
            element={
              <ProtectedAdminRoute>
                <AdminWhatsApp />
              </ProtectedAdminRoute>
            }
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </LoadingProvider>
    </CurrencyProvider>
  </QueryClientProvider>
);

export default App;
