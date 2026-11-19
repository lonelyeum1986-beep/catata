'use client';

import React, { useRef, useState } from 'react';
import {
  User,
  Globe,
  Type,
  Palette,
  Code2,
  Mail,
  Heart,
  ExternalLink,
  Download,
  Upload,
  Lock,
  Check,
  Sparkles,
} from 'lucide-react';
import { db } from '@/lib/db';
import type {
  AppLanguage,
  BookSkinId,
  NoteFontSize,
} from '@/types/notebook';

interface SettingsModuleProps {
  ownerName: string;
  ownerBio: string;
  ownerTagline: string;
  ownerPin: string;
  language: AppLanguage;
  noteFontSize: NoteFontSize;
  handwriting: boolean;
  darkMode: boolean;
  bookSkin: BookSkinId;
  onUpdateProfile: (data: {
    ownerName: string;
    ownerBio: string;
    ownerTagline: string;
    ownerPin: string;
  }) => void;
  onChangeLanguage: (lang: AppLanguage) => void;
  onChangeFontSize: (size: NoteFontSize) => void;
  onToggleHandwriting: () => void;
  onToggleDarkMode: () => void;
  onChangeBookSkin: (skin: BookSkinId) => void;
  onLockBook: () => void;
}

const BOOK_SKINS: {
  id: BookSkinId;
  name: string;
  coverHex: string;
  accentHex: string;
}[] = [
  {
    id: 'leather',
    name: 'Classic Leather',
    coverHex: '#8F7659',
    accentHex: '#DFBE96',
  },
  {
    id: 'terracotta',
    name: 'Terracotta Clay',
    coverHex: '#A65E4A',
    accentHex: '#F0C6B6',
  },
  {
    id: 'olive',
    name: 'Sage Olive',
    coverHex: '#5D6649',
    accentHex: '#CBD4B2',
  },
  {
    id: 'midnight',
    name: 'Midnight Ink',
    coverHex: '#282623',
    accentHex: '#C7B69E',
  },
  {
    id: 'navy',
    name: 'Pocket Denim',
    coverHex: '#364954',
    accentHex: '#B6CCD8',
  },
];

