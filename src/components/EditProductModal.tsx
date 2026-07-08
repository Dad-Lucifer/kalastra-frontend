import { useState, useEffect, useRef } from 'react';
import { apiRequest, API_BASE_URL } from '../utils/api';

const availableColors = ['Red', 'Blue', 'Black', 'White', 'Green', 'Yellow', 'Pink', 'Grey'];
const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductImage {
  url: string;
  alt: string;
  order: number;
}

interface EditProduct {
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
  images: ProductImage[];
  thumbnail_url: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_featured: boolean;
}

interface EditProductModalProps {
  product: EditProduct;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProductModal({ product, categories, onClose, onSaved }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    category_id: product.category_id,
    subcategory_id: product.subcategory_id || '',
    name: product.name,
    description: product.description || '',
    buying_price: product.buying_price.toString(),
    selling_price: product.selling_price.toString(),
    discount_percentage: product.discount_percentage.toString(),
    gst_percentage: product.gst_percentage.toString(),
    stock_quantity: product.stock_quantity.toString(),
    low_stock_threshold: product.low_stock_threshold.toString(),
    is_featured: product.is_featured,
    colors: product.colors || [] as string[],
    sizes: product.sizes || [] as string[],
  });
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>(product.images || []);
  const [modalSubcategories, setModalSubcategories] = useState<Subcategory[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formData.category_id) {
      const cat = categories.find((c) => c.id === formData.category_id);
      if (cat) loadSubcategories(cat.slug);
    }
  }, [formData.category_id]);

  const loadSubcategories = async (categorySlug: string) => {
    const res = await apiRequest(`/products/categories/${categorySlug}/subcategories`);
    if (res.success && res.data) {
      setModalSubcategories(res.data);
    }
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
        const newImages: ProductImage[] = data.data.map(
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

  const resetForm = () => {
    setFormData({
      category_id: product.category_id,
      subcategory_id: product.subcategory_id || '',
      name: product.name,
      description: product.description || '',
      buying_price: product.buying_price.toString(),
      selling_price: product.selling_price.toString(),
      discount_percentage: product.discount_percentage.toString(),
      gst_percentage: product.gst_percentage.toString(),
      stock_quantity: product.stock_quantity.toString(),
      low_stock_threshold: product.low_stock_threshold.toString(),
      is_featured: product.is_featured,
      colors: product.colors || [],
      sizes: product.sizes || [],
    });
    setUploadedImages(product.images || []);
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

    const res = await apiRequest(`/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (res.success) {
      alert('Product updated successfully!');
      onSaved();
      onClose();
    } else {
      alert(`Failed to update product: ${res.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto py-10" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#1C1C1C] rounded-2xl overflow-hidden mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <h2 className="text-xl font-bold text-[#F5F5F5]">Edit Product</h2>
          <button onClick={onClose} className="text-2xl text-[#999] hover:text-[#F5F5F5] bg-transparent border-none cursor-pointer transition-colors">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
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
              <select
                value={formData.subcategory_id}
                onChange={(e) => handleFormChange('subcategory_id', e.target.value)}
                className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-[#F5F5F5] text-sm outline-none focus:border-[#D4AF37] transition-colors"
              >
                <option value="">None</option>
                {modalSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
              <div className="flex items-center gap-3">
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
              <div className="grid grid-cols-4 gap-2 mt-3">
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

          <div className="flex justify-end gap-3 pt-4 border-t border-[#333]">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-6 py-2.5 bg-transparent text-[#999] text-sm font-medium rounded-lg border border-[#333] hover:border-[#D4AF37] hover:text-[#F5F5F5] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2.5 bg-[#D4AF37] text-[#0F0F0F] text-sm font-medium rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
