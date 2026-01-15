// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

// Helper function for API calls
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Check if it's an admin route
  const isAdminRoute = endpoint.startsWith('/api/admin');
  const token = isAdminRoute 
    ? localStorage.getItem('adminToken')
    : localStorage.getItem('authToken');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Log API call
  const method = options?.method || 'GET';
  console.log(`[API Call] ${method} ${endpoint}`, {
    hasToken: !!token,
    isAdminRoute,
    body: options?.body ? JSON.parse(options.body as string) : null,
  });
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`[API Error] ${method} ${endpoint}`, {
        status: response.status,
        error,
        duration: `${duration}ms`,
      });
      throw new Error(error || `API Error: ${response.status}`);
    }
    
    // Handle empty responses
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    
    console.log(`[API Success] ${method} ${endpoint}`, {
      status: response.status,
      duration: `${duration}ms`,
      dataSize: JSON.stringify(data).length,
    });
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API Exception] ${method} ${endpoint}`, {
      error: error instanceof Error ? error.message : error,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ===============================
// Products API
// ===============================
export const productsApi = {
  getAll: (params?: { status?: string; type?: string; categoryId?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId.toString());
    return fetchApi<any[]>(`/api/products?${searchParams}`);
  },
  getById: (id: number) => fetchApi<any>(`/api/products/${id}`),
  getBySlug: (slug: string) => fetchApi<any>(`/api/products/slug/${slug}`),
  create: (data: any) => fetchApi<any>('/api/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  createPlain: (data: any) => fetchApi<any>('/api/admin/products/plain', { method: 'POST', body: JSON.stringify(data) }),
  createDesigned: (data: any) => fetchApi<any>('/api/admin/products/designed', { method: 'POST', body: JSON.stringify(data) }),
  createDigital: (data: any) => fetchApi<any>('/api/admin/products/digital', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi<any>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/api/admin/products/${id}`, { method: 'DELETE' }),
  createDigitalFromDesign: (designProductId: number, price?: number) => 
    fetchApi<any>(`/api/products/${designProductId}/create-digital`, { 
      method: 'POST', 
      body: JSON.stringify(price ? { price } : {}) 
    }),
  getDigitalFromDesign: (designProductId: number) => 
    fetchApi<any>(`/api/products/${designProductId}/digital`),
  uploadMedia: async (files: File[], folder: string = 'products'): Promise<any[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('folder', folder);
    
    const token = localStorage.getItem('adminToken');
    const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
    console.log('[Product Media Upload] Uploading', files.length, 'files to:', `${API_BASE_URL}/api/admin/products/upload-media`);
    
    const response = await fetch(`${API_BASE_URL}/api/admin/products/upload-media`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[Product Media Upload] Error:', error);
      throw new Error(error || 'Failed to upload media');
    }
    
    const data = await response.json();
    console.log('[Product Media Upload] Success:', data);
    return data.files || [];
  },
};

