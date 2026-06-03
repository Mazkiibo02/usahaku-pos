'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

import { productFormSchema, type ProductFormValues, type Product } from '../types';
import { productService } from '../api/product-service';

type ProductFormProps = {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  product?: Product | null;
  onSuccess: () => void;
};

// Formatting Helper for Rupiah without decimals
const formatRupiah = (value: string | number) => {
  const rawDigits = String(value).replace(/[^0-9]/g, '');
  if (!rawDigits) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(rawDigits, 10));
};

export function ProductForm({
  isOpen,
  onClose,
  tenantId,
  product,
  onSuccess,
}: ProductFormProps) {
  const isEditMode = !!product;
  const [error, setError] = useState<string | null>(null);
  const [displayPrice, setDisplayPrice] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      sku: product?.sku ?? '',
      category: product?.category ?? '',
      isAvailable: product?.isAvailable ?? true,
    },
  });

  const isAvailableValue = watch('isAvailable');
  const categoryValue = watch('category') || '';

  // Filter categories case-insensitively based on input value
  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categoryValue.toLowerCase())
  );

  // Register the price field programmatically in React Hook Form
  useEffect(() => {
    register('price');
  }, [register]);

  // Synchronize values when the form is opened or the product shifts
  useEffect(() => {
    if (product) {
      setValue('name', product.name);
      setValue('description', product.description ?? '');
      setValue('price', product.price);
      setValue('stock', product.stock ?? 0);
      setValue('sku', product.sku ?? '');
      setValue('category', product.category);
      setValue('isAvailable', product.isAvailable);
      setDisplayPrice(formatRupiah(product.price));
    } else {
      setValue('name', '');
      setValue('description', '');
      setValue('price', 0);
      setValue('stock', 0);
      setValue('sku', '');
      setValue('category', '');
      setValue('isAvailable', true);
      setDisplayPrice('');
    }
    setError(null);
  }, [product, setValue]);

  // Fetch tenant categories on open
  useEffect(() => {
    const fetchCategories = async () => {
      if (!tenantId) return;
      try {
        console.log('[ProductForm] Memulai penarikan kategori untuk tenantId:', tenantId);
        const cats = await productService.getTenantCategories(tenantId);
        console.log('[ProductForm] Kategori berhasil dimuat:', cats);
        setCategories(cats);
      } catch (err) {
        console.error('[ProductForm] Gagal memuat kategori dari Firestore:', err);
      }
    };
    if (isOpen) {
      fetchCategories();
    }
  }, [tenantId, isOpen]);

  // Handle click outside of the category dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numericValue = rawValue ? parseInt(rawValue, 10) : 0;
    setDisplayPrice(formatRupiah(rawValue));
    setValue('price', numericValue, { shouldValidate: true });
  };

  const onSubmit = async (data: ProductFormValues) => {
    setError(null);
    try {
      if (isEditMode && product) {
        await productService.updateProduct(tenantId, product.id, data);
      } else {
        await productService.createProduct(tenantId, data);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white/95 p-6 shadow-2xl backdrop-blur-md max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditMode ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Tutup dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 shrink-0">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1 pb-32"
              noValidate
            >
              {/* Product Name */}
              <div className="space-y-1">
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                  Nama Produk
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Contoh: Nasi Goreng Spesial"
                  {...register('name')}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70"
                />
                {errors.name && (
                  <p className="text-xs font-medium text-rose-600">{errors.name.message}</p>
                )}
              </div>

              {/* SKU & Category (Two columns on desktop) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Category */}
                <div ref={dropdownRef} className="relative space-y-1">
                  <label htmlFor="category" className="block text-sm font-semibold text-slate-700">
                    Kategori
                  </label>
                  <div className="relative">
                    <input
                      id="category"
                      type="text"
                      placeholder="Contoh: Makanan, Minuman, Pakaian"
                      {...register('category')}
                      onFocus={() => setCategoryDropdownOpen(true)}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70"
                      autoComplete="off"
                    />
                    
                    {isCategoryDropdownOpen && (
                      <ul className="absolute z-50 left-0 right-0 mt-1 max-h-40 w-full overflow-y-auto rounded-lg bg-white border border-slate-200 shadow-lg py-1">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((cat) => (
                            <li
                              key={cat}
                              onClick={() => {
                                setValue('category', cat, { shouldValidate: true });
                                setCategoryDropdownOpen(false);
                              }}
                              className="cursor-pointer px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors font-medium border-b border-slate-50 last:border-0"
                            >
                              {cat}
                            </li>
                          ))
                        ) : (
                          <li className="px-3.5 py-2.5 text-xs text-slate-400 italic">
                            Buat kategori baru &ldquo;{categoryValue}&rdquo;
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  {errors.category && (
                    <p className="text-xs font-medium text-rose-600">{errors.category.message}</p>
                  )}
                </div>

                {/* SKU */}
                <div className="space-y-1">
                  <label htmlFor="sku" className="block text-sm font-semibold text-slate-700">
                    Kode SKU <span className="text-xs font-normal text-slate-400">(Opsional)</span>
                  </label>
                  <input
                    id="sku"
                    type="text"
                    placeholder="Contoh: NSG-001"
                    {...register('sku')}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                  {errors.sku && (
                    <p className="text-xs font-medium text-rose-600">{errors.sku.message}</p>
                  )}
                </div>
              </div>

              {/* Price & Stock side-by-side */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Price with Masking */}
                <div className="space-y-1">
                  <label htmlFor="price" className="block text-sm font-semibold text-slate-700">
                    Harga Satuan (Rp)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-sm font-semibold text-slate-400 select-none">
                      Rp
                    </span>
                    <input
                      id="price"
                      type="text"
                      placeholder="0"
                      value={displayPrice}
                      onChange={handlePriceChange}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-900 font-medium outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>
                  {errors.price && (
                    <p className="text-xs font-medium text-rose-600">{errors.price.message}</p>
                  )}
                </div>

                {/* Stock Level */}
                <div className="space-y-1">
                  <label htmlFor="stock" className="block text-sm font-semibold text-slate-700">
                    Stok Tersedia
                  </label>
                  <input
                    id="stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register('stock', { valueAsNumber: true })}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                  {errors.stock && (
                    <p className="text-xs font-medium text-rose-600">{errors.stock.message}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
                  Deskripsi <span className="text-xs font-normal text-slate-400">(Opsional)</span>
                </label>
                <textarea
                  id="description"
                  placeholder="Masukkan detail produk, ukuran, atau bahan..."
                  rows={3}
                  {...register('description')}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:opacity-70 resize-none"
                />
                {errors.description && (
                  <p className="text-xs font-medium text-rose-600">{errors.description.message}</p>
                )}
              </div>

              {/* Switch / Status toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 shrink-0">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Status Ketersediaan</h4>
                  <p className="text-xs text-slate-500">
                    {isAvailableValue
                      ? 'Produk ini tersedia dan akan tampil di katalog kasir'
                      : 'Produk ini habis / disembunyikan dari katalog kasir'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setValue('isAvailable', !isAvailableValue)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950/20 disabled:cursor-not-allowed ${
                    isAvailableValue ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      isAvailableValue ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : isEditMode ? (
                    'Simpan Perubahan'
                  ) : (
                    'Simpan Produk'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
