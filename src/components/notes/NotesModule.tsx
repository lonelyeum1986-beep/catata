'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Bookmark,
  Star,
  Archive,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  CheckSquare,
  Tag,
  X,
  ImagePlus,
} from 'lucide-react';
import { db } from '@/lib/db';
import type { CategoryItem, NoteItem, PaperSurface } from '@/types/notebook';

interface NotesModuleProps {
  initialNoteId?: number | null;
  initialFilter?: 'all' | 'pinned' | 'favorite' | 'archived';
}

function normalizeHtmlBody(raw: string): string {
  if (!raw) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return raw.replace(/\n/g, '<br>');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
}

async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 880;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function NotesModule({
  initialNoteId = null,
  initialFilter = 'all',
}: NotesModuleProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(initialNoteId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<
    'all' | 'pinned' | 'favorite' | 'archived'
  >(initialFilter);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('Tersimpan otomatis');
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadNotesAndCategories = async (selectFirstIfNone = true) => {
    const allNotes = await db.notes.orderBy('updatedAt').reverse().toArray();
    const allCats = await db.categories.toArray();
    setNotes(allNotes);
    setCategories(allCats);

    if (initialNoteId) {
      setSelectedId(initialNoteId);
    } else if (selectFirstIfNone && allNotes.length > 0 && !selectedId) {
      const firstActive = allNotes.find((n) => !n.archived) || allNotes[0];
      setSelectedId(firstActive.id ?? null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setFilterMode(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    loadNotesAndCategories(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNoteId]);

  const activeNote = notes.find((n) => n.id === selectedId) || null;

  useEffect(() => {
    if (editorRef.current && activeNote) {
      editorRef.current.innerHTML = normalizeHtmlBody(activeNote.body);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNote?.id]);

  const handleCreateNote = async () => {
    const created: NoteItem = {
      title: 'Catatan Baru',
      body: '',
      category: 'Personal',
      tags: [],
      surface: 'ruled',
      images: [],
      pinned: false,
      favorite: false,
      archived: false,
      updatedAt: Date.now(),
    };
    const id = await db.notes.add(created);
    setFilterMode('all');
    setSelectedId(Number(id));
    setConfirmDelete(false);
    await loadNotesAndCategories(false);
  };

  const updateActiveNote = async (patch: Partial<NoteItem>) => {
    if (!activeNote?.id) return;
    setSaveStatus('Menyimpan...');
    const updatedFields = { ...patch, updatedAt: Date.now() };
    await db.notes.update(activeNote.id, updatedFields);
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNote.id ? { ...n, ...updatedFields } : n
      )
    );
    setTimeout(() => setSaveStatus('Tersimpan otomatis'), 250);
  };

  const handleRichInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    updateActiveNote({ body: html });
  };

  const applyRichCommand = (command: 'bold' | 'italic' | 'underline') => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false);
    handleRichInput();
  };

  const insertRichSnippet = (htmlSnippet: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertHTML', false, htmlSnippet);
    handleRichInput();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeNote) return;

    setSaveStatus('Memproses foto...');
    const compressedList: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const dataUrl = await compressImageToDataUrl(files[i]);
      compressedList.push(dataUrl);
    }

    const existing = activeNote.images || [];
    await updateActiveNote({ images: [...existing, ...compressedList] });
    e.target.value = '';
  };

  const handleRemovePhoto = async (indexToRemove: number) => {
    if (!activeNote) return;
    const existing = activeNote.images || [];
    await updateActiveNote({
      images: existing.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote || !newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().toLowerCase().replace(/^#/, '');
    const currentTags = activeNote.tags || [];
    if (!currentTags.includes(cleanTag)) {
      await updateActiveNote({ tags: [...currentTags, cleanTag] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!activeNote) return;
    const currentTags = activeNote.tags || [];
    await updateActiveNote({
      tags: currentTags.filter((t) => t !== tagToRemove),
    });
  };

  const handleDeleteNote = async () => {
    if (!activeNote?.id) return;
    await db.notes.delete(activeNote.id);
    setConfirmDelete(false);
    const remaining = notes.filter((n) => n.id !== activeNote.id);
    setNotes(remaining);
    setSelectedId(remaining.length > 0 ? remaining[0].id ?? null : null);
  };

  const filteredNotes = notes.filter((n) => {
    const plainBody = stripHtml(n.body).toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plainBody.includes(searchQuery.toLowerCase()) ||
      (n.tags || []).some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (!matchesSearch) return false;
    if (filterMode === 'archived') return n.archived;
    if (n.archived) return false;
    if (filterMode === 'pinned') return n.pinned;
    if (filterMode === 'favorite') return n.favorite;
    return true;
  });

  const pinnedList = filteredNotes.filter((n) => n.pinned);
  const regularList = filteredNotes.filter((n) => !n.pinned);

  const plainTextForCount = activeNote ? stripHtml(activeNote.body).trim() : '';
  const wordCount = plainTextForCount
    ? plainTextForCount.split(/\s+/).length
    : 0;

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex-1 min-h-0 xl:h-full xl:overflow-hidden grid grid-cols-1 xl:grid-cols-2">
      {/* ================= HALAMAN KIRI / ATAS (p. 28): INDEKS CATATAN ================= */}
      <div
        className="min-h-0 xl:h-full xl:overflow-y-auto notebook-scroll p-5 sm:p-8 xl:py-7 xl:pl-7 xl:pr-9 flex flex-col justify-between border-b xl:border-b-0"
        style={{ borderColor: 'var(--notebook-line)' }}
      >
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em] font-semibold"
                style={{ color: 'var(--faded-blue)' }}
              >
                POCKET ARCHIVE
              </p>
              <h2 className="font-display text-2xl font-bold">Notes</h2>
            </div>

            <button
              onClick={handleCreateNote}
              title="Buat catatan baru"
              className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm cursor-pointer"
              style={{ backgroundColor: 'var(--terracotta)', color: '#FAF7EF' }}
            >
              <Plus className="w-4 h-4" />
              <span>Baru</span>
            </button>
          </div>

          {/* Kolom Pencarian */}
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-2.5"
              style={{ color: 'var(--soft-graphite)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul, isi, atau #tag..."
              className="w-full text-xs sm:text-sm pl-8 pr-3 py-2 rounded-lg border focus:outline-none"
              style={{
                backgroundColor: 'var(--paper-cream)',
                borderColor: 'var(--notebook-line)',
              }}
            />
          </div>

          {/* Filter Tab Ringkas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'pinned', label: 'Pinned' },
              { id: 'favorite', label: 'Favorit' },
              { id: 'archived', label: 'Arsip' },
            ].map((tab) => {
              const active = filterMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setFilterMode(
                      tab.id as 'all' | 'pinned' | 'favorite' | 'archived'
                    )
                  }
                  className="text-[11px] px-2.5 py-1 rounded-md font-medium whitespace-nowrap cursor-pointer"
                  style={{
                    backgroundColor: active
                      ? 'var(--ink-black)'
                      : 'var(--paper-cream)',
                    color: active ? 'var(--warm-ivory)' : 'var(--soft-graphite)',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Daftar Catatan */}
          <div className="space-y-3.5">
            {isLoading ? (
              <div className="space-y-2 py-2">
                <div
                  className="h-12 rounded-lg animate-pulse"
                  style={{ backgroundColor: 'var(--paper-cream)' }}
                />
                <div
                  className="h-12 rounded-lg animate-pulse"
                  style={{ backgroundColor: 'var(--paper-cream)' }}
                />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div
                className="p-6 text-center rounded-xl border border-dashed"
                style={{
                  backgroundColor: 'var(--paper-cream)',
                  borderColor: 'var(--notebook-line)',
                }}
              >
                <p className="font-display text-base font-bold mb-1">
                  Halaman masih kosong
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--soft-graphite)' }}
                >
                  Klik tombol <strong>+ Baru</strong> di atas untuk mulai
                  menulis catatan.
                </p>
              </div>
            ) : (
              <>
                {pinnedList.length > 0 && filterMode === 'all' && (
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-widest font-semibold mb-1.5"
                      style={{ color: 'var(--soft-graphite)' }}
                    >
                      Pinned
                    </p>
                    <div
                      className="divide-y"
                      style={{ borderColor: 'var(--notebook-line)' }}
                    >
                      {pinnedList.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => {
                            setSelectedId(note.id ?? null);
                            setConfirmDelete(false);
                          }}
                          className="w-full text-left py-2 px-3 rounded-lg transition-colors cursor-pointer"
                          style={{
                            backgroundColor:
                              note.id === selectedId
                                ? 'var(--paper-cream)'
                                : 'transparent',
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-display text-sm font-bold truncate">
                              {note.title || 'Tanpa Judul'}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {note.favorite && (
                                <Star
                                  className="w-3 h-3 fill-current"
                                  style={{ color: 'var(--kraft-brown)' }}
                                />
                              )}
                              <Bookmark
                                className="w-3.5 h-3.5 fill-current"
                                style={{ color: 'var(--terracotta)' }}
                              />
                            </div>
                          </div>
                          <p
                            className="text-[11px] mt-0.5"
                            style={{ color: 'var(--soft-graphite)' }}
                          >
                            {formatDate(note.updatedAt)} • {note.category}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  {pinnedList.length > 0 && filterMode === 'all' && (
                    <p
                      className="text-[10px] uppercase tracking-widest font-semibold mb-1.5"
                      style={{ color: 'var(--soft-graphite)' }}
                    >
                      All Notes
                    </p>
                  )}
                  <div
                    className="divide-y"
                    style={{ borderColor: 'var(--notebook-line)' }}
                  >
                    {(filterMode === 'all' ? regularList : filteredNotes).map(
                      (note) => (
                        <button
                          key={note.id}
                          onClick={() => {
                            setSelectedId(note.id ?? null);
                            setConfirmDelete(false);
                          }}
                          className="w-full text-left py-2 px-3 rounded-lg transition-colors cursor-pointer"
                          style={{
                            backgroundColor:
                              note.id === selectedId
                                ? 'var(--paper-cream)'
                                : 'transparent',
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-display text-sm font-bold truncate">
                              {note.title || 'Tanpa Judul'}
                            </h4>
                            {note.favorite && (
                              <Star
                                className="w-3 h-3 fill-current flex-shrink-0"
                                style={{ color: 'var(--kraft-brown)' }}
                              />
                            )}
                          </div>
                          <p
                            className="text-[11px] mt-0.5"
                            style={{ color: 'var(--soft-graphite)' }}
                          >
                            {formatDate(note.updatedAt)} • {note.category}
                          </p>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="hidden xl:block text-center font-display text-xs mt-3 opacity-60">
          — 28 —
        </p>
      </div>

      {/* ================= HALAMAN KANAN / BAWAH (p. 29): EDITOR KERTAS ================= */}
      <div className="min-h-0 xl:h-full xl:overflow-y-auto notebook-scroll p-5 sm:p-8 xl:py-7 xl:pr-7 xl:pl-9 flex flex-col justify-between">
        {!activeNote ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <p className="font-display text-lg font-bold mb-1">
              Pilih atau buat catatan baru
            </p>
            <p className="text-xs" style={{ color: 'var(--soft-graphite)' }}>
              Setiap tulisan dan foto tersimpan otomatis di dalam buku sakumu.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-3">
            {/* Bar Kontrol Atas: Bookmark Pin, Favorit, Arsip, Kategori, & Pilihan Kertas */}
            <div
              className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b"
              style={{ borderColor: 'var(--notebook-line)' }}
            >
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateActiveNote({ pinned: !activeNote.pinned })}
                  title="Tandai Pinned Note"
                  className="p-1.5 rounded-md border cursor-pointer"
                  style={{
                    backgroundColor: activeNote.pinned
                      ? 'var(--terracotta)'
                      : 'var(--paper-cream)',
                    borderColor: activeNote.pinned
                      ? 'var(--terracotta)'
                      : 'var(--notebook-line)',
                    color: activeNote.pinned ? '#FAF7EF' : 'var(--ink-black)',
                  }}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      activeNote.pinned ? 'fill-current' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() =>
                    updateActiveNote({ favorite: !activeNote.favorite })
                  }
                  title="Tandai Favorit"
                  className="p-1.5 rounded-md border cursor-pointer"
                  style={{
                    backgroundColor: activeNote.favorite
                      ? 'var(--kraft-brown)'
                      : 'var(--paper-cream)',
                    borderColor: activeNote.favorite
                      ? 'var(--kraft-brown)'
                      : 'var(--notebook-line)',
                    color: activeNote.favorite ? '#FAF7EF' : 'var(--ink-black)',
                  }}
                >
                  <Star className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() =>
                    updateActiveNote({ archived: !activeNote.archived })
                  }
                  title={
                    activeNote.archived
                      ? 'Keluarkan dari Arsip'
                      : 'Arsipkan Catatan'
                  }
                  className="p-1.5 rounded-md border cursor-pointer"
                  style={{
                    backgroundColor: activeNote.archived
                      ? 'var(--faded-blue)'
                      : 'var(--paper-cream)',
                    borderColor: 'var(--notebook-line)',
                    color: activeNote.archived ? '#FAF7EF' : 'var(--ink-black)',
                  }}
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>

                {/* Pilihan Kategori */}
                <select
                  value={activeNote.category}
                  onChange={(e) =>
                    updateActiveNote({ category: e.target.value })
                  }
                  className="text-xs px-2 py-1.5 rounded-md border font-medium focus:outline-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--paper-cream)',
                    borderColor: 'var(--notebook-line)',
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pemilih 5 Tekstur Kertas */}
              <div className="flex items-center gap-0.5 text-[11px]">
                {(
                  ['ruled', 'dotted', 'grid', 'blank', 'kraft'] as PaperSurface[]
                ).map((surf) => {
                  const isActive = activeNote.surface === surf;
                  return (
                    <button
                      key={surf}
                      onClick={() => updateActiveNote({ surface: surf })}
                      className="px-1.5 py-1 rounded capitalize font-medium cursor-pointer"
                      style={{
                        backgroundColor: isActive
                          ? 'var(--ink-black)'
                          : 'transparent',
                        color: isActive
                          ? 'var(--warm-ivory)'
                          : 'var(--soft-graphite)',
                      }}
                    >
                      {surf}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permukaan Kertas Catatan */}
            <div
              className={`surface-${activeNote.surface} flex-1 rounded-xl p-4 sm:p-5 border flex flex-col min-h-[260px]`}
              style={{ borderColor: 'var(--notebook-line)' }}
            >
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => updateActiveNote({ title: e.target.value })}
                  placeholder="Judul catatan..."
                  className="font-display text-xl sm:text-2xl font-bold bg-transparent w-full focus:outline-none"
                />
                <span
                  className="text-[11px] whitespace-nowrap"
                  style={{ color: 'var(--soft-graphite)' }}
                >
                  {formatDate(activeNote.updatedAt)}
                </span>
              </div>

              {/* Area Ketik Kaya Format (Bold, Italic, Underscore) */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleRichInput}
                data-placeholder="Tuangkan pemikiranmu di halaman ini..."
                className="rich-note-editor font-note-content notebook-scroll w-full flex-1 overflow-y-auto bg-transparent focus:outline-none min-h-[150px]"
              />

              {/* Galeri Lampiran Foto di Dalam Kertas */}
              {activeNote.images && activeNote.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 mt-2">
                  {activeNote.images.map((imgSrc, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-lg overflow-hidden border p-1 shadow-xs"
                      style={{
                        backgroundColor: 'var(--paper-cream)',
                        borderColor: 'var(--notebook-line)',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgSrc}
                        alt={`Lampiran ${idx + 1}`}
                        onClick={() => setPreviewPhoto(imgSrc)}
                        className="w-full h-24 object-cover rounded cursor-zoom-in"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        title="Hapus foto"
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Baris Tags di Bagian Bawah Kertas */}
              <div
                className="pt-2 mt-2 border-t flex flex-wrap items-center gap-1.5"
                style={{ borderColor: 'var(--notebook-line)' }}
              >
                <Tag
                  className="w-3 h-3"
                  style={{ color: 'var(--soft-graphite)' }}
                />
                {(activeNote.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--paper-cream)',
                      color: 'var(--ink-black)',
                    }}
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <form onSubmit={handleAddTag} className="inline-flex">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="+ tag"
                    className="text-[11px] w-16 bg-transparent focus:outline-none"
                    style={{ color: 'var(--soft-graphite)' }}
                  />
                </form>
              </div>
            </div>

            {/* Toolbar Format Bawah: Bold, Italic, Underscore, List, Checklist, Upload Foto, & Hapus */}
            <div
              className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs"
              style={{ color: 'var(--soft-graphite)' }}
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyRichCommand('bold');
                  }}
                  title="Tebal (Bold)"
                  className="w-7 h-7 rounded border flex items-center justify-center cursor-pointer hover:opacity-85"
                  style={{
                    borderColor: 'var(--notebook-line)',
                    backgroundColor: 'var(--paper-cream)',
                  }}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyRichCommand('italic');
                  }}
                  title="Miring (Italic)"
                  className="w-7 h-7 rounded border flex items-center justify-center cursor-pointer hover:opacity-85"
                  style={{
                    borderColor: 'var(--notebook-line)',
                    backgroundColor: 'var(--paper-cream)',
                  }}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyRichCommand('underline');
                  }}
                  title="Garis Bawah (Underscore)"
                  className="w-7 h-7 rounded border flex items-center justify-center cursor-pointer hover:opacity-85"
                  style={{
                    borderColor: 'var(--notebook-line)',
                    backgroundColor: 'var(--paper-cream)',
                  }}
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertRichSnippet('<br>• ');
                  }}
                  title="Daftar Poin"
                  className="w-7 h-7 rounded border flex items-center justify-center cursor-pointer hover:opacity-85"
                  style={{
                    borderColor: 'var(--notebook-line)',
                    backgroundColor: 'var(--paper-cream)',
                  }}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertRichSnippet('<br>☐ ');
                  }}
                  title="Checklist"
                  className="w-7 h-7 rounded border flex items-center justify-center cursor-pointer hover:opacity-85"
                  style={{
                    borderColor: 'var(--notebook-line)',
                    backgroundColor: 'var(--paper-cream)',
                  }}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>

                {/* Tombol Upload Foto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Unggah Foto ke Catatan"
                  className="h-7 px-2 rounded border flex items-center gap-1 text-[11px] font-medium cursor-pointer hover:opacity-85"
                  style={{
                    borderColor: 'var(--notebook-line)',
                    backgroundColor: 'var(--paper-cream)',
                    color: 'var(--ink-black)',
                  }}
                >
                  <ImagePlus
                    className="w-3.5 h-3.5"
                    style={{ color: 'var(--terracotta)' }}
                  />
                  <span>Foto</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span>
                  {wordCount} words • {saveStatus}
                </span>

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    title="Hapus catatan"
                    className="p-1.5 rounded hover:opacity-80 cursor-pointer"
                    style={{ color: 'var(--vintage-red)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleDeleteNote}
                      className="text-[11px] px-2 py-0.5 rounded text-white cursor-pointer"
                      style={{ backgroundColor: 'var(--vintage-red)' }}
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-[11px] px-2 py-0.5 rounded border cursor-pointer"
                      style={{ borderColor: 'var(--notebook-line)' }}
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="hidden xl:block text-center font-display text-xs mt-3 opacity-60">
          — 29 —
        </p>
      </div>

      {/* Modal Perbesar Foto */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 cursor-zoom-out"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewPhoto}
            alt="Pratinjau foto"
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl border-4 border-white/20"
          />
        </div>
      )}
    </div>
  );
}