export type ModuleTab =
  | 'today'
  | 'notes'
  | 'planner'
  | 'collection'
  | 'settings';

export type PaperSurface = 'ruled' | 'dotted' | 'grid' | 'blank' | 'kraft';

export type PaperStyle = PaperSurface;

export type AppLanguage = 'id' | 'en';

export type NoteFontSize = 'sm' | 'md' | 'lg';

export type BookSkinId =
  | 'leather'
  | 'terracotta'
  | 'olive'
  | 'midnight'
  | 'navy';

export interface NoteItem {
  id?: number;
  title: string;
  body: string;
  category: string;
  tags?: string[];
  surface?: PaperSurface;
  pinned?: boolean;
  favorite?: boolean;
  archived?: boolean;
  images?: string[];
  createdAt?: number;
  updatedAt: number;
}

export interface TaskItem {
  id?: number;
  text: string;
  done: boolean;
  dayKey: string;
  time?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt?: number;
}

export interface CategoryItem {
  id?: number;
  name: string;
  color: string;
  icon?: string;
  description?: string;
}

export interface UserSetting {
  key: string;
  value: string;
}

export type SettingItem = UserSetting;