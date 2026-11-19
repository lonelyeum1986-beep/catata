'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  ArrowRight,
  X,
} from 'lucide-react';
import { db } from '@/lib/db';
import type { TaskItem } from '@/types/notebook';

interface DayColumn {
  dateISO: string;
  dayNum: string;
  dayShort: string;
  isToday: boolean;
}

function buildWeekDays(weekOffset: number): {
  days: DayColumn[];
  rangeLabel: string;
} {
  const baseMonday = new Date(2026, 10, 16 + weekOffset * 7);
  const shortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days: DayColumn[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseMonday);
    d.setDate(baseMonday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateISO = `${yyyy}-${mm}-${dd}`;

    days.push({
      dateISO,
      dayNum: dd,
      dayShort: shortNames[i],
      isToday: dateISO === '2026-11-19',
    });
  }

  const first = new Date(baseMonday);
  const last = new Date(baseMonday);
  last.setDate(baseMonday.getDate() + 6);

  const monthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const rangeLabel = `${first.getDate()} – ${last.getDate()} ${monthFormatter.format(last)}`;

  return { days, rangeLabel };
}

export default function PlannerModule() {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [weekTasks, setWeekTasks] = useState<TaskItem[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<string>(
    'Menyelesaikan seluruh modul utama Catata PWA'
  );
  const [weeklyNote, setWeeklyNote] = useState<string>(
    "Don't forget to take breaks & enjoy your coffee!"
  );
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [draftTaskText, setDraftTaskText] = useState<string>('');
  const [draftPriority, setDraftPriority] = useState<'low' | 'medium' | 'high'>(
    'medium'
  );

  const { days, rangeLabel } = buildWeekDays(weekOffset);
  const dayKeys = days.map((d) => d.dateISO);

  const loadWeekData = async () => {
    const found = await db.tasks.where('dayKey').anyOf(dayKeys).toArray();
    setWeekTasks(found);

    const savedGoal = await db.settings.get(`weeklyGoal_${weekOffset}`);
    const defaultGoal = await db.settings.get('weeklyGoal');
    setWeeklyGoal(
      savedGoal?.value ??
        (weekOffset === 0
          ? defaultGoal?.value ?? ''
          : 'Fokus utama minggu ini...')
    );

    const savedNote = await db.settings.get(`weeklyNote_${weekOffset}`);
    const defaultNote = await db.settings.get('weeklyNote');
    setWeeklyNote(
      savedNote?.value ??
        (weekOffset === 0
          ? defaultNote?.value ?? ''
          : 'Catatan & pengingat minggu ini...')
    );
  };

  useEffect(() => {
    loadWeekData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const handleSaveGoal = async (val: string) => {
    setWeeklyGoal(val);
    await db.settings.put({ key: `weeklyGoal_${weekOffset}`, value: val });
  };

  const handleSaveWeeklyNote = async (val: string) => {
    setWeeklyNote(val);
    await db.settings.put({ key: `weeklyNote_${weekOffset}`, value: val });
  };

  const handleCreateDayTask = async (e: React.FormEvent, dateISO: string) => {
    e.preventDefault();
    if (!draftTaskText.trim()) return;

    const newItem: TaskItem = {
      text: draftTaskText.trim(),
      done: false,
      dayKey: dateISO,
      priority: draftPriority,
      createdAt: Date.now(),
    };
    const id = await db.tasks.add(newItem);
    setWeekTasks((prev) => [...prev, { ...newItem, id: Number(id) }]);
    setDraftTaskText('');
    setAddingDay(null);
  };

  const handleToggleTask = async (task: TaskItem) => {
    if (!task.id) return;
    const nextDone = !task.done;
    await db.tasks.update(task.id, { done: nextDone });
    setWeekTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: nextDone } : t))
    );
  };

  const handleMoveToNextDay = async (task: TaskItem, currentIndex: number) => {
    if (!task.id) return;
    const nextIndex = (currentIndex + 1) % 7;
    const nextDayISO = days[nextIndex].dateISO;
    await db.tasks.update(task.id, { dayKey: nextDayISO });
    setWeekTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, dayKey: nextDayISO } : t))
    );
  };

  const handleDeleteTask = async (id?: number) => {
    if (!id) return;
    await db.tasks.delete(id);
    setWeekTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const totalWeekTasks = weekTasks.length;
  const doneWeekTasks = weekTasks.filter((t) => t.done).length;
  const weekPct =
    totalWeekTasks > 0 ? Math.round((doneWeekTasks / totalWeekTasks) * 100) : 0;

  const leftIndices = [0, 1, 3, 6];
  const rightIndices = [2, 4, 5];

  const renderDayCard = (dayIndex: number) => {
    const day = days[dayIndex];
    const items = weekTasks.filter((t) => t.dayKey === day.dateISO);

    return (
      <div
        key={day.dateISO}
        className="p-3 rounded-xl border flex flex-col justify-between min-h-[132px]"
        style={{
          backgroundColor: day.isToday ? 'var(--paper-cream)' : 'transparent',
          borderColor: day.isToday
            ? 'var(--terracotta)'
            : 'var(--notebook-line)',
        }}
      >
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="flex items-baseline gap-2">
              <span
                className="font-display text-2xl font-bold"
                style={{
                  color: day.isToday ? 'var(--terracotta)' : 'var(--ink-black)',
                }}
              >
                {day.dayNum}
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--soft-graphite)' }}
              >
                {day.dayShort}
              </span>
            </div>

            <button
              onClick={() => {
                setAddingDay(addingDay === day.dateISO ? null : day.dateISO);
                setDraftTaskText('');
              }}
              title="Tambah agenda"
              className="p-1 rounded hover:opacity-75 cursor-pointer"
              style={{ color: 'var(--soft-graphite)' }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <ul className="space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-1 group"
              >
                <button
                  onClick={() => handleToggleTask(item)}
                  className="flex items-start gap-2 text-left flex-1 cursor-pointer"
                >
                  <span
                    className="mt-1 w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: item.done
                        ? 'var(--muted-olive)'
                        : item.priority === 'high'
                        ? 'var(--terracotta)'
                        : 'var(--soft-graphite)',
                      backgroundColor: item.done
                        ? 'var(--muted-olive)'
                        : 'transparent',
                      color: '#FAF7EF',
                    }}
                  >
                    {item.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                  <span
                    className={`font-note-content leading-snug ${
                      item.done ? 'line-through opacity-55' : ''
                    }`}
                  >
                    {item.text}
                  </span>
                </button>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => handleMoveToNextDay(item, dayIndex)}
                    title="Pindahkan ke hari berikutnya"
                    className="p-0.5 rounded hover:bg-black/5 cursor-pointer"
                    style={{ color: 'var(--faded-blue)' }}
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(item.id)}
                    title="Hapus"
                    className="p-0.5 rounded hover:bg-black/5 cursor-pointer"
                    style={{ color: 'var(--vintage-red)' }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {addingDay === day.dateISO && (
          <form
            onSubmit={(e) => handleCreateDayTask(e, day.dateISO)}
            className="mt-2 pt-2 border-t space-y-1.5"
            style={{ borderColor: 'var(--notebook-line)' }}
          >
            <input
              type="text"
              autoFocus
              value={draftTaskText}
              onChange={(e) => setDraftTaskText(e.target.value)}
              placeholder="Tulis agenda..."
              className="w-full text-xs bg-transparent border-b py-1 focus:outline-none"
              style={{ borderColor: 'var(--kraft-brown)' }}
            />
            <div className="flex items-center justify-between gap-1">
              <select
                value={draftPriority}
                onChange={(e) =>
                  setDraftPriority(e.target.value as 'low' | 'medium' | 'high')
                }
                className="text-[10px] px-1.5 py-0.5 rounded border bg-transparent"
                style={{ borderColor: 'var(--notebook-line)' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High Priority</option>
              </select>
              <button
                type="submit"
                className="text-[10px] px-2 py-0.5 rounded font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--terracotta)', color: '#FAF7EF' }}
              >
                Simpan
              </button>
            </div>
          </form>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 md:h-full md:overflow-hidden grid grid-cols-1 lg:grid-cols-2">
      {/* ================= HALAMAN KIRI (p. 26) ================= */}
      <div
        className="min-h-0 md:h-full md:overflow-y-auto notebook-scroll p-5 sm:p-6 lg:p-7 flex flex-col justify-between border-b lg:border-b-0"
        style={{ borderColor: 'var(--notebook-line)' }}
      >
        <div className="space-y-3.5">
          <div
            className="flex items-center justify-between gap-2 pb-2.5 border-b"
            style={{ borderColor: 'var(--notebook-line)' }}
          >
            <div>
              <h2 className="font-display text-2xl sm:text-[26px] font-bold">
                Weekly Planner
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--soft-graphite)' }}
              >
                {rangeLabel}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                title="Minggu sebelumnya"
                className="p-1.5 rounded-lg border cursor-pointer"
                style={{
                  backgroundColor: 'var(--paper-cream)',
                  borderColor: 'var(--notebook-line)',
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="text-[11px] px-2 py-1 rounded-lg border font-medium cursor-pointer"
                  style={{
                    backgroundColor: 'var(--paper-cream)',
                    borderColor: 'var(--notebook-line)',
                  }}
                >
                  Minggu Ini
                </button>
              )}
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                title="Minggu berikutnya"
                className="p-1.5 rounded-lg border cursor-pointer"
                style={{
                  backgroundColor: 'var(--paper-cream)',
                  borderColor: 'var(--notebook-line)',
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className="px-3.5 py-2 rounded-lg border-l-4"
            style={{
              backgroundColor: 'var(--paper-cream)',
              borderColor: 'var(--faded-blue)',
            }}
          >
            <span
              className="text-[10px] uppercase tracking-widest font-semibold block"
              style={{ color: 'var(--soft-graphite)' }}
            >
              Weekly Goal
            </span>
            <input
              type="text"
              value={weeklyGoal}
              onChange={(e) => handleSaveGoal(e.target.value)}
              className="font-display italic font-semibold text-sm sm:text-base w-full bg-transparent focus:outline-none mt-0.5"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leftIndices.map((idx) => renderDayCard(idx))}
          </div>
        </div>

        <p className="hidden md:block text-center font-display text-xs mt-4 opacity-60">
          — 26 —
        </p>
      </div>

      {/* ================= HALAMAN KANAN (p. 27) ================= */}
      <div className="min-h-0 md:h-full md:overflow-y-auto notebook-scroll p-5 sm:p-6 lg:p-7 flex flex-col justify-between">
        <div className="space-y-3.5">
          <div
            className="pb-2.5 border-b"
            style={{ borderColor: 'var(--notebook-line)' }}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span
                className="uppercase tracking-widest text-[10px] font-semibold"
                style={{ color: 'var(--soft-graphite)' }}
              >
                Weekly Completion
              </span>
              <span className="font-display font-bold">
                {doneWeekTasks}/{totalWeekTasks} ({weekPct}%)
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--paper-cream)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${weekPct}%`,
                  backgroundColor: 'var(--muted-olive)',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rightIndices.map((idx) => renderDayCard(idx))}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-end">
            <div className="sticky-kraft w-full sm:w-64 rounded-md p-3 pt-3.5">
              <textarea
                rows={2}
                value={weeklyNote}
                onChange={(e) => handleSaveWeeklyNote(e.target.value)}
                className="font-note-content w-full text-center bg-transparent resize-none focus:outline-none"
              />
            </div>
          </div>

          <p className="hidden md:block text-center font-display text-xs mt-3 opacity-60">
            — 27 —
          </p>
        </div>
      </div>
    </div>
  );
}