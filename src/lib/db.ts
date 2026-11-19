import Dexie, { type EntityTable } from 'dexie';
import type {
  CategoryItem,
  NoteItem,
  TaskItem,
  UserSetting,
} from '@/types/notebook';

const db = new Dexie('CatataPocketDB') as Dexie & {
  tasks: EntityTable<TaskItem, 'id'>;
  notes: EntityTable<NoteItem, 'id'>;
  categories: EntityTable<CategoryItem, 'id'>;
  settings: EntityTable<UserSetting, 'key'>;
};

db.version(2).stores({
  tasks: '++id, dayKey, done, priority, createdAt',
  notes: '++id, category, pinned, favorite, archived, updatedAt',
  categories: '++id, &name',
  settings: 'key',
});

export async function initializeDefaultData() {
  if (typeof window === 'undefined') return;

  // 1. Seed tugas Today jika kosong
  const todayCount = await db.tasks.where('dayKey').equals('today').count();
  if (todayCount === 0) {
    await db.tasks.bulkAdd([
      {
        text: 'Finish landing page & UI concept',
        done: true,
        dayKey: 'today',
        priority: 'high',
        createdAt: Date.now() - 4000,
      },
      {
        text: 'Review palet warna Warm Ivory & Terracotta',
        done: true,
        dayKey: 'today',
        priority: 'medium',
        createdAt: Date.now() - 3000,
      },
      {
        text: 'Workout 30 mins sore ini',
        done: true,
        dayKey: 'today',
        priority: 'medium',
        createdAt: Date.now() - 2000,
      },
      {
        text: 'Read 10 pages sebelum tidur',
        done: false,
        dayKey: 'today',
        priority: 'low',
        createdAt: Date.now() - 1000,
      },
      {
        text: 'Buy groceries & biji kopi favorit',
        done: false,
        dayKey: 'today',
        priority: 'low',
        createdAt: Date.now(),
      },
    ]);
  }

  // 2. Seed jadwal contoh Weekly Planner (Minggu 16 - 22 Nov 2026)
  const monCount = await db.tasks.where('dayKey').equals('2026-11-16').count();
  if (monCount === 0) {
    await db.tasks.bulkAdd([
      {
        text: 'Design meeting & konsep buku saku',
        done: true,
        dayKey: '2026-11-16',
        priority: 'high',
        createdAt: Date.now() - 9000,
      },
      {
        text: 'Client review & update palet warna',
        done: true,
        dayKey: '2026-11-17',
        priority: 'medium',
        createdAt: Date.now() - 8000,
      },
      {
        text: 'Workout 30 mins',
        done: true,
        dayKey: '2026-11-18',
        priority: 'medium',
        createdAt: Date.now() - 7000,
      },
      {
        text: 'Rakit modul Notes, Planner & Collection',
        done: false,
        dayKey: '2026-11-19',
        priority: 'high',
        createdAt: Date.now() - 6000,
      },
      {
        text: 'Uji coba offline mode & backup catatan',
        done: false,
        dayKey: '2026-11-20',
        priority: 'medium',
        createdAt: Date.now() - 5000,
      },
      {
        text: 'Grocery shopping & beli biji kopi',
        done: false,
        dayKey: '2026-11-21',
        priority: 'low',
        createdAt: Date.now() - 4000,
      },
      {
        text: 'Rest & Reflect evaluasi mingguan',
        done: false,
        dayKey: '2026-11-22',
        priority: 'low',
        createdAt: Date.now() - 3000,
      },
    ]);
  }

  // 3. Seed kategori default Collection
  const catCount = await db.categories.count();
  if (catCount === 0) {
    await db.categories.bulkAdd([
      {
        name: 'Personal',
        color: '#B87561',
        description: 'Catatan pribadi, refleksi harian, dan daftar buku.',
      },
      {
        name: 'Work',
        color: '#9EAFB5',
        description: 'Catatan rapat, jadwal kerja, dan target profesional.',
      },
      {
        name: 'Ideas',
        color: '#B69A76',
        description: 'Percikan ide kreatif, konsep desain, dan inspirasi.',
      },
      {
        name: 'Projects',
        color: '#777D60',
        description: 'Rencana bertahap dan checklist proyek yang berjalan.',
      },
      {
        name: 'Journal',
        color: '#AD6B62',
        description: 'Catatan perjalanan dan pemikiran dari waktu ke waktu.',
      },
      {
        name: 'Important',
        color: '#292923',
        description: 'Informasi penting yang perlu selalu mudah ditemukan.',
      },
    ]);
  }

  // 4. Seed catatan awal jika kosong
  const noteCount = await db.notes.count();
  if (noteCount === 0) {
    await db.notes.bulkAdd([
      {
        title: 'Landing Page Ideas',
        body: 'Hero Section:\n• Clean & warm paper aesthetic\n• Strong Fraunces editorial headline\n• Call to action yang tenang & jelas\n\nFeatures:\n• Simple & offline-first\n• Fast pocket capture\n• Always with you',
        category: 'Ideas',
        tags: ['design', 'pwa'],
        surface: 'ruled',
        pinned: true,
        favorite: true,
        archived: false,
        updatedAt: Date.now(),
      },
      {
        title: 'Quotes Favorit',
        body: '"Your little space to think, plan, and remember."\n\nMenulis di atas kertas membantu pikiran melambat dan lebih jernih.',
        category: 'Personal',
        tags: ['mindfulness'],
        surface: 'kraft',
        pinned: true,
        favorite: false,
        archived: false,
        updatedAt: Date.now() - 5000,
      },
      {
        title: 'Project Brainstorm: Catata Apps',
        body: '☐ Setup Next.js + Tailwind CSS\n☐ Simpan otomatis ke IndexedDB lokal\n☐ 5 pilihan tekstur kertas catatan\n☐ Installable di Android & iOS',
        category: 'Projects',
        tags: ['app', 'roadmap'],
        surface: 'dotted',
        pinned: false,
        favorite: true,
        archived: false,
        updatedAt: Date.now() - 10000,
      },
      {
        title: 'Daftar Bacaan 2026',
        body: '1. The Design of Everyday Things — Don Norman\n2. Steal Like an Artist — Austin Kleon\n3. Atomic Habits — James Clear',
        category: 'Journal',
        tags: ['books'],
        surface: 'grid',
        pinned: false,
        favorite: false,
        archived: false,
        updatedAt: Date.now() - 15000,
      },
    ]);
  }

  // 5. Seed pengaturan default
  const defaults: UserSetting[] = [
    { key: 'dailyFocus', value: 'Finish design project & workout' },
    {
      key: 'quickNote',
      value: 'Jangan lupa beli kopi favorit & istirahat sejenak!',
    },
    {
      key: 'weeklyGoal',
      value: 'Menyelesaikan seluruh modul utama Catata Apps',
    },
    {
      key: 'weeklyNote',
      value: "Don't forget to take breaks & enjoy your coffee!",
    },
  ];

  for (const item of defaults) {
    const existing = await db.settings.get(item.key);
    if (!existing) {
      await db.settings.put(item);
    }
  }
}

export { db };