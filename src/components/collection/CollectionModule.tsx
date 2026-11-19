'use client';

import React, { useEffect, useState } from 'react';
import {
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  FileText,
  Plus,
  Palette,
} from 'lucide-react';
import { db } from '@/lib/db';
import type { CategoryItem, NoteItem } from '@/types/notebook';

interface CollectionModuleProps {
  onOpenNoteInEditor: (noteId: number) => void;
}

const SWATCH_COLORS = [
  '#B87561', // Terracotta
  '#9EAFB5', // Faded Blue
  '#B69A76', // Kraft Brown
  '#777D60', // Muted Olive
  '#AD6B62', // Vintage Red
  '#5A6B7C', // Slate Blue
  '#8B6F8E', // Dusty Plum
  '#292923', // Ink Black
];

export default function CollectionModule({
  onOpenNoteInEditor,
}: CollectionModuleProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Notes');
  const [showNewForm, setShowNewForm] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatDesc, setNewCatDesc] = useState<string>('');
  const [newCatColor, setNewCatColor] = useState<string>(SWATCH_COLORS[0]);
  const [editingColorCatId, setEditingColorCatId] = useState<number | null>(
    null
  );

  const loadData = async () => {
    const allCats = await db.categories.toArray();
    const allNotes = await db.notes.orderBy('updatedAt').reverse().toArray();
    setCategories(allCats);
    setNotes(allNotes.filter((n) => !n.archived));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const cleanName = newCatName.trim();
    const exists = categories.some(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      setSelectedCategory(cleanName);
      setShowNewForm(false);
      return;
    }

    await db.categories.add({
      name: cleanName,
      color: newCatColor,
      description: newCatDesc.trim() || 'Folder catatan pribadi.',
    });

    setNewCatName('');
    setNewCatDesc('');
    setShowNewForm(false);
    setSelectedCategory(cleanName);
    await loadData();
  };

  const handleUpdateFolderColor = async (catId: number, hexColor: string) => {
    await db.categories.update(catId, { color: hexColor });
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, color: hexColor } : c))
    );
    setEditingColorCatId(null);
  };

  const handleCreateNoteInCategory = async () => {
    const targetCat =
      selectedCategory === 'All Notes' ? 'Personal' : selectedCategory;
    const id = await db.notes.add({
      title: `Catatan ${targetCat} Baru`,
      body: '',
      category: targetCat,
      tags: [],
      surface: 'ruled',
      images: [],
      pinned: false,
      favorite: false,
      archived: false,
      updatedAt: Date.now(),
    });
    onOpenNoteInEditor(Number(id));
  };

  const filteredNotes =
    selectedCategory === 'All Notes'
      ? notes
      : notes.filter(
          (n) => n.category.toLowerCase() === selectedCategory.toLowerCase()
        );

  const activeCategoryObj = categories.find(
    (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <div className="flex-1 min-h-0 xl:h-full xl:overflow-hidden grid grid-cols-1 xl:grid-cols-2">
      {/* ================= HALAMAN KIRI / ATAS (p. 30): INDEKS FOLDER KOLEKSI ================= */}
      <div
        className="min-h-0 xl:h-full xl:overflow-y-auto notebook-scroll p-5 sm:p-8 xl:py-7 xl:pl-7 xl:pr-9 flex flex-col justify-between border-b xl:border-b-0"
        style={{ borderColor: 'var(--notebook-line)' }}
      >
        <div className="space-y-3.5">
          <div
            className="flex items-center justify-between pb-2.5 border-b"
            style={{ borderColor: 'var(--notebook-line)' }}
          >
            <div>
              <h2 className="font-display text-2xl font-bold">Collection</h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--soft-graphite)' }}
              >
                Folder &amp; indeks kategori buku saku
              </p>
            </div>

            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--terracotta)', color: '#FAF7EF' }}
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Folder Baru</span>
            </button>
          </div>

          {showNewForm && (
            <form
              onSubmit={handleAddCategory}
              className="p-3.5 rounded-xl border space-y-2.5"
              style={{
                backgroundColor: 'var(--paper-cream)',
                borderColor: 'var(--kraft-brown)',
              }}
            >
              <div className="flex items-center gap-2">
                <Folder
                  className="w-5 h-5 flex-shrink-0 fill-current"
                  style={{ color: newCatColor }}
                />
                <input
                  type="text"
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nama folder baru (misal: Keuangan)..."
                  className="w-full text-xs sm:text-sm px-2.5 py-1.5 rounded border bg-transparent focus:outline-none"
                  style={{ borderColor: 'var(--notebook-line)' }}
                />
              </div>

              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Deskripsi singkat folder..."
                className="w-full text-xs px-2.5 py-1.5 rounded border bg-transparent focus:outline-none"
                style={{ borderColor: 'var(--notebook-line)' }}
              />

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  {SWATCH_COLORS.map((hex) => (
                    <button
                      type="button"
                      key={hex}
                      onClick={() => setNewCatColor(hex)}
                      title="Pilih warna folder"
                      className="w-5 h-5 rounded-full cursor-pointer border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: hex,
                        borderColor:
                          newCatColor === hex
                            ? 'var(--ink-black)'
                            : 'transparent',
                      }}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  className="text-xs px-3 py-1 rounded-md font-medium cursor-pointer"
                  style={{
                    backgroundColor: 'var(--ink-black)',
                    color: 'var(--warm-ivory)',
                  }}
                >
                  Simpan
                </button>
              </div>
            </form>
          )}

          {/* Daftar Folder */}
          <div
            className="divide-y"
            style={{ borderColor: 'var(--notebook-line)' }}
          >
            {/* Folder Semua Catatan */}
            <button
              onClick={() => setSelectedCategory('All Notes')}
              className="w-full py-2.5 px-3 flex items-center justify-between rounded-lg transition-colors cursor-pointer"
              style={{
                backgroundColor:
                  selectedCategory === 'All Notes'
                    ? 'var(--paper-cream)'
                    : 'transparent',
              }}
            >
              <div className="flex items-center gap-3 text-left">
                {selectedCategory === 'All Notes' ? (
                  <FolderOpen
                    className="w-5 h-5 flex-shrink-0 fill-current"
                    style={{ color: 'var(--ink-black)' }}
                  />
                ) : (
                  <Folder
                    className="w-5 h-5 flex-shrink-0 fill-current"
                    style={{ color: 'var(--ink-black)' }}
                  />
                )}
                <div>
                  <p className="font-display text-sm font-bold">All Notes</p>
                  <p
                    className="text-[11px]"
                    style={{ color: 'var(--soft-graphite)' }}
                  >
                    {notes.length} notes aktif
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-45" />
            </button>

            {/* Daftar Folder Kategori dengan Ikon Folder & Ubah Warna */}
            {categories.map((cat) => {
              const count = notes.filter(
                (n) => n.category.toLowerCase() === cat.name.toLowerCase()
              ).length;
              const isSelected = selectedCategory === cat.name;
              const isEditingThisColor = editingColorCatId === cat.id;

              return (
                <div key={cat.id ?? cat.name} className="py-1">
                  <div
                    className="w-full py-2 px-3 flex items-center justify-between rounded-lg transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--paper-cream)'
                        : 'transparent',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                    >
                      {isSelected ? (
                        <FolderOpen
                          className="w-5 h-5 flex-shrink-0 fill-current transition-transform scale-105"
                          style={{ color: cat.color }}
                        />
                      ) : (
                        <Folder
                          className="w-5 h-5 flex-shrink-0 fill-current"
                          style={{ color: cat.color }}
                        />
                      )}
                      <div>
                        <p className="font-display text-sm font-bold">
                          {cat.name}
                        </p>
                        <p
                          className="text-[11px]"
                          style={{ color: 'var(--soft-graphite)' }}
                        >
                          {count} notes • {cat.description}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {cat.id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingColorCatId(
                              isEditingThisColor ? null : cat.id ?? null
                            );
                          }}
                          title="Ubah warna folder"
                          className="p-1.5 rounded-md hover:bg-black/5 cursor-pointer"
                          style={{ color: 'var(--soft-graphite)' }}
                        >
                          <Palette className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
                        className="cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4 opacity-45" />
                      </button>
                    </div>
                  </div>

                  {/* Palet Ubah Warna Folder Inline */}
                  {isEditingThisColor && cat.id && (
                    <div
                      className="mx-3 mb-2 p-2 rounded-lg border flex items-center justify-between gap-2"
                      style={{
                        backgroundColor: 'var(--warm-ivory)',
                        borderColor: 'var(--notebook-line)',
                      }}
                    >
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: 'var(--soft-graphite)' }}
                      >
                        Warna Folder:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {SWATCH_COLORS.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() =>
                              handleUpdateFolderColor(cat.id!, hex)
                            }
                            className="w-4 h-4 rounded-full cursor-pointer border"
                            style={{
                              backgroundColor: hex,
                              borderColor:
                                cat.color === hex
                                  ? 'var(--ink-black)'
                                  : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="hidden xl:block text-center font-display text-xs mt-4 opacity-60">
          — 30 —
        </p>
      </div>

      {/* ================= HALAMAN KANAN / BAWAH (p. 31): ISI RAK FOLDER ================= */}
      <div className="min-h-0 xl:h-full xl:overflow-y-auto notebook-scroll p-5 sm:p-8 xl:py-7 xl:pr-7 xl:pl-9 flex flex-col justify-between">
        <div className="space-y-3.5">
          <div
            className="pb-2.5 border-b flex items-center justify-between gap-2"
            style={{ borderColor: 'var(--notebook-line)' }}
          >
            <div className="flex items-center gap-2.5">
              <FolderOpen
                className="w-6 h-6 fill-current"
                style={{
                  color: activeCategoryObj?.color || 'var(--terracotta)',
                }}
              />
              <div>
                <span
                  className="text-[10px] uppercase tracking-widest font-semibold block"
                  style={{ color: 'var(--terracotta)' }}
                >
                  Isi Folder
                </span>
                <h3 className="font-display text-xl font-bold leading-tight">
                  {selectedCategory}
                </h3>
              </div>
            </div>

            <button
              onClick={handleCreateNoteInCategory}
              className="text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1 cursor-pointer"
              style={{
                backgroundColor: 'var(--paper-cream)',
                borderColor: 'var(--notebook-line)',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tulis di sini</span>
            </button>
          </div>

          {filteredNotes.length === 0 ? (
            <div
              className="p-8 text-center rounded-xl border border-dashed space-y-2"
              style={{
                backgroundColor: 'var(--paper-cream)',
                borderColor: 'var(--notebook-line)',
              }}
            >
              <FileText
                className="w-6 h-6 mx-auto opacity-50"
                style={{ color: 'var(--soft-graphite)' }}
              />
              <p className="font-display text-base font-bold">
                Folder {selectedCategory} masih kosong
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--soft-graphite)' }}
              >
                Klik tombol <strong>+ Tulis di sini</strong> untuk menambahkan
                catatan pertama di dalam folder ini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredNotes.map((note) => {
                const cleanPreview = note.body
                  .replace(/<[^>]*>/g, ' ')
                  .replace(/&nbsp;/g, ' ')
                  .trim();
                return (
                  <button
                    key={note.id}
                    onClick={() => note.id && onOpenNoteInEditor(note.id)}
                    className="w-full text-left p-3.5 rounded-xl border transition-transform hover:-translate-y-0.5 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--paper-cream)',
                      borderColor: 'var(--notebook-line)',
                    }}
                  >
                    <div
                      className="flex items-center justify-between text-[11px] mb-1"
                      style={{ color: 'var(--soft-graphite)' }}
                    >
                      <span className="font-medium">{note.category}</span>
                      <span>
                        {new Date(note.updatedAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h4 className="font-display text-base font-bold mb-1">
                      {note.title || 'Tanpa Judul'}
                    </h4>
                    <p className="font-note-content line-clamp-2 opacity-80">
                      {cleanPreview || 'Catatan kosong...'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="hidden xl:block text-center font-display text-xs mt-4 opacity-60">
          — 31 —
        </p>
      </div>
    </div>
  );
}