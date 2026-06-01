'use client';

import { useState, useMemo } from 'react';
import { Edit2, Trash2, Tag, AlertTriangle, Loader2, Search, SlidersHorizontal, PackageOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timestamp } from 'firebase/firestore';

import type { Product } from '../types';
import { productService } from '../api/product-service';

type ProductListProps = {
  products: Product[];
  tenantId: string;
  onEdit: (product: Product) => void;
  onAddTrigger: () => void;
  onRefresh: () => void;
};

// Formatting Helper for Rupiah
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export function ProductList({
  products,
  tenantId,
  onEdit,
  onAddTrigger,
  onRefresh,
}: ProductListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await productService.deleteProduct(tenantId, deleteTarget.id);
      setIsDeleting(false);
      setDeleteTarget(null);
      onRefresh();
    } catch (err: unknown) {
      setIsDeleting(false);
      if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError('Failed to delete product. Please try again.');
      }
    }
  };

  const formatDate = (timestamp: Date | Timestamp | null | undefined) => {
    if (!timestamp) return '-';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp as Date);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Get unique categories list dynamically
  const categoriesList = useMemo(() => {
    const categories = new Set(products.map((p) => p.category.trim()).filter(Boolean));
    return ['ALL', ...Array.from(categories)];
  }, [products]);

  // Perform search & category filters locally for high performance
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'ALL' ||
        product.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <PackageOpen className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-800">Your Product Catalog is Empty</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Start adding menu items, goods, or retail services to your store catalog so cashiers can register transactions.
        </p>
        <button
          onClick={onAddTrigger}
          className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950/20"
        >
          Add Your First Product
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Search & Filter Controls Card */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SKU code, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white"
          />
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50/50 text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition hover:border-slate-300"
          >
            {categoriesList.map((category) => (
              <option key={category} value={category}>
                {category === 'ALL' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm shrink-0">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageOpen className="h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No products matched your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4">Product Name</th>
                  <th scope="col" className="px-6 py-4">SKU</th>
                  <th scope="col" className="px-6 py-4">Category</th>
                  <th scope="col" className="px-6 py-4">Unit Price</th>
                  <th scope="col" className="px-6 py-4">Stock</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Added On</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="transition duration-150 hover:bg-slate-50/50"
                  >
                    {/* Name */}
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                          <Tag className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          {product.description && (
                            <span className="max-w-[200px] truncate text-xs font-normal text-slate-400">
                              {product.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* SKU */}
                    <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                      <span className="font-mono text-xs bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {product.sku || '-'}
                      </span>
                    </td>
                    {/* Category */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {product.category}
                      </span>
                    </td>
                    {/* Unit Price */}
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
                      {formatPrice(product.price)}
                    </td>
                    {/* Stock level */}
                    <td className="whitespace-nowrap px-6 py-4">
                      {product.stock <= 0 ? (
                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200/50">
                          0 (Out of stock)
                        </span>
                      ) : product.stock <= 5 ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/50">
                          {product.stock} (Low stock)
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-slate-900 font-semibold">
                          {product.stock}
                        </span>
                      )}
                    </td>
                    {/* Status Toggle Pill */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          product.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                            : 'bg-rose-50 text-rose-700 border-rose-200/50'
                        }`}
                      >
                        <span
                          className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                            product.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {product.isAvailable ? 'Available' : 'Out of Stock'}
                      </span>
                    </td>
                    {/* Created Date */}
                    <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                      {formatDate(product.createdAt)}
                    </td>
                    {/* Actions */}
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onEdit(product)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                          title="Edit product"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-white text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                          title="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteTarget(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Product Item?</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Are you sure you want to delete <span className="font-semibold text-slate-800">&quot;{deleteTarget.name}&quot;</span>?
                    This action is permanent and cannot be undone. Any cashiers currently viewing this item will no longer be able to select it.
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {deleteError}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end space-x-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 min-w-[80px]"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
