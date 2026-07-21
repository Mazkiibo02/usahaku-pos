'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Store, LogIn, Menu, X } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-50/80 border-b border-slate-200/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-linear-to-r from-slate-900 to-indigo-950">
              Usahaku<span className="text-indigo-600">POS</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#fitur" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Fitur Utama
            </a>
            <a href="#showcase" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Tampilan Layar
            </a>
            <Link href="/tools/kalkulator-hpp" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Kalkulator HPP
            </Link>
            <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Pertanyaan
            </a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-bold text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
            >
              <LogIn className="w-4 h-4" />
              Masuk
            </Link>
            <Link
              href="/register"
              className="text-sm font-bold text-white bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Daftar Sekarang
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 border-b border-slate-200 backdrop-blur-md absolute top-full left-0 w-full animate-fadeIn shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-3">
            <a
              href="#fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              Fitur Utama
            </a>
            <a
              href="#showcase"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              Tampilan Layar
            </a>
            <Link
              href="/tools/kalkulator-hpp"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              Kalkulator HPP
            </Link>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              Pertanyaan
            </a>
            <hr className="border-slate-100 my-2" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Masuk
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-colors text-center shadow-md shadow-indigo-500/10"
              >
                Daftar
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
