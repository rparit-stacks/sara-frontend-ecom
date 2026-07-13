import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SITE_UNDER_MAINTENANCE } from "@/siteMaintenance";
import Maintenance from "@/pages/Maintenance";
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
import PaymentPage from "./pages/PaymentPage";
import AuthCallback from "./pages/AuthCallback";
import AdminInvite from "./pages/admin/AdminInvite";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductEdit from "./pages/admin/AdminProductEdit";
import AdminFabrics from "./pages/admin/AdminFabrics";
import AdminDesigns from "./pages/admin/AdminDesigns";
import AdminCMS from "./pages/admin/AdminCMS";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCategoryForm from "./pages/admin/AdminCategoryForm";
import AdminCustomConfig from "./pages/admin/AdminCustomConfig";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAdmins from "./pages/admin/AdminAdmins";
import CustomProductDetail from "./pages/CustomProductDetail";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import Inquiry from "./pages/Inquiry";
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
import AdminLogs from "./pages/admin/AdminLogs";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import MaintenancePlan from "./pages/admin/MaintenancePlan";
import PortalGuard from "./components/portal/PortalGuard";
import PortalHome from "./pages/portal/PortalHome";
import ClientProjectDetail from "./pages/portal/ClientProjectDetail";
import PortalMessages from "./pages/portal/PortalMessages";
import PortalActivity from "./pages/portal/PortalActivity";
import PortalFiles from "./pages/portal/PortalFiles";
import PortalProfile from "./pages/portal/PortalProfile";
import PortalSettings from "./pages/portal/PortalSettings";
import PortalThreads from "./pages/portal/PortalThreads";
import PortalInvoices from "./pages/portal/PortalInvoices";
import PortalPaymentHistory from "./pages/portal/PortalPaymentHistory";
import PortalAdminDashboard from "./pages/portal/admin/AdminDashboard";
import PortalAdminProjects from "./pages/portal/admin/AdminProjects";
import PortalAdminProjectDetail from "./pages/portal/admin/AdminProjectDetail";
import PortalAdminInquiries from "./pages/portal/admin/AdminInquiries";
import PortalAdminQuotations from "./pages/portal/admin/AdminQuotations";
import PortalAdminPaymentLinks from "./pages/portal/admin/AdminPaymentLinks";
import PortalAdminPaymentHistory from "./pages/portal/admin/AdminPaymentHistory";
import PortalAdminInvoices from "./pages/portal/admin/AdminInvoices";
import PortalAdminTechPacks from "./pages/portal/admin/AdminTechPacks";
import PortalAdminClients from "./pages/portal/admin/AdminClients";
import PortalAdminSettings from "./pages/portal/admin/AdminSettings";
import PortalAdminInquiryForm from "./pages/portal/admin/AdminInquiryForm";
import PortalAdminInquiryContent from "./pages/portal/admin/AdminInquiryContent";
import PortalAdminForms from "./pages/portal/admin/AdminForms";
import PortalAdminFormBuilder from "./pages/portal/admin/AdminFormBuilder";
import PortalAdminQuoteBuilder from "./pages/portal/admin/AdminQuoteBuilder";
import PortalAdminInquiryDetail from "./pages/portal/admin/AdminInquiryDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve cached data instantly and treat it as fresh for 60s, so revisiting
      // a page shows immediately instead of a 2s refetch. Data older than this
      // still shows instantly, then refreshes in the background.
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () =>
  SITE_UNDER_MAINTENANCE ? (
    <Maintenance />
  ) : (
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
          <Route path="/pay" element={<PaymentPage />} />
          <Route path="/pay/:code" element={<PaymentPage />} />
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
          <Route path="/inquiry" element={<Inquiry />} />
          
          {/* Manufacturing Portal (client side) */}
          <Route path="/portal" element={<PortalGuard><PortalHome /></PortalGuard>} />
          <Route path="/portal/projects/:code" element={<PortalGuard><ClientProjectDetail /></PortalGuard>} />
          <Route path="/portal/workspace" element={<PortalGuard><Navigate to="/portal" replace /></PortalGuard>} />
          <Route path="/portal/quotation" element={<PortalGuard><Navigate to="/portal" replace /></PortalGuard>} />
          <Route path="/portal/messages" element={<PortalGuard><PortalMessages /></PortalGuard>} />
          <Route path="/portal/activity" element={<PortalGuard><PortalActivity /></PortalGuard>} />
          <Route path="/portal/files" element={<PortalGuard><PortalFiles /></PortalGuard>} />
          <Route path="/portal/profile" element={<PortalGuard><PortalProfile /></PortalGuard>} />
          <Route path="/portal/settings" element={<PortalGuard><PortalSettings /></PortalGuard>} />
          <Route path="/portal/threads" element={<PortalGuard><PortalThreads /></PortalGuard>} />
          <Route path="/portal/drafts" element={<PortalGuard><Navigate to="/portal" replace /></PortalGuard>} />
          <Route path="/portal/brief" element={<PortalGuard><Navigate to="/portal" replace /></PortalGuard>} />
          <Route path="/portal/moodboards" element={<PortalGuard><Navigate to="/portal" replace /></PortalGuard>} />
          <Route path="/portal/pins" element={<PortalGuard><Navigate to="/portal" replace /></PortalGuard>} />
          <Route path="/portal/invoices" element={<PortalGuard><PortalInvoices /></PortalGuard>} />
          <Route path="/portal/payment-history" element={<PortalGuard><PortalPaymentHistory /></PortalGuard>} />

          {/* Manufacturing Portal — ADMIN side (guarded by existing store-admin auth) */}
          <Route path="/portal-admin" element={<ProtectedAdminRoute><PortalAdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/projects" element={<ProtectedAdminRoute><PortalAdminProjects /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/projects/:code" element={<ProtectedAdminRoute><PortalAdminProjectDetail /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/inquiries" element={<ProtectedAdminRoute><PortalAdminInquiries /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/inquiries/:id" element={<ProtectedAdminRoute><PortalAdminInquiryDetail /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/inquiry-form" element={<ProtectedAdminRoute><PortalAdminInquiryForm /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/inquiry-content" element={<ProtectedAdminRoute><PortalAdminInquiryContent /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/quotations" element={<ProtectedAdminRoute><PortalAdminQuotations /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/payment-links" element={<ProtectedAdminRoute><PortalAdminPaymentLinks /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/payment-history" element={<ProtectedAdminRoute><PortalAdminPaymentHistory /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/quote-editor/new" element={<ProtectedAdminRoute><PortalAdminQuoteBuilder /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/quote-editor/:reference" element={<ProtectedAdminRoute><PortalAdminQuoteBuilder /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/quotations/:project" element={<ProtectedAdminRoute><Navigate to="/portal-admin/quotations" replace /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/forms" element={<ProtectedAdminRoute><PortalAdminForms /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/forms/:id" element={<ProtectedAdminRoute><PortalAdminFormBuilder /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/invoices" element={<ProtectedAdminRoute><PortalAdminInvoices /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/tech-packs" element={<ProtectedAdminRoute><PortalAdminTechPacks /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/clients" element={<ProtectedAdminRoute><PortalAdminClients /></ProtectedAdminRoute>} />
          <Route path="/portal-admin/settings" element={<ProtectedAdminRoute><PortalAdminSettings /></ProtectedAdminRoute>} />

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
            path="/admin-sara/products/edit/:id"
            element={
              <ProtectedAdminRoute>
                <AdminProductEdit />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-sara/maintenance"
            element={
              <ProtectedAdminRoute>
                <MaintenancePlan />
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
            path="/admin-sara/categories/new" 
            element={
              <ProtectedAdminRoute>
                <AdminCategoryForm />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/categories/new/:parentId" 
            element={
              <ProtectedAdminRoute>
                <AdminCategoryForm />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-sara/categories/edit/:id" 
            element={
              <ProtectedAdminRoute>
                <AdminCategoryForm />
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
          <Route
            path="/admin-sara/logs"
            element={
              <ProtectedAdminRoute>
                <AdminLogs />
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
