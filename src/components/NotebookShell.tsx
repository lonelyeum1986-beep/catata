'use client';

import React, { useEffect, useState } from 'react';
import {
  Sun,
  Moon,
  FileText,
  Calendar,
  FolderOpen,
  Search,
  Trash2,
  Plus,
  Check,
  X,
  Settings,
  Lock,
} from 'lucide-react';
import { db, initializeDefaultData } from '@/lib/db';
import type {
  AppLanguage,
  BookSkinId,
  ModuleTab,
  NoteFontSize,
  TaskItem,
} from '@/types/notebook';
import BookCoverLogin from '@/components/BookCoverLogin';
import NotesModule from '@/components/notes/NotesModule';
import PlannerModule from '@/components/planner/PlannerModule';
import CollectionModule from '@/components/collection/CollectionModule';
import SettingsModule from '@/components/settings/SettingsModule';

const FONT_SCALE_MAP: Record<
  NoteFontSize,
  { hwSize: string; hwLine: string; sansSize: string; sansLine: string }
> = {
  sm: {
    hwSize: '1.02rem',
    hwLine: '1.42',
    sansSize: '0.8125rem',
    sansLine: '1.55',
  },
  md: {
    hwSize: '1.15rem',
    hwLine: '1.48',
    sansSize: '0.9125rem',
    sansLine: '1.62',
  },
  lg: {
    hwSize: '1.30rem',
    hwLine: '1.54',
    sansSize: '1.03rem',
    sansLine: '1.68',
  },
};

