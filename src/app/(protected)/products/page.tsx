'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Tag, Layers, ClipboardCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuthStore } from '@/src/stores/authStore';
import { productService } from '@/src/features/products/api/product-service';
import type { Product } from '@/src/features/products/types';
import { ProductList } from '@/src/features/products/components/product-list';
import { ProductForm } from '@/src/features/products/components/product-form';

export default function ProductsPage() {
  const { tenantId } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Control States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!tenantId) return;
    // Defer state updates to avoid synchronous setState inside useEffect hook
    await Promise.resolve();
    setIsLoading(true);
    setError(null);
    try {
      const data = await productService.getProducts(tenantId);
      setProducts(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch product catalog. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProducts();
    }
  }, [tenantId, fetchProducts]);

  const handleAddClick = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  // Compute Stats
  const totalProducts = products.length;
  const availableProducts = products.filter((p) => p.isAvailable).length;
  const uniqueCategories = new Set(products.map((p) => p.category.trim()).filter(Boolean)).size;

  if (!tenantId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">Syncing authentication state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Product Catalog
          </h1>
          <p className="text-sm text-slate-500 md:text-base">
            Manage your physical products, master stock parameters, pricing, and catalog categorizations.
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950/20"
        >
          <Plus className="mr-1.5 h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 shrink-0">
        {/* Total Products */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Products</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {isLoading ? (
                  <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
                ) : (
                  totalProducts
                )}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
              <Tag className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* Available Products */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Items</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {isLoading ? (
                  <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
                ) : (
                  availableProducts
                )}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* Unique Categories */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Categories</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {isLoading ? (
                  <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
                ) : (
                  uniqueCategories
                )}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shrink-0">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm flex-1 min-h-[300px]">
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-10 w-full animate-pulse rounded bg-slate-50" />
            <div className="h-12 w-full animate-pulse rounded bg-slate-50" />
            <div className="h-12 w-full animate-pulse rounded bg-slate-50" />
            <div className="h-12 w-full animate-pulse rounded bg-slate-50" />
          </div>
        </div>
      ) : (
        <ProductList
          products={products}
          tenantId={tenantId}
          onEdit={handleEditClick}
          onAddTrigger={handleAddClick}
          onRefresh={fetchProducts}
        />
      )}

      {/* Form Dialog Overlay */}
      {isFormOpen && (
        <ProductForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          tenantId={tenantId}
          product={selectedProduct}
          onSuccess={fetchProducts}
        />
      )}
    </div>
  );
}