export default function SettingsModule({
  ownerName,
  ownerBio,
  ownerTagline,
  ownerPin,
  language,
  noteFontSize,
  handwriting,
  darkMode,
  bookSkin,
  onUpdateProfile,
  onChangeLanguage,
  onChangeFontSize,
  onToggleHandwriting,
  onToggleDarkMode,
  onChangeBookSkin,
  onLockBook,
}: SettingsModuleProps) {
  const [nameInput, setNameInput] = useState<string>(ownerName);
  const [bioInput, setBioInput] = useState<string>(ownerBio);
  const [taglineInput, setTaglineInput] = useState<string>(ownerTagline);
  const [pinInput, setPinInput] = useState<string>(ownerPin);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [backupNotice, setBackupNotice] = useState<string>('');
  const [ctaFeedback, setCtaFeedback] = useState<string>('');

  const importInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ownerName: nameInput.trim() || 'Ahmad S.',
      ownerBio: bioInput.trim() || 'Offline-First Ready',
      ownerTagline: taglineInput.trim() || 'Your Pocket. Your Space.',
      ownerPin: pinInput.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const handleExportBackup = async () => {
    const [notes, tasks, categories, settings] = await Promise.all([
      db.notes.toArray(),
      db.tasks.toArray(),
      db.categories.toArray(),
      db.settings.toArray(),
    ]);

    const payload = {
      app: 'Catata Pocket Notebook',
      exportedAt: new Date().toISOString(),
      notes,
      tasks,
      categories,
      settings,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `catata-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setBackupNotice(
      language === 'id'
        ? '✓ File cadangan JSON berhasil diunduh.'
        : '✓ JSON backup file downloaded.'
    );
    setTimeout(() => setBackupNotice(''), 3000);
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed.notes) || !Array.isArray(parsed.tasks)) {
        throw new Error('Format file tidak sesuai');
      }

      await db.transaction(
        'rw',
        db.notes,
        db.tasks,
        db.categories,
        db.settings,
        async () => {
          await db.notes.clear();
          await db.tasks.clear();
          if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
            await db.categories.clear();
            await db.categories.bulkAdd(parsed.categories);
          }
          if (Array.isArray(parsed.settings) && parsed.settings.length > 0) {
            await db.settings.clear();
            await db.settings.bulkPut(parsed.settings);
          }
          await db.notes.bulkAdd(parsed.notes);
          await db.tasks.bulkAdd(parsed.tasks);
        }
      );

      setBackupNotice(
        language === 'id'
          ? '✓ Data berhasil dipulihkan! Memuat ulang buku...'
          : '✓ Data restored! Reloading notebook...'
      );
      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch {
      setBackupNotice(
        language === 'id'
          ? '⚠ File cadangan tidak valid. Pastikan memilih file JSON hasil Export Catata.'
          : '⚠ Invalid backup file. Please select a valid Catata JSON export.'
      );
    } finally {
      e.target.value = '';
    }
  };

  const isId = language === 'id';
  const activeSkinObj =
    BOOK_SKINS.find((s) => s.id === bookSkin) || BOOK_SKINS[0];

  return (
    <div className="flex-1 min-h-0 xl:h-full xl:overflow-hidden grid grid-cols-1 xl:grid-cols-2">
      {/* ================= HALAMAN KIRI / ATAS (p. 32): PROFIL, BAHASA, & FONT ================= */}
      <div
        className="min-h-0 xl:h-full xl:overflow-y-auto notebook-scroll p-5 sm:p-8 xl:py-7 xl:pl-7 xl:pr-9 flex flex-col justify-between border-b xl:border-b-0"
        style={{ borderColor: 'var(--notebook-line)' }}
      >
        <div className="space-y-4">
          <div
            className="pb-2.5 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--notebook-line)' }}
          >
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em] font-semibold"
                style={{ color: 'var(--terracotta)' }}
              >
                {isId ? 'PREFERENSI BUKU' : 'NOTEBOOK PREFERENCES'}
              </p>
              <h2 className="font-display text-2xl font-bold">Settings</h2>
            </div>

            <button
              onClick={onLockBook}
              className="text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer hover:opacity-85"
              style={{
                backgroundColor: 'var(--paper-cream)',
                borderColor: 'var(--notebook-line)',
              }}
            >
              <Lock className="w-3.5 h-3.5" style={{ color: 'var(--terracotta)' }} />
              <span>{isId ? 'Tutup Buku' : 'Close Book'}</span>
            </button>
          </div>

          {/* 1. Pengaturan Profil User */}
          <form
            onSubmit={handleSaveProfile}
            className="p-3.5 rounded-xl border space-y-2.5"
            style={{
              backgroundColor: 'var(--paper-cream)',
              borderColor: 'var(--notebook-line)',
            }}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <User className="w-3.5 h-3.5" style={{ color: 'var(--terracotta)' }} />
              <span>{isId ? 'Profil Pemilik Buku' : 'Book Owner Profile'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label
                  className="text-[10px] uppercase tracking-wider block mb-0.5"
                  style={{ color: 'var(--soft-graphite)' }}
                >
                  {isId ? 'Nama Pemilik' : 'Owner Name'}
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border bg-transparent focus:outline-none"
                  style={{ borderColor: 'var(--notebook-line)' }}
                />
              </div>

              <div>
                <label
                  className="text-[10px] uppercase tracking-wider block mb-0.5"
                  style={{ color: 'var(--soft-graphite)' }}
                >
                  {isId ? 'Status / Bio Singkat' : 'Status / Bio'}
                </label>
                <input
                  type="text"
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border bg-transparent focus:outline-none"
                  style={{ borderColor: 'var(--notebook-line)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label
                  className="text-[10px] uppercase tracking-wider block mb-0.5"
                  style={{ color: 'var(--soft-graphite)' }}
                >
                  {isId ? 'Tagline Sampul' : 'Cover Tagline'}
                </label>
                <input
                  type="text"
                  value={taglineInput}
                  onChange={(e) => setTaglineInput(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border bg-transparent focus:outline-none"
                  style={{ borderColor: 'var(--notebook-line)' }}
                />
              </div>

              <div>
                <label
                  className="text-[10px] uppercase tracking-wider block mb-0.5"
                  style={{ color: 'var(--soft-graphite)' }}
                >
                  {isId ? 'PIN Kunci Buku (Opsional)' : 'Cover PIN (Optional)'}
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder={isId ? 'Kosongkan jika tanpa PIN' : 'Leave blank for no PIN'}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border bg-transparent focus:outline-none"
                  style={{ borderColor: 'var(--notebook-line)' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span
                className="text-[11px]"
                style={{ color: 'var(--muted-olive)' }}
              >
                {savedNotice
                  ? isId
                    ? '✓ Profil berhasil diperbarui'
                    : '✓ Profile updated'
                  : ''}
              </span>
              <button
                type="submit"
                className="text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1 cursor-pointer"
                style={{ backgroundColor: 'var(--terracotta)', color: '#FAF7EF' }}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isId ? 'Simpan Profil' : 'Save Profile'}</span>
              </button>
            </div>
          </form>

          {/* 2. Pilihan Bahasa & Tipografi Catatan */}
          <div
            className="p-3.5 rounded-xl border space-y-3"
            style={{
              backgroundColor: 'var(--paper-cream)',
              borderColor: 'var(--notebook-line)',
            }}
          >
            {/* Bahasa */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Globe className="w-3.5 h-3.5" style={{ color: 'var(--faded-blue)' }} />
                <span>{isId ? 'Bahasa Aplikasi' : 'App Language'}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: 'id', label: 'Indonesia' },
                  { id: 'en', label: 'English' },
                ].map((lang) => {
                  const active = language === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => onChangeLanguage(lang.id as AppLanguage)}
                      className="text-[11px] px-2.5 py-1 rounded-md font-medium cursor-pointer"
                      style={{
                        backgroundColor: active
                          ? 'var(--ink-black)'
                          : 'var(--warm-ivory)',
                        color: active
                          ? 'var(--warm-ivory)'
                          : 'var(--soft-graphite)',
                      }}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ukuran Font Catatan */}
            <div
              className="pt-2.5 border-t space-y-2"
              style={{ borderColor: 'var(--notebook-line)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Type className="w-3.5 h-3.5" style={{ color: 'var(--kraft-brown)' }} />
                  <span>{isId ? 'Ukuran & Gaya Font Catatan' : 'Note Font Size & Style'}</span>
                </div>

                <button
                  type="button"
                  onClick={onToggleHandwriting}
                  className="text-[11px] px-2.5 py-1 rounded-md border font-medium cursor-pointer"
                  style={{
                    backgroundColor: 'var(--warm-ivory)',
                    borderColor: 'var(--notebook-line)',
                  }}
                >
                  {handwriting ? 'Caveat (Handwriting)' : 'DM Sans (Clean)'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sm', label: isId ? 'Kecil' : 'Small' },
                  { id: 'md', label: isId ? 'Sedang' : 'Medium' },
                  { id: 'lg', label: isId ? 'Besar' : 'Large' },
                ].map((sz) => {
                  const active = noteFontSize === sz.id;
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => onChangeFontSize(sz.id as NoteFontSize)}
                      className="py-1.5 px-2 rounded-lg text-xs font-medium border cursor-pointer"
                      style={{
                        backgroundColor: active
                          ? 'var(--terracotta)'
                          : 'var(--warm-ivory)',
                        borderColor: active
                          ? 'var(--terracotta)'
                          : 'var(--notebook-line)',
                        color: active ? '#FAF7EF' : 'var(--ink-black)',
                      }}
                    >
                      {sz.label}
                    </button>
                  );
                })}
              </div>

              <p
                className="font-note-content px-3 py-2 rounded-lg border border-dashed"
                style={{
                  backgroundColor: 'var(--warm-ivory)',
                  borderColor: 'var(--notebook-line)',
                }}
              >
                {isId
                  ? 'Pratinjau ukuran tulisan catatan di halaman bukumu.'
                  : 'Preview of your note handwriting size on the page.'}
              </p>
            </div>
          </div>
        </div>

        <p className="hidden xl:block text-center font-display text-xs mt-3 opacity-60">
          — 32 —
        </p>
      </div>

      {/* ================= HALAMAN KANAN / BAWAH (p. 33): THEME & SKINS + BACKUP + DEVELOPER CTA ================= */}
      <div className="min-h-0 xl:h-full xl:overflow-y-auto notebook-scroll p-5 sm:p-8 xl:py-7 xl:pr-7 xl:pl-9 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Custom Theme & Skins dengan Pratinjau Langsung */}
          <div
            className="p-3.5 rounded-xl border space-y-3"
            style={{
              backgroundColor: 'var(--paper-cream)',
              borderColor: 'var(--notebook-line)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Palette className="w-3.5 h-3.5" style={{ color: 'var(--terracotta)' }} />
                <span>{isId ? 'Custom Theme & Skins Sampul' : 'Custom Theme & Cover Skins'}</span>
              </div>

              <button
                type="button"
                onClick={onToggleDarkMode}
                className="text-[11px] px-2.5 py-1 rounded-md border font-medium cursor-pointer"
                style={{
                  backgroundColor: 'var(--warm-ivory)',
                  borderColor: 'var(--notebook-line)',
                }}
              >
                {darkMode
                  ? isId
                    ? 'Kertas Malam'
                    : 'Night Paper'
                  : isId
                  ? 'Kertas Siang'
                  : 'Day Ivory'}
              </button>
            </div>

            {/* Mini Live Preview Sampul Buku */}
            <div
              className="p-3 rounded-xl border flex items-center justify-between gap-3"
              style={{
                backgroundColor: 'var(--warm-ivory)',
                borderColor: 'var(--notebook-line)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-14 rounded-l-xs rounded-r-md relative shadow-md flex flex-col justify-between p-1.5 text-[#FAF7EF] transition-colors"
                  style={{
                    backgroundColor: activeSkinObj.coverHex,
                    boxShadow: '3px 0 0 #E5DEC9, 4px 0 0 #B69A76',
                  }}
                >
                  <span className="font-display text-[9px] font-bold">C.</span>
                  <span
                    className="w-full h-2.5 rounded-[2px]"
                    style={{ backgroundColor: '#FAF7EF' }}
                  />
                  <span
                    className="absolute inset-y-0 right-1.5 w-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold">{activeSkinObj.name}</p>
                  <p
                    className="text-[11px]"
                    style={{ color: 'var(--soft-graphite)' }}
                  >
                    {isId
                      ? 'Warna sampul buku tertutup & bingkai luar aktif'
                      : 'Active closed cover & outer frame skin'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLockBook}
                className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium cursor-pointer flex-shrink-0"
                style={{
                  backgroundColor: 'var(--terracotta)',
                  color: '#FAF7EF',
                }}
              >
                {isId ? 'Lihat Sampul' : 'View Cover'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BOOK_SKINS.map((skin) => {
                const isSelected = bookSkin === skin.id;
                return (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => onChangeBookSkin(skin.id)}
                    className="p-2 rounded-xl border text-left flex items-center gap-2.5 transition-transform hover:-translate-y-0.5 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--warm-ivory)',
                      borderColor: isSelected
                        ? 'var(--terracotta)'
                        : 'var(--notebook-line)',
                      boxShadow: isSelected
                        ? '0 2px 8px rgba(184, 117, 97, 0.22)'
                        : 'none',
                    }}
                  >
                    <span
                      className="w-6 h-7 rounded-r-md rounded-l-xs flex-shrink-0 border relative"
                      style={{
                        backgroundColor: skin.coverHex,
                        borderColor: 'rgba(0,0,0,0.2)',
                      }}
                    >
                      <span
                        className="w-1 h-full absolute right-1 top-0"
                        style={{ backgroundColor: skin.accentHex }}
                      />
                    </span>
                    <span className="text-[11px] font-semibold leading-tight">
                      {skin.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cadangan & Pemulihan Data Offline (Export / Import JSON) */}
          <div
            className="p-3.5 rounded-xl border space-y-2"
            style={{
              backgroundColor: 'var(--paper-cream)',
              borderColor: 'var(--notebook-line)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold">
                  {isId
                    ? 'Cadangkan & Pulihkan Data (JSON)'
                    : 'Backup & Restore Data (JSON)'}
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--soft-graphite)' }}
                >
                  {isId
                    ? 'Simpan salinan lokal atau pulihkan catatan di perangkat lain.'
                    : 'Save a local backup or restore notes on another device.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--warm-ivory)',
                    borderColor: 'var(--notebook-line)',
                  }}
                >
                  <Download
                    className="w-3.5 h-3.5"
                    style={{ color: 'var(--muted-olive)' }}
                  />
                  <span>Export</span>
                </button>

                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--warm-ivory)',
                    borderColor: 'var(--notebook-line)',
                  }}
                >
                  <Upload
                    className="w-3.5 h-3.5"
                    style={{ color: 'var(--terracotta)' }}
                  />
                  <span>Import</span>
                </button>
              </div>
            </div>

            {backupNotice && (
              <p
                className="text-[11px] font-medium"
                style={{ color: 'var(--terracotta)' }}
              >
                {backupNotice}
              </p>
            )}
          </div>

          {/* Kartu Logo & CTA Developer */}
          <div className="sticky-kraft rounded-xl p-4 pt-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-base shadow-sm"
                  style={{
                    backgroundColor: 'var(--ink-black)',
                    color: 'var(--warm-ivory)',
                  }}
                >
                  C<span style={{ color: 'var(--terracotta)' }}>.</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display text-sm font-bold">
                      Catata Studio
                    </h3>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      style={{
                        backgroundColor: 'var(--terracotta)',
                        color: '#FAF7EF',
                      }}
                    >
                      v2.0
                    </span>
                  </div>
                  <p
                    className="text-[11px]"
                    style={{ color: 'var(--soft-graphite)' }}
                  >
                    Dijilid dengan sabar, dicetak di HP kamu.
                    2026 Catata Studio. All rights reserved.
                  </p>
                </div>
              </div>

              <Code2
                className="w-4 h-4 opacity-60"
                style={{ color: 'var(--ink-black)' }}
              />
            </div>

            <p className="text-xs leading-relaxed opacity-85">
              {isId
                ? 'Punya ide fitur baru, saran tampilan, atau butuh aplikasi web/mobile khusus untuk produktivitas dan operasional bisnis Anda?'
                : 'Have a feature request, UI feedback, or need a custom web/mobile app for your productivity and business operations?'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <a
                href="mailto:hello@catata.app?subject=Kolaborasi%20%26%20Masukan%20Catata"
                onClick={() =>
                  setCtaFeedback(
                    isId
                      ? 'Membuka aplikasi email untuk menghubungi developer...'
                      : 'Opening mail client to contact developer...'
                  )
                }
                className="text-xs px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 cursor-pointer"
                style={{
                  backgroundColor: 'var(--terracotta)',
                  color: '#FAF7EF',
                }}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isId ? 'Hubungi Developer' : 'Contact Developer'}</span>
              </a>

              <button
                type="button"
                onClick={() =>
                  setCtaFeedback(
                    isId
                      ? 'Terima kasih atas dukunganmu untuk pengembangan Catata!'
                      : 'Thank you for supporting Catata development!'
                  )
                }
                className="text-xs px-3 py-1.5 rounded-lg border font-medium inline-flex items-center gap-1.5 cursor-pointer"
                style={{
                  backgroundColor: 'var(--warm-ivory)',
                  borderColor: 'var(--kraft-brown)',
                }}
              >
                <Heart
                  className="w-3.5 h-3.5"
                  style={{ color: 'var(--vintage-red)' }}
                />
                <span>{isId ? 'Dukung Karya' : 'Support Project'}</span>
              </button>

              <a
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  setCtaFeedback(
                    isId
                      ? 'Catata Pocket Edition — Dibangun dengan Next.js, TypeScript & IndexedDB.'
                      : 'Catata Pocket Edition — Built with Next.js, TypeScript & IndexedDB.'
                  );
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg font-medium inline-flex items-center gap-1 opacity-80 hover:opacity-100"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Portfolio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {ctaFeedback && (
              <p
                className="text-[11px] font-medium pt-0.5"
                style={{ color: 'var(--terracotta)' }}
              >
                {ctaFeedback}
              </p>
            )}
          </div>
        </div>

        <p className="hidden xl:block text-center font-display text-xs mt-3 opacity-60">
          — 33 —
        </p>
      </div>
    </div>
  );
}