export default function NotebookShell() {
  const [isBookOpen, setIsBookOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ModuleTab>('today');
  const [handwriting, setHandwriting] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Preferensi Profil, Bahasa, Ukuran Font, & Skin Sampul
  const [ownerName, setOwnerName] = useState<string>('Ahmad S.');
  const [ownerBio, setOwnerBio] = useState<string>('Offline-First Ready');
  const [ownerTagline, setOwnerTagline] = useState<string>(
    'Your Pocket. Your Space.'
  );
  const [ownerPin, setOwnerPin] = useState<string>('');
  const [language, setLanguage] = useState<AppLanguage>('id');
  const [noteFontSize, setNoteFontSize] = useState<NoteFontSize>('md');
  const [bookSkin, setBookSkin] = useState<BookSkinId>('leather');

  const [targetNoteId, setTargetNoteId] = useState<number | null>(null);
  const [notesInitialFilter, setNotesInitialFilter] = useState<
    'all' | 'pinned' | 'favorite' | 'archived'
  >('all');

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [dailyFocus, setDailyFocus] = useState<string>(
    'Finish design project & workout'
  );
  const [quickNote, setQuickNote] = useState<string>(
    'Jangan lupa beli kopi favorit & istirahat sejenak!'
  );
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const syncTypographyToDom = (isHw: boolean, sz: NoteFontSize) => {
    const scale = FONT_SCALE_MAP[sz] || FONT_SCALE_MAP.md;
    document.body.classList.toggle('handwriting-on', isHw);
    document.body.classList.toggle('handwriting-off', !isHw);
    document.documentElement.style.setProperty(
      '--active-note-font-size',
      isHw ? scale.hwSize : scale.sansSize
    );
    document.documentElement.style.setProperty(
      '--active-note-line-height',
      isHw ? scale.hwLine : scale.sansLine
    );
  };

  const syncSkinToDom = (skin: BookSkinId) => {
    document.documentElement.setAttribute('data-skin', skin);
  };

  useEffect(() => {
    async function loadLocalNotebook() {
      await initializeDefaultData();

      const savedTasks = await db.tasks
        .where('dayKey')
        .equals('today')
        .toArray();
      setTasks(savedTasks);

      const savedFocus = await db.settings.get('dailyFocus');
      if (savedFocus) setDailyFocus(savedFocus.value);

      const savedQuick = await db.settings.get('quickNote');
      if (savedQuick) setQuickNote(savedQuick.value);

      const [
        savedFont,
        savedTheme,
        sOwnerName,
        sOwnerBio,
        sOwnerTagline,
        sOwnerPin,
        sLang,
        sFontSize,
        sSkin,
      ] = await Promise.all([
        db.settings.get('handwriting'),
        db.settings.get('darkMode'),
        db.settings.get('ownerName'),
        db.settings.get('ownerBio'),
        db.settings.get('ownerTagline'),
        db.settings.get('ownerPin'),
        db.settings.get('language'),
        db.settings.get('noteFontSize'),
        db.settings.get('bookSkin'),
      ]);

      const resolvedHw = savedFont ? savedFont.value === 'true' : true;
      setHandwriting(resolvedHw);

      const resolvedSize: NoteFontSize =
        sFontSize?.value === 'sm' ||
        sFontSize?.value === 'md' ||
        sFontSize?.value === 'lg'
          ? sFontSize.value
          : 'md';
      setNoteFontSize(resolvedSize);
      syncTypographyToDom(resolvedHw, resolvedSize);

      if (savedTheme && savedTheme.value === 'true') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }

      if (sOwnerName) setOwnerName(sOwnerName.value);
      if (sOwnerBio) setOwnerBio(sOwnerBio.value);
      if (sOwnerTagline) setOwnerTagline(sOwnerTagline.value);
      if (sOwnerPin) setOwnerPin(sOwnerPin.value);
      if (sLang?.value === 'en' || sLang?.value === 'id') {
        setLanguage(sLang.value);
      }

      const resolvedSkin: BookSkinId =
        sSkin?.value === 'leather' ||
        sSkin?.value === 'terracotta' ||
        sSkin?.value === 'olive' ||
        sSkin?.value === 'midnight' ||
        sSkin?.value === 'navy'
          ? sSkin.value
          : 'leather';
      setBookSkin(resolvedSkin);
      syncSkinToDom(resolvedSkin);

      setIsLoaded(true);
    }

    loadLocalNotebook();
  }, []);

  const handleToggleFont = async () => {
    const next = !handwriting;
    setHandwriting(next);
    syncTypographyToDom(next, noteFontSize);
    await db.settings.put({ key: 'handwriting', value: String(next) });
  };

  const handleToggleDark = async () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    await db.settings.put({ key: 'darkMode', value: String(next) });
  };

  const handleUpdateProfile = async (data: {
    ownerName: string;
    ownerBio: string;
    ownerTagline: string;
    ownerPin: string;
  }) => {
    setOwnerName(data.ownerName);
    setOwnerBio(data.ownerBio);
    setOwnerTagline(data.ownerTagline);
    setOwnerPin(data.ownerPin);
    await db.settings.bulkPut([
      { key: 'ownerName', value: data.ownerName },
      { key: 'ownerBio', value: data.ownerBio },
      { key: 'ownerTagline', value: data.ownerTagline },
      { key: 'ownerPin', value: data.ownerPin },
    ]);
  };

  const handleChangeLanguage = async (lang: AppLanguage) => {
    setLanguage(lang);
    await db.settings.put({ key: 'language', value: lang });
  };

  const handleChangeFontSize = async (sz: NoteFontSize) => {
    setNoteFontSize(sz);
    syncTypographyToDom(handwriting, sz);
    await db.settings.put({ key: 'noteFontSize', value: sz });
  };

  const handleChangeBookSkin = async (skin: BookSkinId) => {
    setBookSkin(skin);
    syncSkinToDom(skin);
    await db.settings.put({ key: 'bookSkin', value: skin });
  };

  const handleFocusChange = async (val: string) => {
    setDailyFocus(val);
    await db.settings.put({ key: 'dailyFocus', value: val });
  };

  const handleQuickNoteChange = async (val: string) => {
    setQuickNote(val);
    await db.settings.put({ key: 'quickNote', value: val });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newItem: TaskItem = {
      text: newTaskText.trim(),
      done: false,
      dayKey: 'today',
      priority: 'medium',
      createdAt: Date.now(),
    };

    const id = await db.tasks.add(newItem);
    setTasks((prev) => [...prev, { ...newItem, id: Number(id) }]);
    setNewTaskText('');
  };

  const handleToggleTask = async (task: TaskItem) => {
    if (!task.id) return;
    const updatedDone = !task.done;
    await db.tasks.update(task.id, { done: updatedDone });
    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.id ? { ...item, done: updatedDone } : item
      )
    );
  };

  const handleDeleteTask = async (id?: number) => {
    if (!id) return;
    await db.tasks.delete(id);
    setTasks((prev) => prev.filter((item) => item.id !== id));
  };

  const handleOpenNoteFromCollection = (noteId: number) => {
    setTargetNoteId(noteId);
    setNotesInitialFilter('all');
    setActiveTab('notes');
  };

  // Tampilan Sampul Buku Tertutup sebelum dibuka
  if (!isBookOpen) {
    return (
      <BookCoverLogin
        ownerName={ownerName}
        ownerTagline={ownerTagline}
        bookSkin={bookSkin}
        language={language}
        savedPin={ownerPin}
        onOpenBook={() => setIsBookOpen(true)}
      />
    );
  }

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPct =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const initials = ownerName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const weeklyBars = [
    { day: 'Mon', pct: 85, color: 'var(--faded-blue)' },
    { day: 'Tue', pct: 75, color: 'var(--faded-blue)' },
    { day: 'Wed', pct: 65, color: 'var(--muted-olive)' },
    { day: 'Thu', pct: progressPct, color: 'var(--terracotta)', isToday: true },
    { day: 'Fri', pct: 35, color: 'var(--kraft-brown)' },
    { day: 'Sat', pct: 20, color: 'var(--faded-blue)' },
    { day: 'Sun', pct: 10, color: 'var(--notebook-line)' },
  ];

  const isId = language === 'id';

  return (
    <div
      data-skin={bookSkin}
      className="min-h-screen w-full flex items-center justify-center xl:p-6"
    >
      {/* OUTER SHELL: 1 Halaman Penuh di Mobile & Tablet (<1280px), Buku Terbuka 2 Halaman di Desktop (>=1280px) */}
      <div className="animate-spread-enter w-full max-w-6xl min-h-screen xl:min-h-0 xl:h-[88vh] xl:max-h-[820px] xl:book-cover xl:rounded-[22px] xl:p-3 relative flex flex-col">
        {/* INNER STACKED PAGES */}
        <div className="flex-1 w-full xl:h-full xl:book-pages-stack xl:rounded-[16px] overflow-hidden flex flex-col xl:flex-row relative bg-[var(--warm-ivory)]">
          {/* ==================== MOBILE & TABLET TOP BAR (< 1280px) ==================== */}
          <header
            className="xl:hidden sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b"
            style={{
              backgroundColor: 'var(--warm-ivory)',
              borderColor: 'var(--notebook-line)',
            }}
          >
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight leading-none">
                Catata<span style={{ color: 'var(--terracotta)' }}>.</span>
              </h1>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: 'var(--soft-graphite)' }}
              >
                {isId ? `Halo, ${ownerName}` : `Hi, ${ownerName}`} • 19 Nov 2026
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFont}
                title={
                  handwriting
                    ? 'Ganti ke huruf rapi (DM Sans)'
                    : 'Ganti ke tulisan tangan (Caveat)'
                }
                className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: handwriting
                    ? 'var(--terracotta)'
                    : 'var(--paper-cream)',
                  borderColor: handwriting
                    ? 'var(--terracotta)'
                    : 'var(--notebook-line)',
                  color: handwriting ? '#FAF7EF' : 'var(--ink-black)',
                }}
              >
                Aa
              </button>

              <button
                onClick={handleToggleDark}
                title={darkMode ? 'Mode Kertas Siang' : 'Mode Kertas Malam'}
                className="w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer"
                style={{
                  backgroundColor: 'var(--paper-cream)',
                  borderColor: 'var(--notebook-line)',
                  color: 'var(--ink-black)',
                }}
              >
                {darkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => setIsBookOpen(false)}
                title={isId ? 'Tutup Sampul Buku' : 'Close Book Cover'}
                className="px-2.5 h-8 rounded-full border flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                style={{
                  backgroundColor: 'var(--paper-cream)',
                  borderColor: 'var(--notebook-line)',
                  color: 'var(--ink-black)',
                }}
              >
                <Lock className="w-3.5 h-3.5" style={{ color: 'var(--terracotta)' }} />
                <span className="hidden sm:inline">
                  {isId ? 'Tutup Buku' : 'Close'}
                </span>
              </button>
            </div>
          </header>

          {/* ==================== WIDE DESKTOP LEFT INDEX SIDEBAR (>= 1280px) ==================== */}
          <aside
            className="hidden xl:flex xl:w-56 xl:h-full xl:overflow-y-auto notebook-scroll flex-shrink-0 flex-col justify-between p-5 border-r"
            style={{
              backgroundColor: 'var(--paper-cream)',
              borderColor: 'var(--notebook-line)',
            }}
          >
            <div>
              <div
                className="pb-4 mb-4 border-b flex items-start justify-between gap-2"
                style={{ borderColor: 'var(--notebook-line)' }}
              >
                <div>
                  <h1 className="font-display text-[26px] font-bold tracking-tight leading-none">
                    Catata
                    <span style={{ color: 'var(--terracotta)' }}>.</span>
                  </h1>
                  <p
                    className="text-[9px] uppercase tracking-[0.18em] mt-1.5 font-semibold"
                    style={{ color: 'var(--soft-graphite)' }}
                  >
                    {ownerTagline}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    onClick={handleToggleFont}
                    title={
                      handwriting
                        ? 'Font: Caveat (Klik untuk DM Sans)'
                        : 'Font: DM Sans (Klik untuk Caveat)'
                    }
                    className="w-7 h-7 rounded-md border flex items-center justify-center text-[11px] font-bold cursor-pointer"
                    style={{
                      backgroundColor: handwriting
                        ? 'var(--terracotta)'
                        : 'var(--warm-ivory)',
                      borderColor: handwriting
                        ? 'var(--terracotta)'
                        : 'var(--notebook-line)',
                      color: handwriting ? '#FAF7EF' : 'var(--ink-black)',
                    }}
                  >
                    Aa
                  </button>
                  <button
                    onClick={handleToggleDark}
                    title={
                      darkMode
                        ? 'Kertas Siang (Warm Ivory)'
                        : 'Kertas Malam (Night Paper)'
                    }
                    className="w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer"
                    style={{
                      backgroundColor: 'var(--warm-ivory)',
                      borderColor: 'var(--notebook-line)',
                      color: 'var(--ink-black)',
                    }}
                  >
                    {darkMode ? (
                      <Sun className="w-3.5 h-3.5" />
                    ) : (
                      <Moon className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 5 Menu Navigasi Utama */}
              <nav className="space-y-1">
                {[
                  { id: 'today', label: 'Today', icon: Sun },
                  { id: 'notes', label: 'Notes', icon: FileText },
                  { id: 'planner', label: 'Weekly Planner', icon: Calendar },
                  { id: 'collection', label: 'Collection', icon: FolderOpen },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'notes') {
                          setNotesInitialFilter('all');
                        }
                        setActiveTab(item.id as ModuleTab);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                      style={{
                        backgroundColor: isActive
                          ? 'var(--warm-ivory)'
                          : 'transparent',
                        color: isActive
                          ? 'var(--ink-black)'
                          : 'var(--soft-graphite)',
                        boxShadow: isActive
                          ? '0 2px 6px rgba(41,41,35,0.06)'
                          : 'none',
                      }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{
                          color: isActive ? 'var(--terracotta)' : 'currentColor',
                        }}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div
                className="mt-5 pt-4 border-t space-y-1"
                style={{ borderColor: 'var(--notebook-line)' }}
              >
                <button
                  onClick={() => {
                    setNotesInitialFilter('all');
                    setActiveTab('notes');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:opacity-80"
                  style={{ color: 'var(--soft-graphite)' }}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isId ? 'Cari Catatan' : 'Search'}</span>
                </button>
                <button
                  onClick={() => {
                    setNotesInitialFilter('archived');
                    setActiveTab('notes');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:opacity-80"
                  style={{ color: 'var(--soft-graphite)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isId ? 'Arsip' : 'Archived'}</span>
                </button>
                <button
                  onClick={() => setIsBookOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:opacity-80"
                  style={{ color: 'var(--soft-graphite)' }}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isId ? 'Tutup Buku' : 'Close Book'}</span>
                </button>
              </div>
            </div>

            {/* Profil Pemilik di Kiri Bawah */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              title={isId ? 'Buka Pengaturan Profil' : 'Open Profile Settings'}
              className="flex items-center gap-2.5 pt-3 mt-4 border-t text-left cursor-pointer hover:opacity-85"
              style={{ borderColor: 'var(--notebook-line)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-xs flex-shrink-0"
                style={{
                  backgroundColor: 'var(--terracotta)',
                  color: '#FAF7EF',
                }}
              >
                {initials || 'AS'}
              </div>
              <div className="leading-tight min-w-0">
                <p className="text-xs font-semibold truncate">{ownerName}</p>
                <p
                  className="text-[10px] flex items-center gap-1 truncate"
                  style={{ color: 'var(--faded-blue)' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                    style={{ backgroundColor: 'var(--muted-olive)' }}
                  />
                  <span className="truncate">{ownerBio}</span>
                </p>
              </div>
            </button>
          </aside>

          {/* ==================== MAIN CONTENT AREA ==================== */}
          <main className="single-page-tablet-spread flex-1 min-h-0 xl:h-full xl:overflow-hidden relative flex flex-col pb-20 xl:pb-0">
            {/* Bayangan Lipatan Tengah Buku hanya muncul pada Desktop Lebar (>= 1280px) */}
            <div className="hidden xl:block center-crease absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 pointer-events-none z-20" />

            {/* WRAPPER ANIMASI PERGANTIAN HALAMAN / TAB */}
            <div
              key={activeTab}
              className="animate-page-turn flex-1 min-h-0 xl:h-full xl:overflow-hidden flex flex-col max-w-3xl xl:max-w-none w-full mx-auto"
            >
              {/* MODUL 1: TODAY */}
              {activeTab === 'today' && (
                <div className="flex-1 min-h-0 xl:h-full xl:overflow-hidden grid grid-cols-1 xl:grid-cols-2">
                  {/* HALAMAN KIRI / UTAMA (Page 24) */}
                  <div
                    className="min-h-0 xl:h-full xl:overflow-y-auto notebook-scroll p-5 sm:p-8 xl:py-7 xl:pl-7 xl:pr-9 flex flex-col justify-between border-b xl:border-b-0"
                    style={{ borderColor: 'var(--notebook-line)' }}
                  >
                    <div className="space-y-4">
                      <div>
                        <p
                          className="text-[11px] uppercase tracking-[0.18em] font-semibold"
                          style={{ color: 'var(--soft-graphite)' }}
                        >
                          THURSDAY
                        </p>
                        <h2 className="font-display text-2xl sm:text-[26px] font-bold mt-0.5">
                          19 November 2026
                        </h2>
                      </div>

                      <div
                        className="pb-2.5 border-b"
                        style={{ borderColor: 'var(--notebook-line)' }}
                      >
                        <label
                          className="text-[11px] uppercase tracking-wider block mb-1"
                          style={{ color: 'var(--soft-graphite)' }}
                        >
                          Daily Focus
                        </label>
                        <input
                          type="text"
                          value={dailyFocus}
                          onChange={(e) => handleFocusChange(e.target.value)}
                          className="font-display italic font-semibold text-base sm:text-lg w-full bg-transparent focus:outline-none"
                          placeholder="Tulis fokus utama hari ini..."
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-xs font-semibold tracking-wide"
                            style={{ color: 'var(--soft-graphite)' }}
                          >
                            Today&apos;s Tasks
                          </span>
                          <span
                            className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: 'var(--paper-cream)',
                              color: 'var(--terracotta)',
                            }}
                          >
                            {completedCount}/{tasks.length}{' '}
                            {isId ? 'selesai' : 'done'}
                          </span>
                        </div>

                        {!isLoaded ? (
                          <div className="space-y-2 py-2">
                            <div
                              className="h-6 rounded animate-pulse"
                              style={{ backgroundColor: 'var(--paper-cream)' }}
                            />
                            <div
                              className="h-6 rounded animate-pulse"
                              style={{ backgroundColor: 'var(--paper-cream)' }}
                            />
                          </div>
                        ) : tasks.length === 0 ? (
                          <p
                            className="text-xs py-3 italic"
                            style={{ color: 'var(--soft-graphite)' }}
                          >
                            {isId
                              ? 'Belum ada daftar tugas hari ini.'
                              : 'No tasks for today yet.'}
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {tasks.map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center justify-between gap-2 py-0.5 group"
                              >
                                <button
                                  onClick={() => handleToggleTask(task)}
                                  className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                                >
                                  <span
                                    className="w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-colors"
                                    style={{
                                      borderColor: task.done
                                        ? 'var(--terracotta)'
                                        : 'var(--soft-graphite)',
                                      backgroundColor: task.done
                                        ? 'var(--terracotta)'
                                        : 'transparent',
                                      color: '#FAF7EF',
                                    }}
                                  >
                                    {task.done && (
                                      <Check className="w-3 h-3 stroke-[2.5]" />
                                    )}
                                  </span>
                                  <span
                                    className={`font-note-content ${
                                      task.done ? 'line-through opacity-55' : ''
                                    }`}
                                  >
                                    {task.text}
                                  </span>
                                </button>

                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  title="Hapus tugas"
                                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 p-1 cursor-pointer"
                                  style={{ color: 'var(--soft-graphite)' }}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <form
                          onSubmit={handleAddTask}
                          className="mt-2.5 flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder={
                              isId
                                ? '+ Tambah tugas hari ini...'
                                : '+ Add task for today...'
                            }
                            className="flex-1 text-xs sm:text-sm py-1.5 px-2 bg-transparent border-b focus:outline-none"
                            style={{ borderColor: 'var(--notebook-line)' }}
                          />
                          <button
                            type="submit"
                            className="text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1 cursor-pointer"
                            style={{
                              backgroundColor: 'var(--terracotta)',
                              color: '#FAF7EF',
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isId ? 'Tambah' : 'Add'}</span>
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Quick Note Kraft Paper & Nomor Halaman */}
                    <div className="mt-4 pt-2">
                      <div className="flex items-end gap-3">
                        <span
                          className="text-[11px] uppercase tracking-wider leading-tight pb-2 font-medium"
                          style={{ color: 'var(--soft-graphite)' }}
                        >
                          Quick
                          <br />
                          Note
                        </span>
                        <div className="sticky-kraft flex-1 rounded-md p-2.5 pt-3.5">
                          <textarea
                            rows={2}
                            value={quickNote}
                            onChange={(e) =>
                              handleQuickNoteChange(e.target.value)
                            }
                            className="font-note-content w-full bg-transparent resize-none focus:outline-none"
                          />
                        </div>
                      </div>
                      <p className="hidden xl:block text-center font-display text-xs mt-3 opacity-60">
                        — 24 —
                      </p>
                    </div>
                  </div>

                  {/* HALAMAN KANAN / LANJUTAN (Page 25: Weekly Overview) */}
                  <div className="min-h-0 xl:h-full xl:overflow-y-auto notebook-scroll p-5 sm:p-8 xl:py-7 xl:pr-7 xl:pl-9 flex flex-col justify-between">
                    <div className="space-y-5">
                      <div>
                        <h3 className="font-display text-lg sm:text-xl tracking-wide uppercase font-bold">
                          WEEKLY OVERVIEW
                        </h3>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--soft-graphite)' }}
                        >
                          16 – 22 November 2026
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span
                            className="font-medium"
                            style={{ color: 'var(--soft-graphite)' }}
                          >
                            {isId ? 'Progress Hari Ini' : "Today's Progress"}
                          </span>
                          <span className="font-display font-bold text-sm">
                            {progressPct}%
                          </span>
                        </div>
                        <div
                          className="w-full h-2.5 rounded-full overflow-hidden p-0.5 border"
                          style={{
                            backgroundColor: 'var(--paper-cream)',
                            borderColor: 'var(--notebook-line)',
                          }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: 'var(--terracotta)',
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-1">
                        {weeklyBars.map((item) => (
                          <div
                            key={item.day}
                            className="flex items-center gap-3"
                          >
                            <span
                              className={`w-9 text-xs ${
                                item.isToday ? 'font-bold' : 'font-medium'
                              }`}
                              style={{
                                color: item.isToday
                                  ? 'var(--terracotta)'
                                  : 'var(--soft-graphite)',
                              }}
                            >
                              {item.day}
                            </span>
                            <div
                              className="flex-1 h-2 rounded-full relative flex items-center"
                              style={{ backgroundColor: 'var(--paper-cream)' }}
                            >
                              <div
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                  width: `${item.pct}%`,
                                  backgroundColor: item.color,
                                }}
                              />
                              <span
                                className="w-2.5 h-2.5 rounded-full border-2 -ml-1.5"
                                style={{
                                  backgroundColor: item.color,
                                  borderColor: 'var(--warm-ivory)',
                                }}
                              />
                            </div>
                            <span
                              className="w-8 text-right text-[11px]"
                              style={{ color: 'var(--soft-graphite)' }}
                            >
                              {item.pct}%
                            </span>
                          </div>
                        ))}
                      </div>

                      <div
                        className="p-3.5 rounded-xl border border-dashed"
                        style={{
                          backgroundColor: 'var(--paper-cream)',
                          borderColor: 'var(--faded-blue)',
                        }}
                      >
                        <p
                          className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                          style={{ color: 'var(--faded-blue)' }}
                        >
                          {isId ? 'Catatan Refleksi' : 'Reflection'}
                        </p>
                        <p className="font-note-content">
                          &ldquo;Your little space to think, plan, and
                          remember.&rdquo;
                        </p>
                      </div>
                    </div>

                    <p className="hidden xl:block text-center font-display text-xs mt-4 opacity-60">
                      — 25 —
                    </p>
                  </div>
                </div>
              )}

              {/* MODUL 2: NOTES */}
              {activeTab === 'notes' && (
                <NotesModule
                  initialNoteId={targetNoteId}
                  initialFilter={notesInitialFilter}
                />
              )}

              {/* MODUL 3: WEEKLY PLANNER */}
              {activeTab === 'planner' && <PlannerModule />}

              {/* MODUL 4: COLLECTION */}
              {activeTab === 'collection' && (
                <CollectionModule
                  onOpenNoteInEditor={handleOpenNoteFromCollection}
                />
              )}

              {/* MODUL 5: SETTINGS */}
              {activeTab === 'settings' && (
                <SettingsModule
                  ownerName={ownerName}
                  ownerBio={ownerBio}
                  ownerTagline={ownerTagline}
                  ownerPin={ownerPin}
                  language={language}
                  noteFontSize={noteFontSize}
                  handwriting={handwriting}
                  darkMode={darkMode}
                  bookSkin={bookSkin}
                  onUpdateProfile={handleUpdateProfile}
                  onChangeLanguage={handleChangeLanguage}
                  onChangeFontSize={handleChangeFontSize}
                  onToggleHandwriting={handleToggleFont}
                  onToggleDarkMode={handleToggleDark}
                  onChangeBookSkin={handleChangeBookSkin}
                  onLockBook={() => setIsBookOpen(false)}
                />
              )}
            </div>
          </main>

          {/* ==================== MOBILE & TABLET BOTTOM TAB BAR (< 1280px) ==================== */}
          <nav
            className="xl:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t"
            style={{
              backgroundColor: 'var(--paper-cream)',
              borderColor: 'var(--notebook-line)',
            }}
          >
            {[
              {
                id: 'today',
                label: 'Today',
                icon: Sun,
                color: 'var(--terracotta)',
              },
              {
                id: 'notes',
                label: 'Notes',
                icon: FileText,
                color: 'var(--faded-blue)',
              },
              {
                id: 'planner',
                label: 'Planner',
                icon: Calendar,
                color: 'var(--kraft-brown)',
              },
              {
                id: 'collection',
                label: 'Folder',
                icon: FolderOpen,
                color: 'var(--muted-olive)',
              },
              {
                id: 'settings',
                label: 'Setting',
                icon: Settings,
                color: 'var(--vintage-red)',
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'notes') setNotesInitialFilter('all');
                    setActiveTab(tab.id as ModuleTab);
                  }}
                  className="flex flex-col items-center justify-center py-2.5 gap-1 text-[11px] font-medium border-t-2 cursor-pointer"
                  style={{
                    borderTopColor: isActive ? tab.color : 'transparent',
                    color: isActive
                      ? 'var(--ink-black)'
                      : 'var(--soft-graphite)',
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: isActive ? tab.color : 'currentColor' }}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ==================== DESKTOP WOVEN FABRIC & DASHED STITCHED RIGHT INDEX TABS ==================== */}
        <div className="hidden xl:flex flex-col gap-2.5 absolute top-14 -right-8 z-30">
          {[
            { id: 'today', label: 'TODAY', bg: 'var(--terracotta)' },
            { id: 'notes', label: 'NOTES', bg: 'var(--faded-blue)' },
            { id: 'planner', label: 'PLANNER', bg: 'var(--kraft-brown)' },
            { id: 'collection', label: 'INDEX', bg: 'var(--muted-olive)' },
            { id: 'settings', label: 'SETTING', bg: 'var(--vintage-red)' },
          ].map((edge) => (
            <button
              key={edge.id}
              onClick={() => {
                if (edge.id === 'notes') setNotesInitialFilter('all');
                setActiveTab(edge.id as ModuleTab);
              }}
              className={`edge-tab py-3.5 px-2.5 text-[10px] tracking-widest uppercase text-white cursor-pointer ${
                activeTab === edge.id ? 'active-edge' : ''
              }`}
              style={{ backgroundColor: edge.bg }}
            >
              {edge.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}