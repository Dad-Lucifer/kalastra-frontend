import { useState, useEffect, useRef } from 'react';
import { apiRequest, API_BASE_URL } from '../utils/api';
import EditProductModal from '../components/EditProductModal';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  subcategory_id: string | null;
  description: string;
  buying_price: number;
  selling_price: number;
  discount_percentage: number;
  gst_percentage: number;
  colors: string[];
  sizes: string[];
  images: Array<{ url: string; alt: string; order: number }>;
  thumbnail_url: string;
  stock_quantity: number;
  low_stock_threshold: number;
  stock_status: string;
  category_name: string;
  subcategory_name: string;
  is_featured: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductsPageProps {
  isAdminMode?: boolean;
}

const availableColors = ['Red', 'Blue', 'Black', 'White', 'Green', 'Yellow', 'Pink', 'Grey'];
const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function ProductsPage({ isAdminMode = false }: ProductsPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Mobile filter drawer
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Add Product Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    subcategory_id: '',
    name: '',
    description: '',
    buying_price: '',
    selling_price: '',
    discount_percentage: '0',
    gst_percentage: '0',
    stock_quantity: '0',
    low_stock_threshold: '10',
    is_featured: false,
    colors: [] as string[],
    sizes: [] as string[],
  });
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; alt: string; order: number }>>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [
    selectedCategory,
    selectedSubcategory,
    debouncedSearch,
    minPrice,
    maxPrice,
    selectedColors,
    selectedSizes,
    sortBy,
    sortOrder,
    currentPage,
  ]);

  const loadCategories = async () => {
    const res = await apiRequest('/products/categories');
    if (res.success && res.data) {
      setCategories(res.data);
    }
  };

  const loadSubcategories = async (categorySlug: string) => {
    const res = await apiRequest(`/products/categories/${categorySlug}/subcategories`);
    if (res.success && res.data) {
      setSubcategories(res.data);
    }
  };

  const loadProducts = async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
    if (searchQuery) params.append('search', searchQuery);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (selectedColors.length > 0) params.append('colors', selectedColors.join(','));
    if (selectedSizes.length > 0) params.append('sizes', selectedSizes.join(','));
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    params.append('page', currentPage.toString());
    params.append('limit', '12');

    const res = await apiRequest(`/products?${params.toString()}`);
    setLoading(false);

    if (res.success && res.data) {
      setProducts(res.data);
      setPagination(res.pagination!);
    }
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
    setCurrentPage(1);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedColors([]);
    setSelectedSizes([]);
    setCurrentPage(1);
  };

  const calculateDiscountedPrice = (price: number, discount: number) => {
    return price - (price * discount) / 100;
  };

  const calculateGstAmount = (price: number, gstPercentage: number) => {
    return (price * gstPercentage) / 100;
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) setEditingProduct(product);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

    const res = await apiRequest(`/products/${productId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      alert('Product deleted successfully');
      loadProducts();
    } else {
      alert(`Failed to delete product: ${res.message}`);
    }
  };

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const form = new FormData();
    for (let i = 0; i < files.length; i++) {
      form.append('images', files[i]);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/upload/images`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: form,
      });

      const data = await res.json();
      if (data.success) {
        const newImages: Array<{ url: string; alt: string; order: number }> = data.data.map(
          (img: any, idx: number) => ({
            url: img.url,
            alt: formData.name || 'Product image',
            order: uploadedImages.length + idx,
          })
        );
        setUploadedImages((prev) => [...prev, ...newImages]);
      } else {
        alert(`Upload failed: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFormColor = (color: string) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  const toggleFormSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      subcategory_id: '',
      name: '',
      description: '',
      buying_price: '',
      selling_price: '',
      discount_percentage: '0',
      gst_percentage: '0',
      stock_quantity: '0',
      low_stock_threshold: '10',
      is_featured: false,
      colors: [],
      sizes: [],
    });
    setUploadedImages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.selling_price || !formData.category_id) {
      alert('Please fill in required fields: Name, Selling Price, and Category');
      return;
    }

    setSubmitting(true);

    let subcategoryName: string | null = null;
    let subcategoryId: string | null = formData.subcategory_id || null;

    if (subcategoryId && subcategoryId.length !== 36) {
      subcategoryName = subcategoryId;
      subcategoryId = null;
    }

    const payload: Record<string, any> = {
      category_id: formData.category_id,
      subcategory_id: subcategoryId,
      subcategory_name: subcategoryName,
      name: formData.name,
      description: formData.description,
      buying_price: parseFloat(formData.buying_price) || 0,
      selling_price: parseFloat(formData.selling_price),
      discount_percentage: parseFloat(formData.discount_percentage) || 0,
      gst_percentage: parseFloat(formData.gst_percentage) || 0,
      colors: formData.colors,
      sizes: formData.sizes,
      images: uploadedImages,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
      is_featured: formData.is_featured,
    };

    const res = await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (res.success) {
      alert('Product created successfully!');
      setShowModal(false);
      resetForm();
      loadProducts();
    } else {
      alert(`Failed to create product: ${res.message}`);
    }
  };

  const renderFilters = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base lg:text-lg font-semibold text-[#F5F5F5]">Filters</h3>
        <button onClick={clearFilters} className="text-xs lg:text-sm text-[#D4AF37] hover:underline bg-transparent border-none cursor-pointer">
          Clear All
        </button>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-[#999] mb-2">Search</label>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-[#999] mb-2">Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm outline-none focus:border-[#D4AF37] transition-colors"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {subcategories.length > 0 && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-[#999] mb-2">Subcategory</label>
          <select
            value={selectedSubcategory}
            onChange={(e) => {
              setSelectedSubcategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm outline-none focus:border-[#D4AF37] transition-colors"
          >
            <option value="">All Subcategories</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.slug}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-5">
        <label className="block text-sm font-medium text-[#999] mb-2">Price Range</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
          />
          <span className="text-[#666]">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-[#999] mb-2">Colors</label>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((color) => (
            <button
              key={color}
              onClick={() => toggleColor(color)}
              className={`w-7 h-7 rounded-full cursor-pointer transition-all duration-200 ${selectedColors.includes(color) ? 'ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-[#1C1C1C]' : 'ring-1 ring-[#333] ring-offset-1 ring-offset-[#1C1C1C]'}`}
              style={{ backgroundColor: color.toLowerCase() }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#999] mb-2">Sizes</label>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-all duration-200 ${
                selectedSizes.includes(size)
                  ? 'bg-[#D4AF37] text-[#0F0F0F]'
                  : 'bg-[#0F0F0F] text-[#F5F5F5] border border-[#333] hover:border-[#D4AF37]'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const hasActiveFilters = selectedCategory || selectedSubcategory || searchQuery || minPrice || maxPrice || selectedColors.length > 0 || selectedSizes.length > 0;

  return (
    <div className="min-h-screen bg-rich-black">
      {/* Header */}
      <div className="text-center pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 bg-[#1C1C1C]">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F5F5F5]">
          {isAdminMode ? 'Product Management' : 'Shop Our Collection'}
        </h1>
        <p className="mt-2 sm:mt-4 text-sm sm:text-base text-[#999]">
          {isAdminMode ? 'Manage your product catalog' : 'Discover the latest trends in fashion'}
        </p>
        {isAdminMode && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="mt-4 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#D4AF37] text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:brightness-110"
          >
            + Add New Product
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 px-4 sm:px-6 py-4 sm:py-8 max-w-[1440px] mx-auto">
        {/* ─── Mobile Filter Bar ─── */}
        <div className="lg:hidden flex items-center gap-3">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1C] border border-[#333] rounded-lg text-sm text-[#F5F5F5] cursor-pointer hover:border-[#D4AF37] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm4 6a1 1 0 011-1h8a1 1 0 010 2H8a1 1 0 01-1-1zm2 6a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1z" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#D4AF37] hover:underline bg-transparent border-none cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* ─── Mobile Filters Drawer ─── */}
        {mobileFiltersOpen && (
          <div className="lg:hidden">
            <div
              className="fixed inset-0 z-50 bg-black/60"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="fixed inset-x-0 top-0 z-50 h-full max-h-[85vh] mt-16 bg-[#1C1C1C] rounded-t-2xl overflow-y-auto px-4 sm:px-6 py-5">
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#1C1C1C] pb-3 border-b border-[#333]">
                <h3 className="text-base font-semibold text-[#F5F5F5]">Filters</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-2xl text-[#999] hover:text-[#F5F5F5] bg-transparent border-none cursor-pointer"
                >
                  &times;
                </button>
              </div>
              {renderFilters()}
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full mt-5 px-4 py-3 bg-[#D4AF37] text-[#0F0F0F] text-sm font-semibold rounded-lg cursor-pointer hover:brightness-110 transition-all border-none"
              >
                Apply Filters
              </button>
            </div>
            
          </div>
        )}

        {/* ─── Desktop Sidebar Filters ─── */}
        <aside className="hidden lg:block w-72 shrink-0 bg-[#1C1C1C] p-6 rounded-xl h-fit sticky top-24">
          {renderFilters()}
        </aside>

        {/* ─── Products Grid ─── */}
        <main className="flex-1 min-w-0">
          {/* Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="text-xs sm:text-sm text-[#999]">
              {pagination && (
                <span>
                  Showing {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm text-[#999] whitespace-nowrap">Sort by:</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-lg text-[#F5F5F5] text-xs sm:text-sm outline-none focus:border-[#D4AF37] transition-colors"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="selling_price-asc">Price: Low to High</option>
                <option value="selling_price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-[#999] text-sm">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-[#999]">No products found matching your filters.</p>
              <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-[#D4AF37] text-[#0F0F0F] text-sm font-medium rounded-lg hover:brightness-110 transition-all border-none cursor-pointer">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-[#1C1C1C] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-black/30 transition-all duration-300 group relative"
                  >
                    {product.is_featured && <span className="absolute top-3 left-3 z-10 px-2 py-1 bg-[#D4AF37] text-[#0F0F0F] text-[10px] font-bold uppercase rounded">Featured</span>}
                    {product.discount_percentage > 0 && (
                      <span className="absolute top-3 right-3 z-10 px-2 py-1 bg-[#ef4444] text-white text-[10px] font-bold rounded">-{product.discount_percentage}%</span>
                    )}

                    <div className="relative aspect-[3/3] overflow-hidden bg-[#0F0F0F]">
                      <img
                        src={product.thumbnail_url || product.images[0]?.url || '/placeholder.png'}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Desktop hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 hidden lg:flex flex-col items-center justify-center gap-2">
                        <button
                          onClick={() => (window.location.href = `/products/${product.slug}`)}
                          className="px-5 py-2 bg-[#D4AF37] text-[#0F0F0F] text-sm font-medium rounded-lg hover:brightness-110 transition-all border-none cursor-pointer"
                        >
                          View Details
                        </button>
                        {isAdminMode && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleEditProduct(product.id)}
                              className="px-3 py-1.5 bg-[#3b82f6] text-white text-xs font-medium rounded hover:brightness-110 transition-all border-none cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="px-3 py-1.5 bg-[#ef4444] text-white text-xs font-medium rounded hover:brightness-110 transition-all border-none cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile persistent buttons */}
                    <div className="lg:hidden flex gap-2 px-2 sm:px-5 pt-2 pb-1">
                      <button
                        onClick={() => (window.location.href = `/products/${product.slug}`)}
                        className="flex-1 px-3 py-2 bg-[#D4AF37] text-[#0F0F0F] text-xs font-semibold rounded-lg hover:brightness-110 transition-all border-none cursor-pointer text-center"
                      >
                        View Details
                      </button>
                      {isAdminMode && (
                        <>
                          <button
                            onClick={() => handleEditProduct(product.id)}
                            className="flex-1 px-3 py-2 bg-[#3b82f6] text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-all border-none cursor-pointer text-center"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="flex-1 px-3 py-2 bg-[#ef4444] text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-all border-none cursor-pointer text-center"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>

                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="text-[10px] sm:text-xs font-medium text-[#D4AF37] uppercase tracking-wider">{product.category_name}</div>
                      <h3 className="text-sm sm:text-base font-semibold text-[#F5F5F5] leading-tight">{product.name}</h3>
                      <p className="text-[10px] sm:text-xs text-[#999] leading-relaxed">
                        {product.description?.substring(0, 80)}
                        {product.description?.length > 80 && '...'}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {product.colors.slice(0, 4).map((color, idx) => (
                            <span
                              key={idx}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-[#333] inline-block"
                              style={{ backgroundColor: color.toLowerCase() }}
                              title={color}
                            />
                          ))}
                          {product.colors.length > 4 && <span className="text-[10px] text-[#999]">+{product.colors.length - 4}</span>}
                        </div>
                        <div className="text-[10px] text-[#666] uppercase tracking-wider">
                          {product.sizes.slice(0, 3).join(', ')}
                          {product.sizes.length > 3 && ` +${product.sizes.length - 3}`}
                        </div>
                      </div>

                      <div className="flex items-end justify-between pt-3 border-t border-[#333]">
                        <div>
                          {(() => {
                            const basePrice = product.selling_price;
                            const discountedPrice = product.discount_percentage > 0
                              ? calculateDiscountedPrice(basePrice, product.discount_percentage)
                              : basePrice;
                            const gstAmount = calculateGstAmount(discountedPrice, product.gst_percentage);
                            const finalPrice = discountedPrice + gstAmount;
                            return (
                              <div>
                                {product.discount_percentage > 0 ? (
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xs sm:text-sm text-[#666] line-through">₹{basePrice.toFixed(2)}</span>
                                    <span className="text-sm sm:text-lg font-bold text-[#D4AF37]">₹{finalPrice.toFixed(2)}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm sm:text-lg font-bold text-[#D4AF37]">₹{finalPrice.toFixed(2)}</span>
                                )}
                                {product.gst_percentage > 0 && (
                                  <div className="text-[10px] text-[#666]">
                                    ₹{discountedPrice.toFixed(2)} + {product.gst_percentage}% GST
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <div className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                          product.stock_status === 'in_stock' ? 'bg-green-900/30 text-green-400' :
                          product.stock_status === 'low' ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-red-900/30 text-red-400'
                        }`}>
                          {product.stock_status === 'in_stock' && '✓ In Stock'}
                          {product.stock_status === 'low' && '⚠ Low Stock'}
                          {product.stock_status === 'out' && '✗ Out of Stock'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2 bg-[#1C1C1C] text-[#F5F5F5] text-xs sm:text-sm rounded-lg border border-[#333] hover:border-[#D4AF37] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-[#D4AF37] text-[#0F0F0F]'
                            : 'bg-[#1C1C1C] text-[#999] border border-[#333] hover:border-[#D4AF37]'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 sm:px-4 py-2 bg-[#1C1C1C] text-[#F5F5F5] text-xs sm:text-sm rounded-lg border border-[#333] hover:border-[#D4AF37] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ─── Add Product Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto py-6 sm:py-10 px-3 sm:px-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-2xl bg-[#1C1C1C] rounded-2xl overflow-hidden mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#333]">
              <h2 className="text-lg sm:text-xl font-bold text-[#F5F5F5]">Add New Product</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl text-[#999] hover:text-[#F5F5F5] bg-transparent border-none cursor-pointer transition-colors">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#999]">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleFormChange('category_id', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm outline-none focus:border-[#D4AF37] transition-colors"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#999]">Subcategory</label>
                  <input
                    type="text"
                    value={formData.subcategory_id}
                    onChange={(e) => handleFormChange('subcategory_id', e.target.value)}
                    placeholder="Type subcategory name (optional)"
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#999]">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#999]">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#999]">Buying Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.buying_price}
                    onChange={(e) => handleFormChange('buying_price', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#999]">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price}
                    onChange={(e) => handleFormChange('selling_price', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#999]">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => handleFormChange('discount_percentage', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#999]">GST %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.gst_percentage}
                    onChange={(e) => handleFormChange('gst_percentage', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#999]">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => handleFormChange('stock_quantity', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#999]">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => handleFormChange('low_stock_threshold', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm placeholder-[#666] outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-[#F5F5F5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => handleFormChange('is_featured', e.target.checked)}
                      className="accent-[#D4AF37]"
                    />
                    Featured Product
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#999]">Colors</label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleFormColor(color)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-all border ${
                        formData.colors.includes(color)
                          ? 'bg-[#D4AF37] text-[#0F0F0F] border-[#D4AF37]'
                          : 'bg-[#0F0F0F] text-[#F5F5F5] border-[#333] hover:border-[#D4AF37]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#999]">Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleFormSize(size)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-all border ${
                        formData.sizes.includes(size)
                          ? 'bg-[#D4AF37] text-[#0F0F0F] border-[#D4AF37]'
                          : 'bg-[#0F0F0F] text-[#F5F5F5] border-[#333] hover:border-[#D4AF37]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#999]">Product Images</label>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 bg-[#D4AF37] text-[#0F0F0F] text-sm font-medium rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all border-none cursor-pointer"
                    >
                      {uploading ? 'Uploading...' : 'Choose Images'}
                    </button>
                    <span className="text-[10px] text-[#666]">Supports JPG, PNG, WebP, AVIF (max 10MB each)</span>
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square bg-[#0F0F0F] rounded-lg overflow-hidden group">
                        <img src={img.url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          title="Remove image"
                          className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none flex items-center justify-center"
                        >
                          &times;
                        </button>
                        {idx === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#D4AF37]/80 text-[#0F0F0F] text-[8px] font-bold rounded">Thumbnail</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#333]">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-transparent text-[#999] text-sm font-medium rounded-lg border border-[#333] hover:border-[#D4AF37] hover:text-[#F5F5F5] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#D4AF37] text-[#0F0F0F] text-sm font-medium rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSaved={loadProducts}
        />
      )}
    </div>
  );
}
