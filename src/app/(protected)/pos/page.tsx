'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Wallet, 
  Store, 
  X,
  FileText,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { productService } from '@/src/features/products/api/product-service';
import { outletService } from '@/src/features/outlets/api/outlet-service';
import type { Product } from '@/src/features/products/types';
import type { Outlet } from '@/src/features/outlets/types';
import { posService } from '@/src/features/pos/api/pos-service';

// Interface for POS Cart Item
interface CartItem {
  product: Product;
  quantity: number;
}

// Interface for custom floating Toast notifications
interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function PosPage() {
  const { tenantId, outletId: cashierOutletId, role } = useAuth();
  
  // Page states
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Floating Toast Notification state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  
  // Checkout success modal state
  const [checkoutResult, setCheckoutResult] = useState<{
    show: boolean;
    transactionId: string;
    totalAmount: number;
  } | null>(null);

  // Show customized floating toast alerts
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch Outlets (for Owners to select physical branch)
  const fetchOutlets = useCallback(async () => {
    if (!tenantId || role !== 'owner') return;
    setIsLoadingOutlets(true);
    try {
      const data = await outletService.getOutlets(tenantId);
      const activeOutlets = data.filter((o) => o.isActive);
      setOutlets(activeOutlets);
      if (activeOutlets.length > 0) {
        setSelectedOutletId(activeOutlets[0].id);
      }
    } catch (err) {
      showToast('Failed to fetch outlets list.', 'error');
    } finally {
      setIsLoadingOutlets(false);
    }
  }, [tenantId, role, showToast]);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    if (!tenantId) return;
    setIsLoadingProducts(true);
    try {
      const data = await productService.getProducts(tenantId);
      // Only display items that are configured as available
      const availableItems = data.filter((p) => p.isAvailable);
      setProducts(availableItems);
    } catch (err) {
      showToast('Failed to retrieve products catalog.', 'error');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [tenantId, showToast]);

  // Initial loading effects
  useEffect(() => {
    if (tenantId) {
      fetchProducts();
      if (role === 'owner') {
        fetchOutlets();
      }
    }
  }, [tenantId, role, fetchProducts, fetchOutlets]);

  // Set the final active outletId
  const activeOutletId = useMemo(() => {
    if (role === 'cashier') return cashierOutletId ?? '';
    return selectedOutletId;
  }, [role, cashierOutletId, selectedOutletId]);

  // Get active outlet details
  const activeOutletName = useMemo(() => {
    if (role === 'cashier') {
      return 'Assigned Outlet';
    }
    const match = outlets.find((o) => o.id === selectedOutletId);
    return match ? match.name : 'Select Outlet';
  }, [role, outlets, selectedOutletId]);

  // Categories list
  const categoriesList = useMemo(() => {
    const categories = new Set(products.map((p) => p.category.trim()).filter(Boolean));
    return ['ALL', ...Array.from(categories)];
  }, [products]);

  // Local client filtering
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

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`${product.name} is currently out of stock.`, 'warning');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Cannot add more. Limit of ${product.stock} items reached.`, 'warning');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      showToast(`${product.name} added to checkout cart!`, 'success');
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const decrementCartItem = (productId: string) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === productId);
      if (!existing) return prevCart;
      
      if (existing.quantity <= 1) {
        return prevCart.filter((item) => item.product.id !== productId);
      }
      
      return prevCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const incrementCartItem = (productId: string, maxStock: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === productId);
      if (!existing) return prevCart;
      
      if (existing.quantity >= maxStock) {
        showToast(`Capped at maximum available stock: ${maxStock} items.`, 'warning');
        return prevCart;
      }
      
      return prevCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart.', 'info');
  };

  // Cart total calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // IDR Currency Formatter
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Process checkout API invocation
  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('Checkout cart is empty!', 'warning');
      return;
    }

    if (!activeOutletId) {
      showToast('Please select a branch outlet for this transaction.', 'warning');
      return;
    }

    setIsCheckingOut(true);
    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const res = await posService.processTransaction({
        items: itemsPayload,
        outletId: activeOutletId,
      });

      // Show success modal
      setCheckoutResult({
        show: true,
        transactionId: res.transactionId,
        totalAmount: res.totalAmount,
      });

      // Reset cart and refresh product stocks
      setCart([]);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Checkout transaction failed.', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="relative mx-auto flex h-[calc(100vh-6.5rem)] max-w-7xl flex-col gap-6 overflow-hidden lg:flex-row">
      
      {/* Floating Animated Toast Banner */}
      <div className="pointer-events-none fixed right-6 top-20 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md min-w-[280px] max-w-sm ${
                toast.type === 'success' 
                  ? 'border-emerald-200/50 bg-emerald-50/90 text-emerald-800' 
                  : toast.type === 'error'
                  ? 'border-rose-200/50 bg-rose-50/90 text-rose-800'
                  : toast.type === 'warning'
                  ? 'border-amber-200/50 bg-amber-50/90 text-amber-800'
                  : 'border-blue-200/50 bg-blue-50/90 text-blue-800'
              }`}
            >
              {toast.type === 'success' && <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />}
              {toast.type === 'error' && <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />}
              {toast.type === 'info' && <Info className="h-5 w-5 shrink-0 text-blue-600" />}
              <span className="text-sm font-semibold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* LEFT COLUMN: Product Catalog selection */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden h-full">
        
        {/* Title & Branch Selection Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Cashier POS Register
            </h1>
            <p className="text-sm text-slate-500">
              Select items, adjust quantities, and securely register offline checkouts.
            </p>
          </div>
          
          {/* Owner-facing physical branch selection */}
          {role === 'owner' ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm shrink-0">
              <Store className="h-4.5 w-4.5 text-slate-500" />
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                disabled={isLoadingOutlets}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
              >
                {isLoadingOutlets ? (
                  <option>Loading branches...</option>
                ) : outlets.length === 0 ? (
                  <option value="">No Active Outlets</option>
                ) : (
                  outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shrink-0">
              <Store className="h-3.5 w-3.5" />
              <span>OUTLET: {activeOutletName}</span>
            </div>
          )}
        </div>

        {/* Search and Category Filter Card */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by menu name, SKU code..."
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
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition hover:border-slate-300 cursor-pointer"
            >
              {categoriesList.map((category) => (
                <option key={category} value={category}>
                  {category === 'ALL' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid Catalog */}
        <div className="flex-1 overflow-y-auto pr-1">
          {isLoadingProducts ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-white border border-slate-100" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <Wallet className="h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-md font-bold text-slate-800">No Products Available</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                No items match your active search terms or category selection filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                
                return (
                  <motion.div
                    key={product.id}
                    whileHover={!isOutOfStock ? { y: -4 } : {}}
                    whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 ${
                      isOutOfStock 
                        ? 'opacity-60 cursor-not-allowed bg-slate-50' 
                        : 'cursor-pointer hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Category Pill Tag */}
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {product.category}
                      </span>
                      
                      {/* Name */}
                      <h3 className="mt-2 text-sm font-bold text-slate-900 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      {/* SKU */}
                      {product.sku && (
                        <p className="mt-0.5 text-[10px] font-mono text-slate-400">
                          {product.sku}
                        </p>
                      )}
                    </div>
                    
                    {/* Price and Stock Indicators */}
                    <div className="mt-4 flex items-end justify-between border-t border-slate-50 pt-3">
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Price</p>
                        <p className="text-sm font-black text-slate-900 group-hover:text-slate-950">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        {isOutOfStock ? (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-100">
                            Sold Out
                          </span>
                        ) : product.stock <= 5 ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-100 animate-pulse">
                            {product.stock} left
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Stock: {product.stock}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Shopping Cart Panel */}
      <div className="flex w-full flex-col gap-4 border-t border-slate-200 bg-white p-4 shadow-xl lg:w-96 lg:rounded-3xl lg:border lg:border-slate-100 lg:p-6 lg:shadow-md shrink-0 h-full overflow-hidden">
        
        {/* Shopping Cart Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <ShoppingCart className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-md font-bold text-slate-900">Current Order</h2>
              <p className="text-xs text-slate-400">{cartTotalItems} items selected</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => {
                setCart([]);
                showToast('Cart cleared completely.', 'info');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Shopping Cart List */}
        <div className="flex-1 overflow-y-auto pr-1 shrink-0 py-2">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">Your checkout cart is empty.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Click on products in the catalog on the left to add items to checkout.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <h4 className="text-xs font-bold text-slate-800 truncate" title={item.product.name}>
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        {formatPrice(item.product.price)}
                      </p>
                    </div>

                    {/* Quantity increment/decrement buttons */}
                    <div className="flex items-center space-x-2.5 shrink-0">
                      <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => decrementCartItem(item.product.id)}
                          className="p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-850">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => incrementCartItem(item.product.id, item.product.stock)}
                          className="p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Order Billing breakdown and Checkout Button */}
        <div className="border-t border-slate-100 pt-4 shrink-0 space-y-4">
          <div className="space-y-1.5 text-sm font-semibold">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Subtotal Items</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Transaction Fee (PWA App)</span>
              <span>Rp0</span>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-md font-bold text-slate-900">
              <span>Total Price</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isCheckingOut || cart.length === 0 || !activeOutletId}
            className="flex w-full items-center justify-center rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-slate-950/20 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-slate-950/10"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Transaction...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Process Payment & Checkout ({formatPrice(cartSubtotal)})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Checkout Success Modal Dialog */}
      <AnimatePresence>
        {checkoutResult && checkoutResult.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheckoutResult(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-2xl"
            >
              
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>

              <h2 className="text-xl font-bold text-slate-900">Transaction Successful!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your sales transaction has been successfully recorded in Firestore ledger.
              </p>

              {/* Receipt details */}
              <div className="my-5 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-left">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2 font-semibold text-slate-800 text-xs">
                  <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-slate-500" /> Receipt ID</span>
                  <span className="font-mono text-slate-600 truncate max-w-[150px]">{checkoutResult.transactionId}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-550">
                  <span>Branch Name</span>
                  <span className="text-slate-900">{activeOutletName}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-550 mt-1">
                  <span>Total Amount Paid</span>
                  <span className="font-black text-slate-900">{formatPrice(checkoutResult.totalAmount)}</span>
                </div>
              </div>

              {/* Print and Close buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Print Invoice
                </button>
                <button
                  onClick={() => setCheckoutResult(null)}
                  className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-850"
                >
                  Close Register
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