// ===============================
// Plain Products (Fabrics) API
// ===============================
export const plainProductsApi = {
  getAll: (params?: { status?: string; categoryId?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId.toString());
    return fetchApi<any[]>(`/api/plain-products?${searchParams}`);
  },
  getActive: () => fetchApi<any[]>('/api/plain-products/active'),
  getById: (id: number) => fetchApi<any>(`/api/plain-products/${id}`),
  create: (data: any) => fetchApi<any>('/api/admin/plain-products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi<any>(`/api/admin/plain-products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/api/admin/plain-products/${id}`, { method: 'DELETE' }),
};

// ===============================
// Designs API
// ===============================
export const designsApi = {
  getAll: (params?: { status?: string; category?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.category) searchParams.set('category', params.category);
    return fetchApi<any[]>(`/api/designs?${searchParams}`);
  },
  getById: (id: number) => fetchApi<any>(`/api/designs/${id}`),
  getCategories: () => fetchApi<string[]>('/api/designs/categories'),
  create: (data: any) => fetchApi<any>('/api/admin/designs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi<any>(`/api/admin/designs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/api/admin/designs/${id}`, { method: 'DELETE' }),
};

// ===============================
// Categories API
// ===============================
export const categoriesApi = {
  getAll: (activeOnly?: boolean) => fetchApi<any[]>(`/api/categories${activeOnly ? '?active=true' : ''}`),
  getById: (id: number) => fetchApi<any>(`/api/categories/id/${id}`),
  getBySlugPath: (slugPath: string) => fetchApi<any>(`/api/categories/${slugPath}`),
  getLeafCategories: () => fetchApi<any[]>('/api/categories/leaf'),
  create: (data: any) => fetchApi<any>('/api/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi<any>(`/api/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/api/admin/categories/${id}`, { method: 'DELETE' }),
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('adminToken');
    const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
    console.log('[Category Image Upload] Uploading to:', `${API_BASE_URL}/api/admin/categories/upload-image`);
    const response = await fetch(`${API_BASE_URL}/api/admin/categories/upload-image`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const error = await response.text();
      console.error('[Category Image Upload] Error:', error);
      throw new Error(error || 'Failed to upload image');
    }
    const data = await response.json();
    console.log('[Category Image Upload] Success:', data.url);
    return data.url;
  },
};

// ===============================
// CMS API
// ===============================
export const cmsApi = {
  getHomepage: () => fetchApi<any>('/api/cms/homepage'),
  getBestSellers: () => fetchApi<number[]>('/api/cms/best-sellers'),
  getNewArrivals: () => fetchApi<number[]>('/api/cms/new-arrivals'),
  getTestimonials: () => fetchApi<any[]>('/api/cms/testimonials'),
  getOffers: () => fetchApi<any[]>('/api/cms/offers'),
  getInstagram: () => fetchApi<string[]>('/api/cms/instagram'),
  getBanners: () => fetchApi<any[]>('/api/cms/banners'),
  getLandingContent: () => fetchApi<Record<string, string>>('/api/cms/landing'),
  getContactInfo: () => fetchApi<Record<string, string>>('/api/cms/contact'),
  
  // Admin
  setBestSellers: (productIds: number[]) => fetchApi<void>('/api/admin/cms/best-sellers', { method: 'PUT', body: JSON.stringify({ productIds }) }),
  setNewArrivals: (productIds: number[]) => fetchApi<void>('/api/admin/cms/new-arrivals', { method: 'PUT', body: JSON.stringify({ productIds }) }),
  
  getAllTestimonials: () => fetchApi<any[]>('/api/admin/cms/testimonials'),
  createTestimonial: (data: any) => fetchApi<any>('/api/admin/cms/testimonials', { method: 'POST', body: JSON.stringify(data) }),
  updateTestimonial: (id: number, data: any) => fetchApi<any>(`/api/admin/cms/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTestimonial: (id: number) => fetchApi<void>(`/api/admin/cms/testimonials/${id}`, { method: 'DELETE' }),
  
  generateTestimonialLink: () => fetchApi<any>('/api/admin/cms/testimonial-links', { method: 'POST' }),
  getTestimonialLinks: () => fetchApi<any[]>('/api/admin/cms/testimonial-links'),
  
  getAllOffers: () => fetchApi<any[]>('/api/admin/cms/offers'),
  createOffer: (data: any) => fetchApi<any>('/api/admin/cms/offers', { method: 'POST', body: JSON.stringify(data) }),
  updateOffer: (id: number, data: any) => fetchApi<any>(`/api/admin/cms/offers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOffer: (id: number) => fetchApi<void>(`/api/admin/cms/offers/${id}`, { method: 'DELETE' }),
  
  setInstagramPosts: (imageUrls: string[]) => fetchApi<void>('/api/admin/cms/instagram', { method: 'PUT', body: JSON.stringify({ imageUrls }) }),
  
  getAllBanners: () => fetchApi<any[]>('/api/admin/cms/banners'),
  createBanner: (data: any) => fetchApi<any>('/api/admin/cms/banners', { method: 'POST', body: JSON.stringify(data) }),
  updateBanner: (id: number, data: any) => fetchApi<any>(`/api/admin/cms/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBanner: (id: number) => fetchApi<void>(`/api/admin/cms/banners/${id}`, { method: 'DELETE' }),
  
  setLandingContent: (content: Record<string, string>) => fetchApi<void>('/api/admin/cms/landing', { method: 'PUT', body: JSON.stringify({ content }) }),
  setContactInfo: (content: Record<string, string>) => fetchApi<void>('/api/admin/cms/contact', { method: 'PUT', body: JSON.stringify({ content }) }),
};

// ===============================
// Blog API
// ===============================
export const blogApi = {
  getAll: (category?: string) => fetchApi<any[]>(`/api/blogs${category ? `?category=${category}` : ''}`),
  getById: (id: number) => fetchApi<any>(`/api/blogs/${id}`),
  getCategories: () => fetchApi<string[]>('/api/blogs/categories'),
  
  // Admin
  getAllAdmin: (params?: { status?: string; category?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.category) searchParams.set('category', params.category);
    return fetchApi<any[]>(`/api/admin/blogs?${searchParams}`);
  },
  getByIdAdmin: (id: number) => fetchApi<any>(`/api/admin/blogs/${id}`),
  create: (data: any) => fetchApi<any>('/api/admin/blogs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi<any>(`/api/admin/blogs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/api/admin/blogs/${id}`, { method: 'DELETE' }),
};

// ===============================
// Contact API
// ===============================
export const contactApi = {
  submit: (data: any) => fetchApi<{ message: string }>('/api/contact/submit', { method: 'POST', body: JSON.stringify(data) }),
  
  // Admin
  getAllSubmissions: (status?: string) => {
    const url = status ? `/api/admin/contact/submissions?status=${status}` : '/api/admin/contact/submissions';
    return fetchApi<any[]>(url);
  },
  getSubmissionById: (id: number) => fetchApi<any>(`/api/admin/contact/submissions/${id}`),
  updateStatus: (id: number, status: string, adminNotes?: string) => 
    fetchApi<any>(`/api/admin/contact/submissions/${id}/status`, { 
      method: 'PUT', 
      body: JSON.stringify({ status, adminNotes }) 
    }),
  delete: (id: number) => fetchApi<void>(`/api/admin/contact/submissions/${id}`, { method: 'DELETE' }),
};

// ===============================
// Media API
// ===============================
export const mediaApi = {
  upload: async (file: File, folder: string = 'banners'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    const token = localStorage.getItem('adminToken');
    const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
    
    const response = await fetch(`${API_BASE_URL}/api/admin/media/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to upload image');
    }
    
    const data = await response.json();
    return data.url;
  },
  
  listAll: (folder?: string) => {
    const url = folder ? `/api/admin/media/list?folder=${folder}` : '/api/admin/media/list';
    return fetchApi<{ images: any[]; count: number }>(url);
  },
  
  delete: (imageUrl: string) => fetchApi<{ message: string }>(`/api/admin/media/delete?url=${encodeURIComponent(imageUrl)}`, { method: 'DELETE' }),
};

// ===============================
// FAQ API
// ===============================
export const faqApi = {
  getAll: (category?: string) => fetchApi<any[]>(`/api/faqs${category ? `?category=${category}` : ''}`),
  getCategories: () => fetchApi<string[]>('/api/faqs/categories'),
  
  // Admin
  getAllAdmin: () => fetchApi<any[]>('/api/admin/faqs'),
  create: (data: any) => fetchApi<any>('/api/admin/faqs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi<any>(`/api/admin/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  reorder: (ids: number[]) => fetchApi<void>('/api/admin/faqs/reorder', { method: 'PUT', body: JSON.stringify({ ids }) }),
  delete: (id: number) => fetchApi<void>(`/api/admin/faqs/${id}`, { method: 'DELETE' }),
};

// ===============================
// Custom Config API
// ===============================
export const customConfigApi = {
  getConfig: () => fetchApi<any>('/api/custom-config'),
  submitDesignRequest: (data: any) => fetchApi<any>('/api/custom-design-requests', { method: 'POST', body: JSON.stringify(data) }),
  
  // Admin
  getAdminConfig: () => fetchApi<any>('/api/admin/custom-config'),
  updateConfig: (data: any) => fetchApi<any>('/api/admin/custom-config', { method: 'PUT', body: JSON.stringify(data) }),
  createFormField: (data: any) => fetchApi<any>('/api/admin/custom-config/fields', { method: 'POST', body: JSON.stringify(data) }),
  updateFormField: (id: number, data: any) => fetchApi<any>(`/api/admin/custom-config/fields/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFormField: (id: number) => fetchApi<void>(`/api/admin/custom-config/fields/${id}`, { method: 'DELETE' }),
  
  getDesignRequests: () => fetchApi<any[]>('/api/admin/custom-design-requests'),
  updateDesignRequestStatus: (id: number, status: string, adminNotes?: string) => 
    fetchApi<any>(`/api/admin/custom-design-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status, adminNotes }) }),
};

