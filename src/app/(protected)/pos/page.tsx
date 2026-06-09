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
import { ReceiptPrint } from '@/src/features/transactions/components/ReceiptPrint';
import type { Transaction } from '@/src/features/transactions/types';
import { useShiftStore } from '@/src/stores/shiftStore';

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
  const { tenantId, outletId: cashierOutletId, role, user } = useAuth();
  const { activeShift, isLoadingShift, openShift } = useShiftStore();
  const [startingCashInput, setStartingCashInput] = useState<string>('');
  const [isOpeningShift, setIsOpeningShift] = useState(false);
  
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

  // States for printing
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [isReceiptPrintOpen, setIsReceiptPrintOpen] = useState(false);

  // Checkout custom fields state
  const [customerName, setCustomerName] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [taxType, setTaxType] = useState<string>('NONE'); // 'NONE' or 'PPN11'
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash'); // 'Cash' or 'QRIS'
  const [shippingCost, setShippingCost] = useState<number>(0);
  
  // Mobile Cart modal state
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Show customized floating toast alerts
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch Outlets (for Owners to select physical branch and Cashiers to resolve name)
  const fetchOutlets = useCallback(async () => {
    if (!tenantId) return;
    setIsLoadingOutlets(true);
    try {
      const data = await outletService.getOutlets(tenantId);
      const activeOutlets = data.filter((o) => o.isActive);
      setOutlets(activeOutlets);
      if (role === 'owner') {
        if (activeOutlets.length > 0) {
          setSelectedOutletId(activeOutlets[0].id);
        }
      } else if (role === 'cashier' && cashierOutletId) {
        setSelectedOutletId(cashierOutletId);
      }
    } catch (err) {
      showToast('Gagal memuat daftar cabang.', 'error');
    } finally {
      setIsLoadingOutlets(false);
    }
  }, [tenantId, role, cashierOutletId, showToast]);

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
      showToast('Gagal memuat katalog produk.', 'error');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [tenantId, showToast]);

  // Initial loading effects
  useEffect(() => {
    if (tenantId) {
      fetchProducts();
      fetchOutlets();
    }
  }, [tenantId, fetchProducts, fetchOutlets]);

  // Sync selectedOutletId with activeShift.outletId if a shift is active
  useEffect(() => {
    if (activeShift && role === 'owner') {
      setSelectedOutletId(activeShift.outletId);
    }
  }, [activeShift, role]);

  // Set the final active outletId
  const activeOutletId = useMemo(() => {
    if (activeShift) return activeShift.outletId;
    if (role === 'cashier') return cashierOutletId ?? '';
    return selectedOutletId;
  }, [activeShift, role, cashierOutletId, selectedOutletId]);

  // Get active outlet details
  const activeOutletName = useMemo(() => {
    const targetId = activeOutletId;
    const match = outlets.find((o) => o.id === targetId);
    return match ? match.name : (role === 'cashier' ? 'Cabang Ditugaskan' : 'Pilih Cabang');
  }, [activeOutletId, outlets, role]);

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
      showToast(`${product.name} sedang habis.`, 'warning');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Tidak dapat menambahkan lagi. Batas stok ${product.stock} tercapai.`, 'warning');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      showToast(`${product.name} ditambahkan ke keranjang!`, 'success');
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
        showToast(`Batas maksimum stok tercapai: ${maxStock} produk.`, 'warning');
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
    showToast('Produk dihapus dari keranjang.', 'info');
  };

  // Cart total calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const discountVal = useMemo(() => {
    return Math.min(cartSubtotal, Math.max(0, discount));
  }, [cartSubtotal, discount]);

  const taxRate = useMemo(() => {
    return taxType === 'PPN11' ? 0.11 : 0;
  }, [taxType]);

  const afterDiscount = useMemo(() => {
    return cartSubtotal - discountVal;
  }, [cartSubtotal, discountVal]);

  const taxAmount = useMemo(() => {
    return Math.round(afterDiscount * taxRate);
  }, [afterDiscount, taxRate]);

  const cartTotal = useMemo(() => {
    return afterDiscount + taxAmount + shippingCost;
  }, [afterDiscount, taxAmount, shippingCost]);

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
      showToast('Keranjang belanja kosong!', 'warning');
      return;
    }

    if (!activeOutletId) {
      showToast('Silakan pilih cabang outlet terlebih dahulu.', 'warning');
      return;
    }

    if (!activeShift) {
      showToast('Shift kerja tidak aktif. Silakan buka shift terlebih dahulu.', 'warning');
      return;
    }

    setIsCheckingOut(true);
    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const displayName = user?.displayName || user?.email || 'Kasir';

      const res = await posService.processTransaction({
        items: itemsPayload,
        outletId: activeOutletId,
        customerName: customerName.trim(),
        discount: discountVal,
        taxRate: taxType === 'PPN11' ? 11 : 0,
        paymentMethod: paymentMethod,
        shippingCost: shippingCost,
        outletName: activeOutletName,
        cashierName: displayName,
        shiftId: activeShift.id,
      });

      // Create a completed transaction object for printing
      const tempTx: Transaction = {
        id: res.transactionId,
        tenantId: tenantId || '',
        outletId: activeOutletId,
        cashierId: user?.uid || '',
        customerName: customerName.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        subtotal: cartSubtotal,
        discount: discountVal,
        taxRate: taxType === 'PPN11' ? 11 : 0,
        taxAmount: taxAmount,
        shippingCost: shippingCost,
        totalAmount: res.totalAmount,
        paymentMethod: paymentMethod,
        createdAt: { toDate: () => new Date() } as any,
        outletName: activeOutletName,
        cashierName: displayName,
        shiftId: activeShift.id,
      };
      setCompletedTx(tempTx);

      // Show success modal
      setCheckoutResult({
        show: true,
        transactionId: res.transactionId,
        totalAmount: res.totalAmount,
      });

      // Reset cart, inputs, and refresh product stocks
      setCart([]);
      setCustomerName('');
      setDiscount(0);
      setTaxType('NONE');
      setPaymentMethod('Cash');
      setShippingCost(0);
      setIsCartOpen(false);
      fetchProducts();
      
      // Refresh active shift stats to reflect the new transaction
      if (tenantId && user?.uid) {
        useShiftStore.getState().fetchActiveShift(tenantId, user.uid).catch(console.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Transaksi pembayaran gagal.', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Helper render to avoid duplicate layout markup
  const renderCartContent = (isMobile: boolean = false) => {
    return (
      <div className={`flex flex-col h-full overflow-hidden ${isMobile ? 'w-full' : ''}`}>
        {/* Shopping Cart Header - Hidden on mobile */}
        {!isMobile && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                <ShoppingCart className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-md font-bold text-slate-900">Pesanan Saat Ini</h2>
                <p className="text-xs text-slate-400">{cartTotalItems} item terpilih</p>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCart([]);
                  showToast('Keranjang belanja berhasil dikosongkan.', 'info');
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
              >
                Kosongkan
              </button>
            )}
          </div>
        )}

        {/* Shopping Cart List */}
        <div className="flex-1 overflow-y-auto pr-1 shrink-0 py-2">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">Keranjang belanja kosong.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Pilih produk dari katalog untuk menambahkan ke keranjang.
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
                        <span className="w-8 text-center text-xs font-bold text-slate-800">
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
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition shrink-0"
                        title="Hapus produk"
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

        {/* Custom Form Fields inside Cart component */}
        {cart.length > 0 && (
          <div className="my-4 border-y border-slate-100 py-4 space-y-4 shrink-0 font-sans">
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">Nama Pelanggan (Opsional)</label>
              <input
                type="text"
                placeholder="Masukkan nama pelanggan..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Diskon (Rp)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Rp0"
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDiscount(isNaN(val) ? 0 : val);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Pajak</label>
                <select
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-750 font-bold outline-none transition hover:border-slate-350 cursor-pointer"
                >
                  <option value="NONE">Tanpa Pajak</option>
                  <option value="PPN11">PPN 11%</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">Ongkos Kirim (Opsional)</label>
              <input
                type="number"
                min="0"
                placeholder="Rp0"
                value={shippingCost === 0 ? '' : shippingCost}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setShippingCost(isNaN(val) ? 0 : val);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                    paymentMethod === 'Cash'
                      ? 'bg-slate-950 text-white border-slate-950 shadow-md scale-[1.01]'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'bg-slate-950 text-white border-slate-950 shadow-md scale-[1.01]'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <span>QRIS</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Billing breakdown and Checkout Button */}
        <div className="border-t border-slate-100 pt-4 shrink-0 space-y-4">
          <div className="space-y-1.5 text-sm font-semibold">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Subtotal Produk</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>

            {discountVal > 0 && (
              <div className="flex items-center justify-between text-rose-600 text-xs font-bold animate-fadeIn">
                <span>Diskon</span>
                <span>-{formatPrice(discountVal)}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Pajak (PPN 11%)</span>
                <span>{formatPrice(taxAmount)}</span>
              </div>
            )}

            {shippingCost > 0 && (
              <div className="flex items-center justify-between text-slate-500 text-xs animate-fadeIn">
                <span>Ongkos Kirim</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Biaya Transaksi</span>
              <span>Rp0</span>
            </div>
            
            <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-md font-bold text-slate-900">
              <span>Total Tagihan</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isCheckingOut || cart.length === 0 || !activeOutletId}
            className="flex w-full items-center justify-center rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-slate-950/20 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-slate-950/10"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses Transaksi...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Proses Pembayaran ({formatPrice(cartTotal)})
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user?.uid) {
      showToast('Autentikasi tidak valid.', 'error');
      return;
    }
    if (!activeOutletId) {
      showToast('Silakan pilih cabang terlebih dahulu.', 'warning');
      return;
    }
    const val = parseFloat(startingCashInput);
    if (isNaN(val) || val < 0) {
      showToast('Modal awal harus berupa angka positif.', 'warning');
      return;
    }

    setIsOpeningShift(true);
    try {
      const displayName = user.displayName || user.email || 'Kasir';
      const shiftCashierName = role === 'owner' ? `${displayName} (Owner)` : displayName;

      await openShift(tenantId, {
        cashierId: user.uid,
        cashierName: shiftCashierName,
        outletId: activeOutletId,
        startingCash: val,
      });
      showToast('Shift kerja berhasil dibuka!', 'success');
      setStartingCashInput('');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Gagal membuka shift baru.', 'error');
    } finally {
      setIsOpeningShift(false);
    }
  };

  if (isLoadingShift) {
    return (
      <div className="flex h-[calc(100vh-6.5rem)] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
          <p className="text-sm font-medium text-slate-500 font-sans animate-pulse">Memeriksa status shift kerja...</p>
        </div>
      </div>
    );
  }

  if (!activeShift) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-slate-50 px-4 py-8 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-800 mb-4">
            <Store className="h-7 w-7 animate-pulse" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 text-center">Buka Shift Kerja</h2>
          <p className="text-xs text-slate-400 mt-1 text-center font-medium">
            Mulai registrasi transaksi dengan memasukkan modal kas awal
          </p>

          <form onSubmit={handleOpenShift} className="mt-6 space-y-4">
            {role === 'owner' && outlets.length > 1 ? (
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  Cabang Outlet <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    disabled={isLoadingOutlets}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 font-bold outline-none transition focus:border-slate-450 cursor-pointer"
                  >
                    {isLoadingOutlets ? (
                      <option>Memuat cabang...</option>
                    ) : outlets.length === 0 ? (
                      <option value="">Tidak ada cabang aktif</option>
                    ) : (
                      outlets.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cabang Bertugas</p>
                <p className="text-sm font-extrabold text-slate-800 mt-0.5">{activeOutletName}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                Modal Awal Kasir (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-450">Rp</span>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Masukkan modal awal di laci..."
                  value={startingCashInput}
                  onChange={(e) => setStartingCashInput(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-450 focus:bg-white font-extrabold"
                />
              </div>
            </div>

            {startingCashInput !== '' && (
              <div className="rounded-2xl bg-emerald-50/20 border border-emerald-100 p-3 text-center text-xs font-bold text-emerald-800">
                Konfirmasi Modal Awal: <span className="font-black">{formatPrice(parseFloat(startingCashInput) || 0)}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isOpeningShift || !activeOutletId}
              className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-850 focus:outline-none disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
            >
              {isOpeningShift ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Membuka Shift...
                </>
              ) : (
                'Buka Shift Sekarang'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl font-sans">
              Register Kasir POS
            </h1>
            <p className="text-sm text-slate-500 font-sans">
              Pilih item, sesuaikan jumlah, dan catat transaksi checkout secara aman.
            </p>
          </div>
          
          {/* Owner-facing physical branch selection */}
          {role === 'owner' && outlets.length > 1 ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm shrink-0">
              <Store className="h-4.5 w-4.5 text-slate-500" />
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                disabled={isLoadingOutlets || !!activeShift}
                className="bg-transparent text-sm text-slate-700 outline-none cursor-pointer font-bold disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoadingOutlets ? (
                  <option>Memuat cabang...</option>
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
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shrink-0 shadow-sm font-sans">
              <Store className="h-3.5 w-3.5" />
              <span>CABANG: {activeOutletName}</span>
            </div>
          )}
        </div>

        {/* Search and Category Filter Card */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div className="relative flex-1 font-sans">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk berdasarkan nama menu, kode SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white font-semibold"
            />
          </div>
          <div className="flex items-center space-x-2 shrink-0 font-sans">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50/50 text-slate-400">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition hover:border-slate-300 cursor-pointer font-bold"
            >
              {categoriesList.map((category) => (
                <option key={category} value={category}>
                  {category === 'ALL' ? 'Semua Kategori' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid Catalog */}
        <div className="flex-1 overflow-y-auto pr-1 pb-16 lg:pb-0 font-sans">
          {isLoadingProducts ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-white border border-slate-100" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <Wallet className="h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-md font-bold text-slate-800">Produk Tidak Tersedia</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Tidak ada produk yang cocok dengan pencarian atau filter kategori Anda.
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
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
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
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Harga</p>
                        <p className="text-sm font-black text-slate-900 group-hover:text-slate-950">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        {isOutOfStock ? (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-600 border border-rose-100">
                            Habis
                          </span>
                        ) : product.stock <= 5 ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-600 border border-amber-100 animate-pulse">
                            sisa {product.stock}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            Stok: {product.stock}
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

      {/* RIGHT COLUMN: Shopping Cart Panel - Hidden on mobile, flex on desktop/tablet landscape */}
      <div className="hidden lg:flex w-full flex-col gap-4 border-t border-slate-200 bg-white p-4 shadow-xl lg:w-96 lg:rounded-3xl lg:border lg:border-slate-100 lg:p-6 lg:shadow-md shrink-0 h-full overflow-hidden font-sans">
        {renderCartContent()}
      </div>

      {/* Mobile Sticky Bottom FAB */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden font-sans">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg active:scale-98 transition focus:outline-none"
          >
            <ShoppingCart className="h-4.5 w-4.5 text-emerald-400 animate-bounce" />
            <span>Lihat Keranjang ({cartTotalItems}) - {formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Mobile Cart Modal Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-white p-4 shrink-0 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <ShoppingCart className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-md font-bold text-slate-900 font-sans">Pesanan Saat Ini</h2>
                  <p className="text-xs text-slate-400 font-sans">{cartTotalItems} item terpilih</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-sm"
              >
                <X className="h-4 w-4" />
                Tutup
              </button>
            </div>

            {/* Modal Body (Scrollable Cart) */}
            <div className="flex-1 overflow-y-auto bg-white p-4">
              {renderCartContent(true)}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Success Modal Dialog */}
      <AnimatePresence>
        {checkoutResult && checkoutResult.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            
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

              <h2 className="text-xl font-bold text-slate-900 font-sans">Transaksi Berhasil!</h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Transaksi penjualan Anda telah berhasil dicatat dalam pembukuan Firestore.
              </p>

              {/* Receipt details */}
              <div className="my-5 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-left font-sans">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2 font-bold text-slate-800 text-xs">
                  <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-slate-500" /> ID Struk</span>
                  <span className="font-mono text-slate-600 truncate max-w-[150px]">{checkoutResult.transactionId}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-550">
                  <span>Nama Cabang</span>
                  <span className="text-slate-900 font-bold">{activeOutletName}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-550 mt-1 font-sans">
                  <span>Total Tagihan</span>
                  <span className="font-black text-slate-900 text-sm">{formatPrice(checkoutResult.totalAmount)}</span>
                </div>
              </div>

              {/* Print and Close buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (completedTx) {
                      setIsReceiptPrintOpen(true);
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cetak Struk
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutResult(null)}
                  className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-850"
                >
                  Tutup Layar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Print Modal Dialog */}
      {isReceiptPrintOpen && completedTx && (
        <ReceiptPrint
          isOpen={isReceiptPrintOpen}
          onClose={() => setIsReceiptPrintOpen(false)}
          transaction={completedTx}
          cashierName={completedTx.cashierName || user?.displayName || user?.email || 'Kasir'}
          outletName={activeOutletName}
        />
      )}
    </div>
  );
}
