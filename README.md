# Catata. — Personal Pocket Notebook

**Your Pocket. Your Space.**

Aplikasi buku saku digital *offline-first* (PWA) dengan nuansa kertas hangat dan skeuomorphic realistis untuk mencatat ide harian, mengatur agenda mingguan, serta menyimpan arsip koleksi pribadi langsung di perangkat Anda.

## Fitur Utama

- **Sampul Buku Fisik Interaktif:** Dilengkapi efek tulang punggung buku, tumpukan tepi halaman, karet pengikat, pilihan 5 warna *skin* sampul, serta opsi kunci PIN pribadi.
- **Today Spread:** Fokus harian (*Daily Focus*), daftar tugas interaktif dengan indikator progres mingguan, serta *Quick Note* bertekstur kertas kraft.
- **Notes Editor Lengkap:** Mendukung 5 permukaan kertas (*Ruled*, *Dotted*, *Grid*, *Blank*, *Kraft*), format teks (*Bold*, *Italic*, *Underline*, daftar poin/angka), penyisipan gambar/foto lokal, *Pin*, *Favorite*, dan *Archive*.
- **Weekly Planner:** Perencanaan agenda mingguan dari Senin hingga Minggu yang tersimpan otomatis.
- **Collection & Index:** Pengelompokan catatan berdasarkan kategori warna beserta pencarian cepat.
- **Mode Kertas & Tipografi:** Beralih antara tulisan tangan (*Caveat*) dan huruf rapi (*DM Sans*), pengaturan ukuran font, serta *Day Ivory* / *Night Paper Mode*.
- **100% Offline-First & Backup JSON:** Seluruh data tersimpan di IndexedDB perangkat dan dapat dicadangkan maupun dipulihkan kapan saja melalui file JSON.

## Teknologi yang Digunakan

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database Lokal:** Dexie.js (IndexedDB)
- **Offline & Installable:** Web App Manifest & Service Worker (PWA)
- **Hosting:** Vercel