// ===============================
// Cart API
// ===============================
export const cartApi = {
  getCart: (state?: string, couponCode?: string) => {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (couponCode) params.set('couponCode', couponCode);
    const query = params.toString();
    return fetchApi<any>(`/api/cart${query ? `?${query}` : ''}`);
  },
  addItem: (data: any) => fetchApi<any>('/api/cart', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (itemId: number, quantity: number) => fetchApi<any>(`/api/cart/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeItem: (itemId: number) => fetchApi<void>(`/api/cart/${itemId}`, { method: 'DELETE' }),
  clearCart: () => fetchApi<void>('/api/cart', { method: 'DELETE' }),
  getCartCount: () => fetchApi<{ count: number }>('/api/cart/count'),
};

// ===============================
// Wishlist API
// ===============================
export const wishlistApi = {
  getWishlist: () => fetchApi<any[]>('/api/wishlist'),
  addItem: (productType: string, productId: number) => 
    fetchApi<any>('/api/wishlist', { method: 'POST', body: JSON.stringify({ productType, productId }) }),
  removeItem: (itemId: number) => fetchApi<void>(`/api/wishlist/${itemId}`, { method: 'DELETE' }),
  removeByProduct: (productType: string, productId: number) => 
    fetchApi<void>(`/api/wishlist/product?productType=${productType}&productId=${productId}`, { method: 'DELETE' }),
  checkItem: (productType: string, productId: number) => 
    fetchApi<{ inWishlist: boolean }>(`/api/wishlist/check?productType=${productType}&productId=${productId}`),
};

// ===============================
// Order API
// ===============================
export const orderApi = {
  createOrder: (data: any) => {
    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchApi<any>('/api/orders', { 
      method: 'POST', 
      body: JSON.stringify(data),
      headers: headers as any
    });
  },
  getUserOrders: () => fetchApi<any[]>('/api/orders'),
  getOrderById: (id: number) => fetchApi<any>(`/api/orders/${id}`),
  
  // Admin
  getAllOrders: (status?: string) => fetchApi<any[]>(`/api/admin/orders${status ? `?status=${status}` : ''}`),
  getOrderByIdAdmin: (id: number) => fetchApi<any>(`/api/admin/orders/${id}`),
  updateOrderStatus: (id: number, status: string) => 
    fetchApi<any>(`/api/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updatePaymentStatus: (id: number, paymentStatus: string, paymentId?: string) => 
    fetchApi<any>(`/api/admin/orders/${id}/payment`, { method: 'PUT', body: JSON.stringify({ paymentStatus, paymentId }) }),
  retrySwipeInvoice: (id: number) => 
    fetchApi<any>(`/api/admin/orders/${id}/retry-swipe-invoice`, { method: 'POST' }),
};

// ===============================
// Business Config API
// ===============================
export const businessConfigApi = {
  getConfig: () => fetchApi<any>('/api/admin/business-config'),
  updateConfig: (data: any) => fetchApi<any>('/api/admin/business-config', { method: 'PUT', body: JSON.stringify(data) }),
};

// ===============================
// Coupon API
// ===============================
export const couponApi = {
  validate: (code: string, orderTotal: number, userEmail?: string) => 
    fetchApi<any>('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code, orderTotal, userEmail }) }),
  
  // Admin
  getAll: () => fetchApi<any[]>('/api/admin/coupons'),
  getById: (id: number) => fetchApi<any>(`/api/admin/coupons/${id}`),
  create: (data: any) => fetchApi<any>('/api/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi<any>(`/api/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/api/admin/coupons/${id}`, { method: 'DELETE' }),
};

// ===============================
// Shipping API
// ===============================
export const shippingApi = {
  calculate: (cartValue: number, state?: string) => 
    fetchApi<any>('/api/shipping/calculate', { method: 'POST', body: JSON.stringify({ cartValue, state }) }),
  
  // Admin
  getAllRules: () => fetchApi<any[]>('/api/admin/shipping-rules'),
  getRuleById: (id: number) => fetchApi<any>(`/api/admin/shipping-rules/${id}`),
  createRule: (data: any) => fetchApi<any>('/api/admin/shipping-rules', { method: 'POST', body: JSON.stringify(data) }),
  updateRule: (id: number, data: any) => fetchApi<any>(`/api/admin/shipping-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRule: (id: number) => fetchApi<void>(`/api/admin/shipping-rules/${id}`, { method: 'DELETE' }),
};

// ===============================
// Admin Auth API
// ===============================
export const adminAuthApi = {
  login: (email: string, password: string) => 
    fetchApi<any>('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (email: string, password: string, name: string, authCode: string) => 
    fetchApi<any>('/api/admin/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name, authCode }) }),
  getCurrentAdmin: () => fetchApi<any>('/api/admin/auth/me'),
};

// ===============================
// Admin Users API
// ===============================
export const adminUsersApi = {
  getAll: (status?: string) => fetchApi<any[]>(`/api/admin/users${status ? `?status=${status}` : ''}`),
  updateStatus: (email: string, status: string) => 
    fetchApi<any>(`/api/admin/users/${encodeURIComponent(email)}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// ===============================
// Admin Dashboard API
// ===============================
export const dashboardApi = {
  getStats: () => fetchApi<any>('/api/admin/dashboard/stats'),
};

// ===============================
// Admin Management API
// ===============================
export const adminManagementApi = {
  getAll: () => fetchApi<any[]>('/api/admin/admins'),
  getById: (id: number) => fetchApi<any>(`/api/admin/admins/${id}`),
  create: (data: any) => fetchApi<any>('/api/admin/admins', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi<any>(`/api/admin/admins/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) => 
    fetchApi<any>(`/api/admin/admins/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  delete: (id: number) => fetchApi<void>(`/api/admin/admins/${id}`, { method: 'DELETE' }),
};

// ===============================
// User API
// ===============================
export const userApi = {
  getProfile: () => fetchApi<any>('/api/user/profile'),
  updateProfile: (data: any) => fetchApi<any>('/api/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
  
  // Addresses
  getAddresses: () => fetchApi<any[]>('/api/user/addresses'),
  getAddressById: (id: number) => fetchApi<any>(`/api/user/addresses/${id}`),
  createAddress: (data: any) => fetchApi<any>('/api/user/addresses', { method: 'POST', body: JSON.stringify(data) }),
  updateAddress: (id: number, data: any) => fetchApi<any>(`/api/user/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAddress: (id: number) => fetchApi<void>(`/api/user/addresses/${id}`, { method: 'DELETE' }),
  setDefaultAddress: (id: number) => fetchApi<any>(`/api/user/addresses/${id}/default`, { method: 'PUT' }),
};

// ===============================
// Auth API
// ===============================
export const authApi = {
  requestOtp: (email: string) => 
    fetchApi<any>('/api/auth/otp/request', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (email: string, otp: string) => 
    fetchApi<any>('/api/auth/otp/verify', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  getGoogleLoginUrl: () => `${API_BASE_URL}/oauth2/authorization/google`,
};

// Submit testimonial via link
export const submitTestimonial = (linkId: string, data: any) => 
  fetchApi<any>(`/api/testimonials/submit/${linkId}`, { method: 'POST', body: JSON.stringify(data) });

// Email subscription
export const subscribeEmail = (email: string) => 
  fetchApi<{ message: string }>(`/api/subscribe`, { method: 'POST', body: JSON.stringify({ email }) });

// Get Instagram thumbnail
export const getInstagramThumbnail = (url: string) => 
  fetchApi<{ thumbnailUrl: string }>(`/api/instagram/thumbnail`, { method: 'POST', body: JSON.stringify({ url }) });

export default {
  products: productsApi,
  plainProducts: plainProductsApi,
  designs: designsApi,
  categories: categoriesApi,
  cms: cmsApi,
  blog: blogApi,
  faq: faqApi,
  customConfig: customConfigApi,
  cart: cartApi,
  wishlist: wishlistApi,
  order: orderApi,
  coupon: couponApi,
  shipping: shippingApi,
  adminAuth: adminAuthApi,
  adminUsers: adminUsersApi,
  adminManagement: adminManagementApi,
  dashboard: dashboardApi,
  user: userApi,
  auth: authApi,
};
