'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  HelpCircle,
  TrendingUp,
  Percent,
  DollarSign,
  ArrowRight,
  ChevronRight,
  Info,
  Store,
  Check,
  RotateCcw,
  Sparkles,
  Calculator,
  ChefHat,
  ArrowLeft,
  DollarSign as RupiahIcon,
  ShoppingBag
} from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  purchasePrice: number;
  purchaseQty: number;
  unit: string;
  usedQty: number;
}

type PresetRecipe = {
  name: string;
  category: string;
  ingredients: Ingredient[];
  overheadType: 'flat' | 'percent';
  overheadValue: number;
  targetMargin: number;
};

const PRESETS: Record<string, PresetRecipe> = {
  nasi_goreng: {
    name: 'Nasi Goreng Ayam Spesial',
    category: 'Makanan',
    ingredients: [
      { id: '1', name: 'Nasi Putih', purchasePrice: 12000, purchaseQty: 1000, unit: 'g', usedQty: 250 },
      { id: '2', name: 'Daging Ayam Suwir', purchasePrice: 42000, purchaseQty: 1000, unit: 'g', usedQty: 50 },
      { id: '3', name: 'Telur Ayam (1 butir)', purchasePrice: 28000, purchaseQty: 1000, unit: 'g', usedQty: 60 },
      { id: '4', name: 'Minyak Goreng', purchasePrice: 16000, purchaseQty: 1000, unit: 'ml', usedQty: 15 },
      { id: '5', name: 'Bumbu Racik & Kecap', purchasePrice: 15000, purchaseQty: 500, unit: 'g', usedQty: 20 },
      { id: '6', name: 'Margarin & Garnish', purchasePrice: 10000, purchaseQty: 200, unit: 'g', usedQty: 10 },
    ],
    overheadType: 'flat',
    overheadValue: 1500,
    targetMargin: 60,
  },
  kopi_susu: {
    name: 'Kopi Susu Gula Aren',
    category: 'Minuman',
    ingredients: [
      { id: '1', name: 'Biji Kopi Arabika', purchasePrice: 140000, purchaseQty: 1000, unit: 'g', usedQty: 18 },
      { id: '2', name: 'Fresh Milk UHT', purchasePrice: 22000, purchaseQty: 1000, unit: 'ml', usedQty: 120 },
      { id: '3', name: 'Sirup Gula Aren', purchasePrice: 30000, purchaseQty: 1000, unit: 'ml', usedQty: 20 },
      { id: '4', name: 'Cup Plastik & Sedotan', purchasePrice: 850, purchaseQty: 1, unit: 'pcs', usedQty: 1 },
      { id: '5', name: 'Es Batu', purchasePrice: 8000, purchaseQty: 1000, unit: 'g', usedQty: 150 },
    ],
    overheadType: 'percent',
    overheadValue: 10,
    targetMargin: 65,
  },
  roti_bakar: {
    name: 'Roti Bakar Cokelat Keju',
    category: 'Camilan',
    ingredients: [
      { id: '1', name: 'Roti Bandung (1 pack)', purchasePrice: 12000, purchaseQty: 4, unit: 'porsi', usedQty: 1 },
      { id: '2', name: 'Keju Cheddar Parut', purchasePrice: 24000, purchaseQty: 165, unit: 'g', usedQty: 25 },
      { id: '3', name: 'Meses Cokelat', purchasePrice: 16000, purchaseQty: 250, unit: 'g', usedQty: 20 },
      { id: '4', name: 'Susu Kental Manis', purchasePrice: 13000, purchaseQty: 370, unit: 'g', usedQty: 15 },
      { id: '5', name: 'Mentega / Margarin', purchasePrice: 9000, purchaseQty: 200, unit: 'g', usedQty: 15 },
    ],
    overheadType: 'flat',
    overheadValue: 1000,
    targetMargin: 50,
  }
};

const COMMON_UNITS = ['g', 'kg', 'ml', 'L', 'pcs', 'butir', 'sendok', 'porsi'];

