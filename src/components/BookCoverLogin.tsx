'use client';

import React, { useState } from 'react';
import { BookOpen, ArrowRight, Lock } from 'lucide-react';
import type { AppLanguage, BookSkinId } from '@/types/notebook';

interface BookCoverLoginProps {
  ownerName: string;
  ownerTagline: string;
  bookSkin: BookSkinId;
  language: AppLanguage;
  savedPin?: string;
  onOpenBook: () => void;
}

export default function BookCoverLogin({
  ownerName,
  ownerTagline,
  bookSkin,
  language,
  savedPin = '',
  onOpenBook,
}: BookCoverLoginProps) {
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const triggerOpenAnimation = () => {
    if (savedPin && pinInput.trim() !== savedPin.trim()) {
      setPinError(true);
      return;
    }
    setPinError(false);
    setIsOpening(true);
    setTimeout(() => {
      onOpenBook();
    }, 480);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerOpenAnimation();
  };

  return (
    <div
      data-skin={bookSkin}
      className="min-h-screen w-full flex items-center justify-center p-5 sm:p-8 overflow-hidden"
    >
      {/* SAMPUL BUKU FISIK TERTUTUP */}
      <div
        className={`closed-book-surface w-full max-w-[430px] min-h-[560px] sm:min-h-[600px] rounded-l-[14px] rounded-r-[24px] p-6 sm:p-8 relative flex flex-col justify-between text-[#FAF7EF] select-none ${
          isOpening ? 'animate-book-opening' : 'animate-spread-enter'
        }`}
      >
        {/* Tulang Punggung Buku & Lekuk Lipatan Kiri */}
        <div
          className="absolute inset-y-0 left-0 w-9 rounded-l-[12px] pointer-events-none flex flex-col justify-between py-10"
          style={{
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.34) 0%, rgba(255,255,255,0.09) 55%, rgba(0,0,0,0.22) 85%, rgba(255,255,255,0.06) 100%)',
            borderRight: '1px solid rgba(0,0,0,0.28)',
          }}
        >
          <span className="w-full h-1 bg-black/25 border-y border-white/10" />
          <span className="w-full h-1 bg-black/25 border-y border-white/10" />
          <span className="w-full h-1 bg-black/25 border-y border-white/10" />
          <span className="w-full h-1 bg-black/25 border-y border-white/10" />
        </div>

        {/* Pelindung Sudut Logam Kanan Atas & Kanan Bawah */}
        <span
          className="absolute top-0 right-0 w-7 h-7 rounded-tr-[22px] pointer-events-none"
          style={{
            borderTop: '3px solid var(--cover-accent)',
            borderRight: '3px solid var(--cover-accent)',
            opacity: 0.75,
          }}
        />
        <span
          className="absolute bottom-0 right-0 w-7 h-7 rounded-br-[22px] pointer-events-none"
          style={{
            borderBottom: '3px solid var(--cover-accent)',
            borderRight: '3px solid var(--cover-accent)',
            opacity: 0.75,
          }}
        />

        {/* Karet Pengikat Buku Vertikal di Sisi Kanan */}
        <div
          className="absolute inset-y-0 right-7 w-4 pointer-events-none"
          style={{
            backgroundColor: 'rgba(20, 18, 16, 0.62)',
            borderLeft: '1px solid rgba(255,255,255,0.12)',
            borderRight: '1px solid rgba(0,0,0,0.45)',
            boxShadow: '-3px 0 8px rgba(0,0,0,0.28)',
          }}
        />

        {/* Bagian Atas: Logo Emboss */}
        <div className="relative z-10 pl-7 pr-8 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold bg-black/25 text-[#FAF7EF]/90 border border-white/10 mb-4">
            <BookOpen className="w-3 h-3" style={{ color: 'var(--cover-accent)' }} />
            <span>Personal Pocket Edition</span>
          </div>

          <h1
            className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-none"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.32)',
            }}
          >
            Catata<span style={{ color: 'var(--cover-accent)' }}>.</span>
          </h1>
          <p className="text-[11px] uppercase tracking-[0.22em] mt-2 text-[#FAF7EF]/80 font-medium">
            {ownerTagline || 'Your Pocket. Your Space.'}
          </p>
        </div>

        {/* Bagian Tengah: Plakat Kertas Nama Pemilik Buku & Sapaan */}
        <div className="relative z-10 pl-7 pr-8 my-6">
          <div
            className="rounded-xl p-5 shadow-lg border relative"
            style={{
              backgroundColor: 'var(--warm-ivory)',
              color: 'var(--ink-black)',
              borderColor: 'var(--kraft-brown)',
            }}
          >
            {/* Bingkai Garis Tipis di Dalam Plakat Kertas */}
            <div
              className="absolute inset-1.5 rounded-lg pointer-events-none"
              style={{ border: '1px solid rgba(182, 154, 118, 0.35)' }}
            />

            <p
              className="text-[10px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: 'var(--soft-graphite)' }}
            >
              {language === 'id'
                ? 'Buku Saku Milik'
                : 'This Pocket Book Belongs To'}
            </p>
            <h2 className="font-display text-2xl font-bold mt-1">
              {ownerName || 'Ahmad S.'}
            </h2>
            <p
              className="font-note-content mt-2"
              style={{ color: 'var(--soft-graphite)' }}
            >
              {language === 'id'
                ? `Halo ${ownerName || 'Ahmad S.'}, semua catatan dan rencanamu tersimpan rapi di dalam.`
                : `Welcome back, ${ownerName || 'Ahmad S.'}. Your notes and plans are safely kept inside.`}
            </p>
          </div>
        </div>

        {/* Bagian Bawah: Input PIN (jika aktif) & Tombol Buka Buku */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 pl-7 pr-8 pb-2 space-y-3"
        >
          {savedPin && (
            <div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-[#FAF7EF]/70" />
                <input
                  type="password"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder={
                    language === 'id'
                      ? 'Masukkan PIN buku...'
                      : 'Enter notebook PIN...'
                  }
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl bg-black/25 border border-white/20 text-[#FAF7EF] placeholder:text-[#FAF7EF]/55 focus:outline-none"
                />
              </div>
              {pinError && (
                <p className="text-[11px] text-[#FFD2C9] mt-1">
                  {language === 'id'
                    ? 'PIN belum sesuai, silakan coba lagi.'
                    : 'Incorrect PIN, please try again.'}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isOpening}
            className="w-full py-3.5 px-5 rounded-xl font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: 'var(--warm-ivory)',
              color: 'var(--ink-black)',
            }}
          >
            <span>
              {isOpening
                ? language === 'id'
                  ? 'Membuka halaman...'
                  : 'Opening pages...'
                : language === 'id'
                ? 'Buka Buku Catatan'
                : 'Open Notebook'}
            </span>
            <ArrowRight
              className="w-4 h-4"
              style={{ color: 'var(--terracotta)' }}
            />
          </button>
        </form>
      </div>
    </div>
  );
}