export default function HppCalculatorClient() {
  const [activePreset, setActivePreset] = useState<string>('nasi_goreng');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [overheadType, setOverheadType] = useState<'flat' | 'percent'>('flat');
  const [overheadValue, setOverheadValue] = useState<number>(0);
  const [targetMargin, setTargetMargin] = useState<number>(60);
  const [isClient, setIsClient] = useState(false);

  // Hydration safety
  useEffect(() => {
    setIsClient(true);
    loadPreset('nasi_goreng');
  }, []);

  const loadPreset = (key: string) => {
    if (key === 'custom') {
      setIngredients([]);
      setOverheadType('flat');
      setOverheadValue(0);
      setTargetMargin(50);
      setActivePreset('custom');
      return;
    }

    const recipe = PRESETS[key];
    if (recipe) {
      // Deep clone ingredients to prevent mutation of static presets
      setIngredients(recipe.ingredients.map(ing => ({ ...ing })));
      setOverheadType(recipe.overheadType);
      setOverheadValue(recipe.overheadValue);
      setTargetMargin(recipe.targetMargin);
      setActivePreset(key);
    }
  };

  const handleAddIngredient = () => {
    const newIng: Ingredient = {
      id: Math.random().toString(36).substring(2, 9),
      name: '',
      purchasePrice: 0,
      purchaseQty: 1000,
      unit: 'g',
      usedQty: 0
    };
    setIngredients([...ingredients, newIng]);
    setActivePreset('custom');
  };

  const handleUpdateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
    setIngredients(prev =>
      prev.map(ing => {
        if (ing.id === id) {
          const updated = { ...ing, [field]: value };
          return updated;
        }
        return ing;
      })
    );
    setActivePreset('custom');
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
    setActivePreset('custom');
  };

  const handleReset = () => {
    loadPreset(activePreset === 'custom' ? 'nasi_goreng' : activePreset);
  };

  // Calculations
  const calculations = useMemo(() => {
    const totalIngredientsCost = ingredients.reduce((sum, ing) => {
      const denom = ing.purchaseQty <= 0 ? 1 : ing.purchaseQty;
      const itemCost = (ing.purchasePrice / denom) * ing.usedQty;
      return sum + itemCost;
    }, 0);

    const overheadCost = overheadType === 'percent'
      ? totalIngredientsCost * (overheadValue / 100)
      : overheadValue;

    const totalHpp = totalIngredientsCost + overheadCost;
    
    // SP = Cost / (1 - Margin/100)
    const marginFactor = 1 - (targetMargin / 100);
    const recommendedPrice = marginFactor > 0 ? totalHpp / marginFactor : totalHpp;
    const netProfit = recommendedPrice - totalHpp;

    return {
      totalIngredientsCost,
      overheadCost,
      totalHpp,
      recommendedPrice,
      netProfit
    };
  }, [ingredients, overheadType, overheadValue, targetMargin]);

  const formatIDR = (val: number) => {
    if (isNaN(val)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Feedback based on margins
  const marginFeedback = useMemo(() => {
    if (targetMargin < 30) {
      return {
        text: 'Margin sangat tipis!',
        desc: 'Berisiko merugi jika bahan baku mendadak naik. Disarankan naikkan ke minimal 40%.',
        color: 'text-rose-600 bg-rose-50 border-rose-100',
        score: 'Rendah'
      };
    } else if (targetMargin >= 30 && targetMargin <= 50) {
      return {
        text: 'Margin Standar Kuliner',
        desc: 'Cocok untuk model warung, katering porsi besar, atau fast-moving foods.',
        color: 'text-amber-650 bg-amber-50 border-amber-100',
        score: 'Ideal'
      };
    } else if (targetMargin > 50 && targetMargin <= 70) {
      return {
        text: 'Margin Sehat & Premium',
        desc: 'Sangat ideal untuk kafe, coffee shop, & restoran. Aman dari fluktuasi bahan baku.',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
        score: 'Sangat Baik'
      };
    } else {
      return {
        text: 'Margin Super Tinggi',
        desc: 'Pastikan nilai produk (brand value / rasa / ambience) sebanding dengan harga jual premium.',
        color: 'text-indigo-700 bg-indigo-50 border-indigo-100',
        score: 'Maksimal'
      };
    }
  }, [targetMargin]);

  // Breakdown percentages
  const percentages = useMemo(() => {
    const total = calculations.recommendedPrice || 1;
    const ingredientsPct = (calculations.totalIngredientsCost / total) * 100;
    const overheadPct = (calculations.overheadCost / total) * 100;
    const profitPct = (calculations.netProfit / total) * 100;
    
    return {
      ingredients: Math.round(ingredientsPct),
      overhead: Math.round(overheadPct),
      profit: Math.round(profitPct),
    };
  }, [calculations]);

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen selection:bg-indigo-500 selection:text-white overflow-x-hidden flex flex-col">
      {/* FLOATING HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-50/80 border-b border-slate-200/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link prefetch={false} href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-linear-to-r from-slate-900 to-indigo-950">
                Usahaku<span className="text-indigo-600">POS</span>
              </span>
            </Link>

            {/* Back Link */}
            <div className="flex items-center gap-4">
              <Link prefetch={false}
                href="/"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Beranda
              </Link>
              <Link prefetch={false}
                href="/register"
                className="hidden sm:inline-flex text-xs font-bold text-white bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-2 rounded-lg shadow-md shadow-indigo-500/10 transition-all"
              >
                Daftar Gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-8 overflow-hidden bg-slate-900 text-white">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-4">
            <Calculator className="w-4 h-4 animate-pulse" />
            Programmatic SEO / Culinary Pricing Suite
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4 max-w-4xl mx-auto">
            Kalkulator HPP & Simulasi <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-400 via-violet-300 to-indigo-300">
              Harga Jual Kuliner Gratis
            </span>
          </h1>
          
          <p className="text-sm sm:text-base text-slate-350 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Kalkulasikan Harga Pokok Penjualan (HPP) resep menu Anda, tambahkan buffer operasional overhead, serta simulasikan harga jual ideal berdasarkan margin target Anda dalam hitungan detik.
          </p>

          {/* Preset Selector */}
          <div className="max-w-3xl mx-auto bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/50 flex flex-wrap gap-1 justify-center">
            <button
              onClick={() => loadPreset('nasi_goreng')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activePreset === 'nasi_goreng'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              🍜 <span className="line-clamp-1">Nasi Goreng Spesial</span>
            </button>
            <button
              onClick={() => loadPreset('kopi_susu')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activePreset === 'kopi_susu'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              ☕ <span className="line-clamp-1">Kopi Susu Gula Aren</span>
            </button>
            <button
              onClick={() => loadPreset('roti_bakar')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activePreset === 'roti_bakar'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              🍞 <span className="line-clamp-1">Roti Bakar Cokelat Keju</span>
            </button>
            <button
              onClick={() => loadPreset('custom')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activePreset === 'custom'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-violet-300 border border-violet-500/20 hover:bg-violet-950/20 hover:text-white'
              }`}
            >
              ✨ <span>Resep Baru (Kustom)</span>
            </button>
          </div>
        </div>
      </section>

      {/* CALCULATOR MAIN AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {isClient ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: INPUTS (8/12) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              
              {/* CARD 1: INGREDIENTS LIST */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-indigo-600" />
                      Langkah 1: Komposisi Bahan Baku Resep
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Masukkan takaran bahan mentah beserta harga pembelian grosirnya.</p>
                  </div>
                  <button
                    onClick={handleAddIngredient}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-150 text-indigo-650 font-bold text-xs sm:text-sm rounded-xl transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Bahan
                  </button>
                </div>

                {ingredients.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h5 className="font-bold text-slate-700 text-sm">Resep belum diisi bahan baku</h5>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Mulai dengan menambahkan bahan mentah, atau klik salah satu preset resep makanan/minuman populer di atas.</p>
                    <button
                      onClick={handleAddIngredient}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah Bahan Pertama
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header Columns labels (Desktop) */}
                    <div className="hidden md:grid grid-cols-12 gap-3 text-[10px] font-black tracking-widest text-slate-400 uppercase px-2 mb-1">
                      <div className="col-span-4">Nama Bahan Baku</div>
                      <div className="col-span-3">Harga Beli Grosir</div>
                      <div className="col-span-2">Takaran Beli</div>
                      <div className="col-span-2">Dipakai Resep</div>
                      <div className="col-span-1 text-right">Biaya</div>
                    </div>

                    {/* Ingredient rows */}
                    <div className="divide-y divide-slate-100 space-y-4 md:space-y-0">
                      {ingredients.map((ing) => {
                        const calculatedCost = (ing.purchasePrice / (ing.purchaseQty || 1)) * ing.usedQty;
                        return (
                          <div
                            key={ing.id}
                            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center py-4 md:py-2.5 px-0 md:px-2 hover:bg-slate-50/55 rounded-xl transition-colors"
                          >
                            {/* 1. Name */}
                            <div className="col-span-1 md:col-span-4">
                              <label className="block md:hidden text-[10px] font-black text-slate-400 uppercase mb-1">Nama Bahan</label>
                              <input
                                type="text"
                                placeholder="Contoh: Nasi Putih"
                                value={ing.name}
                                onChange={(e) => handleUpdateIngredient(ing.id, 'name', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-colors"
                              />
                            </div>

                            {/* 2. Purchase Price */}
                            <div className="col-span-1 md:col-span-3">
                              <label className="block md:hidden text-[10px] font-black text-slate-400 uppercase mb-1">Harga Beli Grosir</label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-450 text-xs sm:text-sm font-bold pointer-events-none select-none">Rp</span>
                                <input
                                  type="number"
                                  placeholder="0"
                                  min="0"
                                  value={ing.purchasePrice || ''}
                                  onChange={(e) => handleUpdateIngredient(ing.id, 'purchasePrice', Math.max(0, parseFloat(e.target.value) || 0))}
                                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm font-semibold transition-colors"
                                />
                              </div>
                            </div>

                            {/* 3. Purchase Qty & Unit */}
                            <div className="col-span-1 md:col-span-2">
                              <label className="block md:hidden text-[10px] font-black text-slate-400 uppercase mb-1">Takaran Beli</label>
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  placeholder="1000"
                                  min="1"
                                  value={ing.purchaseQty || ''}
                                  onChange={(e) => handleUpdateIngredient(ing.id, 'purchaseQty', Math.max(1, parseFloat(e.target.value) || 1))}
                                  className="w-2/3 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2 py-2 text-xs sm:text-sm font-semibold transition-colors"
                                />
                                <select
                                  value={ing.unit}
                                  onChange={(e) => handleUpdateIngredient(ing.id, 'unit', e.target.value)}
                                  className="w-1/3 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-1 py-2 text-[10px] sm:text-xs font-bold transition-colors"
                                >
                                  {COMMON_UNITS.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* 4. Used Qty */}
                            <div className="col-span-1 md:col-span-2">
                              <label className="block md:hidden text-[10px] font-black text-slate-400 uppercase mb-1">Dipakai Resep ({ing.unit})</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  placeholder="50"
                                  min="0"
                                  value={ing.usedQty || ''}
                                  onChange={(e) => handleUpdateIngredient(ing.id, 'usedQty', Math.max(0, parseFloat(e.target.value) || 0))}
                                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pr-12 pl-3 py-2 text-xs sm:text-sm font-semibold transition-colors"
                                />
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-[10px] font-bold pointer-events-none select-none">{ing.unit}</span>
                              </div>
                            </div>

                            {/* 5. Proportional Cost & Actions */}
                            <div className="col-span-1 md:col-span-1 flex md:flex-col items-center justify-between md:items-end gap-2 pt-2 md:pt-0">
                              <div className="block md:hidden text-[10px] font-black text-slate-400 uppercase">Proportional Cost</div>
                              <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{formatIDR(calculatedCost)}</span>
                              <button
                                onClick={() => handleRemoveIngredient(ing.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                title="Hapus bahan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 2: OVERHEAD COST BUFFER */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <div className="flex justify-between items-start border-b border-slate-100 pb-5 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-indigo-600" />
                      Langkah 2: Biaya Overhead & Kemasan (Operational Buffer)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Masukkan beban tambahan per porsi seperti listrik, gas, air, serta wadah/kemasan takeaway.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Tipe Overhead</label>
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/50">
                      <button
                        type="button"
                        onClick={() => { setOverheadType('flat'); setOverheadValue(0); setActivePreset('custom'); }}
                        className={`w-1/2 py-2 text-xs font-bold rounded-lg transition-all ${
                          overheadType === 'flat'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Nominal Flat (IDR)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOverheadType('percent'); setOverheadValue(0); setActivePreset('custom'); }}
                        className={`w-1/2 py-2 text-xs font-bold rounded-lg transition-all ${
                          overheadType === 'percent'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Persentase Bahan Baku (%)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                      {overheadType === 'flat' ? 'Besaran Nominal Overhead' : 'Persentase Overhead'}
                    </label>
                    <div className="relative">
                      {overheadType === 'flat' && (
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs sm:text-sm font-bold pointer-events-none select-none">Rp</span>
                      )}
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={overheadValue || ''}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setOverheadValue(overheadType === 'percent' ? Math.min(100, val) : val);
                          setActivePreset('custom');
                        }}
                        className={`w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                          overheadType === 'flat' ? 'pl-9' : 'pr-9'
                        }`}
                      />
                      {overheadType === 'percent' && (
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs sm:text-sm font-bold pointer-events-none select-none">%</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex gap-2 items-start text-xs text-slate-550 leading-relaxed">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-slate-700">Tips Operasional: </span>
                    Jika Anda berjualan online (Gofood/Grabfood/Shopeefood), Anda bisa menyuntikkan komisi aplikasi (biasanya 20%) di bagian overhead ini untuk mensimulasikan margin bersih sesungguhnya!
                  </div>
                </div>
              </div>

              {/* CARD 3: PROFIT MARGIN SLIDER */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <div className="flex justify-between items-start border-b border-slate-100 pb-5 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      Langkah 3: Target Gross Profit Margin (%)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Gunakan slider untuk menentukan persentase keuntungan kotor dari harga jual.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">Batas Margin</span>
                    <span className="text-2xl font-black text-indigo-600 tracking-tight">{targetMargin}%</span>
                  </div>

                  <div className="relative pt-1">
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={targetMargin}
                      onChange={(e) => { setTargetMargin(parseInt(e.target.value)); setActivePreset('custom'); }}
                      className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 mt-2">
                      <span>10% (Murah)</span>
                      <span>50% (Ideal)</span>
                      <span>90% (Premium)</span>
                    </div>
                  </div>

                  {/* Preset Margin snaps */}
                  <div className="flex flex-wrap gap-2 pt-2 justify-center">
                    {[30, 40, 50, 60, 70].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setTargetMargin(m); setActivePreset('custom'); }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                          targetMargin === m
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {m}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: REAL-TIME SUMMARY & VISUAL CHARTS (4/12) */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-6">
              
              {/* PRIMARY RESULTS CARD */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
                {/* Glow ring */}
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-indigo-500/10 blur-[60px] pointer-events-none" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h4 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" /> Hasil Rekomendasi
                    </h4>
                    {ingredients.length > 0 && (
                      <button
                        onClick={handleReset}
                        className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 hover:underline transition-all"
                        title="Reset resep ke default preset"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>

                  {/* Highlight 1: Total HPP */}
                  <div className="space-y-1">
                    <span className="text-xs text-slate-450 font-bold flex items-center gap-1">
                      Total Cost / HPP per Serving
                      <span className="group relative cursor-help">
                        <Info className="w-3.5 h-3.5 text-slate-500" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 bg-slate-950 text-[10px] font-semibold text-slate-300 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 leading-normal">
                          Total biaya bahan baku ditambah operational buffer per porsi.
                        </span>
                      </span>
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-indigo-300 tracking-tight">
                      {formatIDR(calculations.totalHpp)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold space-x-2">
                      <span>Bahan Baku: {formatIDR(calculations.totalIngredientsCost)}</span>
                      <span>•</span>
                      <span>Overhead: {formatIDR(calculations.overheadCost)}</span>
                    </div>
                  </div>

                  {/* Highlight 2: Recommended Selling Price */}
                  <div className="space-y-1 pt-3 border-t border-slate-800/80">
                    <span className="text-xs text-slate-450 font-bold">Rekomendasi Harga Jual</span>
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight bg-clip-text bg-linear-to-r from-white via-indigo-100 to-indigo-200">
                      {formatIDR(calculations.recommendedPrice)}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal font-medium">
                      Harga jual ideal agar Anda meraih laba kotor sebesar <span className="text-indigo-400 font-black">{targetMargin}%</span>.
                    </p>
                  </div>

                  {/* Highlight 3: Net Profit Amount */}
                  <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 flex justify-between items-center gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Laba Kotor per Porsi</span>
                      <span className="text-lg font-black text-emerald-400 tracking-tight">{formatIDR(calculations.netProfit)}</span>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg text-xs font-black border border-emerald-500/20">
                      +{targetMargin}%
                    </div>
                  </div>

                  {/* STACKED BAR VISUAL CHART (Pure CSS Tailwind) */}
                  <div className="space-y-2.5 pt-2">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Struktur Pembentuk Harga</span>
                    
                    <div className="h-6 w-full bg-slate-800 rounded-lg overflow-hidden flex text-white text-[9px] font-black">
                      {percentages.ingredients > 0 && (
                        <div
                          style={{ width: `${percentages.ingredients}%` }}
                          className="bg-indigo-600 flex items-center justify-center min-w-[20px]"
                          title={`Bahan Baku: ${percentages.ingredients}%`}
                        >
                          {percentages.ingredients}%
                        </div>
                      )}
                      {percentages.overhead > 0 && (
                        <div
                          style={{ width: `${percentages.overhead}%` }}
                          className="bg-violet-400 flex items-center justify-center min-w-[15px]"
                          title={`Overhead: ${percentages.overhead}%`}
                        >
                          {percentages.overhead}%
                        </div>
                      )}
                      {percentages.profit > 0 && (
                        <div
                          style={{ width: `${percentages.profit}%` }}
                          className="bg-emerald-500 flex items-center justify-center min-w-[20px]"
                          title={`Laba: ${percentages.profit}%`}
                        >
                          {percentages.profit}%
                        </div>
                      )}
                    </div>

                    {/* Chart Legend */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-indigo-650 inline-block"></span> Bahan Baku ({percentages.ingredients}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-violet-400 inline-block"></span> Overhead ({percentages.overhead}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Margin ({percentages.profit}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MARGIN FEEDBACK CARD */}
              <div className={`p-5 rounded-3xl border transition-all ${marginFeedback.color}`}>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm">{marginFeedback.text}</span>
                      <span className="text-[9px] font-black tracking-wider uppercase border border-current px-1.5 py-0.5 rounded-md scale-90">
                        {marginFeedback.score}
                      </span>
                    </div>
                    <p className="text-xs mt-1.5 opacity-90 leading-relaxed font-semibold">
                      {marginFeedback.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* QUICK MATHEMATICS BOX */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs text-slate-600 text-xs leading-relaxed space-y-2">
                <h5 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-indigo-600" /> Rumus Kalkulasi Yang Digunakan
                </h5>
                <p>
                  HPP per porsi dihitung dengan menjumlahkan seluruh biaya bahan baku dikalikan volume resep, kemudian ditambah biaya operasional overhead (kemasan/gas).
                </p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 font-mono text-[9px] text-slate-800 space-y-1">
                  <div>• HPP = Total Bahan Baku + Biaya Overhead</div>
                  <div>• Harga Jual = HPP / (1 - Target Margin %)</div>
                  <div>• Laba Kotor = Harga Jual - HPP</div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        )}
      </main>

      {/* FREQUENTLY ASKED QUESTIONS SECTION */}
      <section className="py-16 bg-slate-100 border-t border-slate-200/60 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Edukasi Bisnis</h2>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pertanyaan Populer Tentang HPP Kuliner</h3>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
              <h5 className="font-bold text-slate-850 text-sm mb-1.5">Apa bedanya HPP (COGS) dan Harga Jual?</h5>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                HPP adalah total modal bersih (bahan baku, bumbu, kemasan) untuk membuat 1 porsi menu. Sedangkan Harga Jual adalah HPP yang sudah ditambahkan target persentase keuntungan (margin profit) agar Anda mendapatkan keuntungan kotor saat bertransaksi.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
              <h5 className="font-bold text-slate-850 text-sm mb-1.5">Berapa target margin keuntungan yang ideal untuk restoran atau cafe?</h5>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                Umumnya bisnis kuliner di Indonesia menggunakan target gross profit margin sebesar 50% hingga 70%. Untuk warung makan atau katering partai besar, margin 30% hingga 40% sudah sangat ideal. Margin ini penting untuk menutup biaya operasional lain seperti sewa tempat, gaji staf, dan marketing.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
              <h5 className="font-bold text-slate-850 text-sm mb-1.5">Mengapa saya harus menghitung HPP secara berkala?</h5>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                Harga bahan baku di pasar seperti minyak, telur, cabai, atau daging sangat fluktuatif. Jika harga beli naik namun harga jual menu Anda tetap sama, margin profit Anda akan tergerus habis (boncos). Usahaku POS mempermudah ini dengan melacak pergerakan HPP secara otomatis berbasis Stock Ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CONVERTING CTA BANNER */}
      <section className="bg-linear-to-tr from-indigo-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden py-16 text-center border-t border-slate-850">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] aspect-square rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
            Pantau Naik-Turun HPP Resep Secara Otomatis
          </h2>
          
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed font-semibold">
            Capek hitung HPP resep manual setiap harga bahan baku naik? Di Usahaku POS, semua pergerakan HPP, manajemen stok bahan baku (Stock Ledger), dan laporan laba-rugi otomatis rapi tanpa ribet Excel! Coba Gratis 30 Hari Tanpa Kartu Kredit.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link prefetch={false}
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-linear-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              Mulai 30-Hari Uji Coba Gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link prefetch={false}
              href="/"
              className="w-full sm:w-auto px-8 py-4 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold text-sm sm:text-base rounded-2xl transition-all"
            >
              Pelajari Fitur POS
            </Link>
          </div>

          <p className="text-[10px] text-slate-400 font-bold">
            ✓ Pendaftaran 1 Menit • Tanpa Kartu Kredit • Batal Kapan Saja
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Branding Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <Store className="w-4.5 h-4.5" />
                </div>
                <span className="font-extrabold text-lg text-white">UsahakuPOS</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Solusi digital pencatatan kasir dan analitik penjualan UMKM Indonesia. Ringan, handal, dan dapat diandalkan secara offline.
              </p>
            </div>

            {/* Links columns */}
            <div>
              <h6 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Aplikasi</h6>
              <ul className="space-y-2.5 text-xs">
                <li><Link prefetch={false} href="/#fitur" className="hover:text-white transition-colors">Fitur POS</Link></li>
                <li><Link prefetch={false} href="/#demo" className="hover:text-white transition-colors">Demo Simulator</Link></li>
                <li><Link prefetch={false} href="/#showcase" className="hover:text-white transition-colors">Tampilan Layar</Link></li>
              </ul>
            </div>

            <div>
              <h6 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Pengguna</h6>
              <ul className="space-y-2.5 text-xs">
                <li><Link prefetch={false} href="/login" className="hover:text-white transition-colors">Login Kasir / Owner</Link></li>
                <li><Link prefetch={false} href="/register" className="hover:text-white transition-colors">Daftar Akun Baru</Link></li>
                <li><a href="https://wa.me/6285117821129" className="hover:text-white transition-colors">Bantuan Teknis</a></li>
              </ul>
            </div>

            <div>
              <h6 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Legalitas</h6>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-550">
            <p>© {new Date().getFullYear()} Usahaku POS. Hak Cipta Dilindungi.</p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <a href="#" className="hover:text-slate-400">Instagram</a>
              <a href="#" className="hover:text-slate-400">Facebook</a>
              <a href="#" className="hover:text-slate-400">WhatsApp</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
