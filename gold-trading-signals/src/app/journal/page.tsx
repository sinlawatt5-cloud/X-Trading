'use client';

import { useState, useMemo, useCallback } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { t } from '@/lib/i18n';
import { useLocale } from '@/components/locale-provider';

// ─── Types ──────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: string;
  signalId: string | null;
  date: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  exit: number;
  stopLoss: number;
  takeProfit: number;
  pips: number;
  pnl: number;
  notes: string | null;
  screenshot: string | null;
  createdAt: string;
}

type DirectionFilter = 'ALL' | 'BUY' | 'SELL';

interface FormState {
  date: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry: string;
  exit: string;
  stopLoss: string;
  takeProfit: string;
  pips: string;
  pnl: string;
  notes: string;
  screenshot: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function toLocalDatetimeValue(isoStr: string): string {
  // Convert ISO string to "YYYY-MM-DDThh:mm" for <input type="datetime-local">
  return new Date(isoStr).toISOString().slice(0, 16);
}

function nowDatetimeLocal(): string {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function formatPnl(v: number): string {
  return (v >= 0 ? '+' : '') + v.toFixed(2);
}

function formatNumber(v: number, decimals = 2): string {
  return v.toFixed(decimals);
}

const EMPTY_FORM: FormState = {
  date: nowDatetimeLocal(),
  symbol: 'XAUUSD',
  direction: 'BUY',
  entry: '',
  exit: '',
  stopLoss: '',
  takeProfit: '',
  pips: '',
  pnl: '',
  notes: '',
  screenshot: '',
};

// ─── Stats Banner ─────────────────────────────────────────────────────────────

function StatsBanner({ entries, locale }: { entries: JournalEntry[]; locale: string }) {
  const stats = useMemo(() => {
    if (!entries.length) return null;
    const total = entries.length;
    const wins = entries.filter((e) => e.pnl > 0).length;
    const winRate = total ? (wins / total) * 100 : 0;
    const totalPnl = entries.reduce((acc, e) => acc + e.pnl, 0);
    const avgPnl = total ? totalPnl / total : 0;
    return { total, wins, winRate, totalPnl, avgPnl };
  }, [entries]);

  if (!stats) return null;

  const statItems = [
    {
      label: t('journal.totalTrades', locale as 'en' | 'th'),
      value: stats.total.toString(),
      color: 'text-cream-dark dark:text-cream',
      icon: '📊',
    },
    {
      label: t('journal.winRate', locale as 'en' | 'th'),
      value: `${stats.winRate.toFixed(1)}%`,
      color:
        stats.winRate >= 50
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-500 dark:text-red-400',
      icon: '🎯',
    },
    {
      label: t('journal.totalPnl', locale as 'en' | 'th'),
      value: `${formatPnl(stats.totalPnl)} USD`,
      color:
        stats.totalPnl >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-500 dark:text-red-400',
      icon: stats.totalPnl >= 0 ? '💰' : '📉',
    },
    {
      label: t('journal.avgPnl', locale as 'en' | 'th'),
      value: `${formatPnl(stats.avgPnl)} USD`,
      color:
        stats.avgPnl >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-500 dark:text-red-400',
      icon: '📈',
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {statItems.map((item) => (
        <div key={item.label} className="clay-card-inset rounded-2xl p-4 text-center">
          <div className="mb-1 text-2xl">{item.icon}</div>
          <div className={`font-data text-xl font-bold ${item.color}`}>{item.value}</div>
          <div className="font-handwritten mt-1 text-xs text-cream-dark/60 dark:text-cream/50">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 shadow-xl transition-all duration-300 ${
        toast.type === 'success'
          ? 'bg-emerald-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      <span className="font-handwritten text-sm font-medium">{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white"
        aria-label="Close notification"
        id="toast-close-btn"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Entry Form ───────────────────────────────────────────────────────────────

interface EntryFormProps {
  locale: 'en' | 'th';
  initialValues?: Partial<FormState>;
  onSubmit: (data: FormState) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  isSaving: boolean;
}

function EntryForm({
  locale,
  initialValues,
  onSubmit,
  onCancel,
  isEdit,
  isSaving,
}: EntryFormProps) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initialValues });

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const inputClass =
    'w-full rounded-xl clay-card-inset px-3 py-2 font-data text-sm text-cream-dark dark:text-cream bg-transparent outline-none focus:ring-2 focus:ring-gold/50 placeholder:text-cream-dark/30 dark:placeholder:text-cream/30';
  const labelClass = 'block font-handwritten text-xs font-medium text-cream-dark/60 dark:text-cream/50 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="journal-entry-form">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Date */}
        <div className="col-span-2 sm:col-span-3">
          <label className={labelClass} htmlFor="jf-date">
            {t('journal.date', locale)}
          </label>
          <input
            id="jf-date"
            type="datetime-local"
            value={form.date}
            onChange={set('date')}
            required
            className={inputClass}
          />
        </div>

        {/* Symbol */}
        <div>
          <label className={labelClass} htmlFor="jf-symbol">
            {t('journal.symbol', locale)}
          </label>
          <input
            id="jf-symbol"
            type="text"
            value={form.symbol}
            onChange={set('symbol')}
            required
            placeholder="XAUUSD"
            className={inputClass}
          />
        </div>

        {/* Direction */}
        <div>
          <label className={labelClass} htmlFor="jf-direction">
            {t('journal.direction', locale)}
          </label>
          <select
            id="jf-direction"
            value={form.direction}
            onChange={set('direction')}
            required
            className={inputClass}
          >
            <option value="BUY">{t('journal.filterBuy', locale)}</option>
            <option value="SELL">{t('journal.filterSell', locale)}</option>
          </select>
        </div>

        {/* Entry */}
        <div>
          <label className={labelClass} htmlFor="jf-entry">
            {t('journal.entry', locale)}
          </label>
          <input
            id="jf-entry"
            type="number"
            step="0.01"
            value={form.entry}
            onChange={set('entry')}
            required
            placeholder="2020.50"
            className={inputClass}
          />
        </div>

        {/* Exit */}
        <div>
          <label className={labelClass} htmlFor="jf-exit">
            {t('journal.exit', locale)}
          </label>
          <input
            id="jf-exit"
            type="number"
            step="0.01"
            value={form.exit}
            onChange={set('exit')}
            required
            placeholder="2045.00"
            className={inputClass}
          />
        </div>

        {/* Stop Loss */}
        <div>
          <label className={labelClass} htmlFor="jf-stop-loss">
            {t('journal.stopLoss', locale)}
          </label>
          <input
            id="jf-stop-loss"
            type="number"
            step="0.01"
            value={form.stopLoss}
            onChange={set('stopLoss')}
            required
            placeholder="2010.00"
            className={inputClass}
          />
        </div>

        {/* Take Profit */}
        <div>
          <label className={labelClass} htmlFor="jf-take-profit">
            {t('journal.takeProfit', locale)}
          </label>
          <input
            id="jf-take-profit"
            type="number"
            step="0.01"
            value={form.takeProfit}
            onChange={set('takeProfit')}
            required
            placeholder="2050.00"
            className={inputClass}
          />
        </div>

        {/* Pips */}
        <div>
          <label className={labelClass} htmlFor="jf-pips">
            {t('journal.pips', locale)}
          </label>
          <input
            id="jf-pips"
            type="number"
            step="0.1"
            value={form.pips}
            onChange={set('pips')}
            required
            placeholder="24.5"
            className={inputClass}
          />
        </div>

        {/* PnL */}
        <div>
          <label className={labelClass} htmlFor="jf-pnl">
            {t('journal.pnl', locale)}
          </label>
          <input
            id="jf-pnl"
            type="number"
            step="0.01"
            value={form.pnl}
            onChange={set('pnl')}
            required
            placeholder="245.00"
            className={inputClass}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass} htmlFor="jf-notes">
          {t('journal.notes', locale)}
        </label>
        <textarea
          id="jf-notes"
          value={form.notes}
          onChange={set('notes')}
          placeholder={locale === 'th' ? 'วิเคราะห์ตลาด, ความรู้สึก...' : 'Market analysis, emotions...'}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Screenshot URL */}
      <div>
        <label className={labelClass} htmlFor="jf-screenshot">
          {t('journal.screenshot', locale)}
        </label>
        <input
          id="jf-screenshot"
          type="url"
          value={form.screenshot}
          onChange={set('screenshot')}
          placeholder="https://..."
          className={inputClass}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="clay-btn px-5 py-2 font-handwritten text-sm text-cream-dark dark:text-cream"
          id="journal-cancel-btn"
        >
          {t('common.cancel', locale)}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="clay-btn gold-gradient px-5 py-2 font-handwritten text-sm font-semibold text-white disabled:opacity-60"
          id="journal-save-btn"
        >
          {isSaving
            ? t('journal.saving', locale)
            : isEdit
            ? t('journal.editEntry', locale)
            : t('journal.addEntry', locale)}
        </button>
      </div>
    </form>
  );
}

// ─── Journal Row ──────────────────────────────────────────────────────────────

interface JournalRowProps {
  entry: JournalEntry;
  locale: 'en' | 'th';
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

function JournalRow({ entry, locale, onEdit, onDelete }: JournalRowProps) {
  const isWin = entry.pnl > 0;
  const isBuy = entry.direction === 'BUY';

  return (
    <div
      className="clay-card group relative mb-3 overflow-hidden rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
      id={`journal-row-${entry.id}`}
    >
      {/* Direction accent line */}
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${
          isBuy ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      />

      <div className="grid grid-cols-12 items-center gap-3 pl-3">
        {/* Direction badge */}
        <div className="col-span-2 sm:col-span-1">
          <span
            className={`inline-block rounded-lg px-2 py-1 font-display text-xs font-bold ${
              isBuy
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {isBuy ? '↑' : '↓'} {entry.direction}
          </span>
        </div>

        {/* Symbol & date */}
        <div className="col-span-5 sm:col-span-3">
          <div className="font-display text-sm font-semibold text-cream-dark dark:text-cream">
            {entry.symbol}
          </div>
          <div className="font-data text-xs text-cream-dark/50 dark:text-cream/40">
            {new Date(entry.date).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
              day: '2-digit',
              month: 'short',
              year: '2-digit',
            })}
          </div>
        </div>

        {/* Entry / Exit */}
        <div className="col-span-5 sm:col-span-3">
          <div className="font-data text-xs text-cream-dark/60 dark:text-cream/50">
            {t('journal.entry', locale)}{' '}
            <span className="font-semibold text-cream-dark dark:text-cream">
              {formatNumber(entry.entry)}
            </span>
          </div>
          <div className="font-data text-xs text-cream-dark/60 dark:text-cream/50">
            {t('journal.exit', locale)}{' '}
            <span className="font-semibold text-cream-dark dark:text-cream">
              {formatNumber(entry.exit)}
            </span>
          </div>
        </div>

        {/* Pips */}
        <div className="col-span-3 hidden sm:block sm:col-span-2 text-center">
          <div className="font-data text-xs text-cream-dark/50 dark:text-cream/40">
            {t('journal.pips', locale)}
          </div>
          <div
            className={`font-data text-sm font-bold ${
              entry.pips >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400'
            }`}
          >
            {formatPnl(entry.pips)}
          </div>
        </div>

        {/* P/L */}
        <div className="col-span-4 sm:col-span-2 text-center">
          <div className="font-data text-xs text-cream-dark/50 dark:text-cream/40">
            {t('journal.pnl', locale)}
          </div>
          <div
            className={`font-data text-sm font-bold ${
              isWin
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400'
            }`}
          >
            {formatPnl(entry.pnl)}
          </div>
        </div>

        {/* Win/Loss badge */}
        <div className="col-span-2 hidden sm:flex sm:col-span-1 justify-center">
          <span
            className={`rounded-full px-2 py-0.5 font-handwritten text-xs font-semibold ${
              isWin
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {isWin ? t('journal.win', locale) : t('journal.loss', locale)}
          </span>
        </div>

        {/* Actions */}
        <div className="col-span-4 sm:col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(entry)}
            className="clay-btn rounded-lg p-1.5 text-gold-dark dark:text-gold-bright hover:text-gold"
            aria-label={t('common.edit', locale)}
            id={`edit-entry-${entry.id}`}
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="clay-btn rounded-lg p-1.5 text-red-500 hover:text-red-600"
            aria-label={t('common.delete', locale)}
            id={`delete-entry-${entry.id}`}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Notes */}
      {entry.notes && (
        <div className="mt-2 ml-4 font-handwritten text-xs italic text-cream-dark/50 dark:text-cream/40 line-clamp-1">
          📝 {entry.notes}
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      id="journal-modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-night/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="clay-card relative z-50 w-full max-w-lg rounded-3xl p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-gold-dark dark:text-gold-bright">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="clay-btn rounded-xl px-3 py-1 text-sm text-cream-dark/60 dark:text-cream/50"
            aria-label="Close"
            id="modal-close-btn"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const { locale } = useLocale();

  // ── Data fetching
  const { data: entries = [], isLoading } = useSWR<JournalEntry[]>(
    '/api/journal',
    fetcher,
    { revalidateOnFocus: false }
  );

  // ── UI state
  const [dirFilter, setDirFilter] = useState<DirectionFilter>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<JournalEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Filtered entries
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (dirFilter !== 'ALL' && e.direction !== dirFilter) return false;
      if (dateFilter) {
        const d = new Date(e.date).toISOString().slice(0, 10);
        if (d !== dateFilter) return false;
      }
      return true;
    });
  }, [entries, dirFilter, dateFilter]);

  // ── Create entry
  const handleCreate = async (form: FormState) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(form.date).toISOString(),
          symbol: form.symbol,
          direction: form.direction,
          entry: parseFloat(form.entry),
          exit: parseFloat(form.exit),
          stopLoss: parseFloat(form.stopLoss),
          takeProfit: parseFloat(form.takeProfit),
          pips: parseFloat(form.pips),
          pnl: parseFloat(form.pnl),
          notes: form.notes || null,
          screenshot: form.screenshot || null,
        }),
      });
      if (!res.ok) throw new Error('create failed');
      await globalMutate('/api/journal');
      setShowModal(false);
      showToast(t('journal.entryCreated', locale), 'success');
    } catch {
      showToast(t('journal.createError', locale), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Edit entry
  const handleEdit = async (form: FormState) => {
    if (!editTarget) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/journal/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: form.notes || null,
          exit: parseFloat(form.exit),
          pips: parseFloat(form.pips),
          pnl: parseFloat(form.pnl),
          screenshot: form.screenshot || null,
        }),
      });
      if (!res.ok) throw new Error('update failed');
      await globalMutate('/api/journal');
      setEditTarget(null);
      showToast(t('journal.entryUpdated', locale), 'success');
    } catch {
      showToast(t('journal.updateError', locale), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete entry
  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/journal/${deleteConfirmId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('delete failed');
      await globalMutate('/api/journal');
      showToast(t('journal.entryDeleted', locale), 'success');
    } catch {
      showToast(t('journal.deleteError', locale), 'error');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // ── Open edit modal
  const openEdit = (entry: JournalEntry) => {
    setEditTarget(entry);
  };

  // ── Filter buttons config
  const filterBtns: { label: string; value: DirectionFilter }[] = [
    { label: t('journal.filterAll', locale), value: 'ALL' },
    { label: t('journal.filterBuy', locale), value: 'BUY' },
    { label: t('journal.filterSell', locale), value: 'SELL' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gold-dark dark:text-gold-bright">
            📓 {t('journal.title', locale)}
          </h1>
          <p className="font-handwritten mt-1 text-sm text-cream-dark/60 dark:text-cream/50">
            {locale === 'th'
              ? 'บันทึกทุกเทรด · วิเคราะห์ · เติบโต'
              : 'Record every trade · Analyze · Grow'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="clay-btn gold-gradient flex items-center gap-2 rounded-2xl px-5 py-2.5 font-handwritten text-sm font-semibold text-white shadow-lg"
          id="new-journal-entry-btn"
        >
          <span className="text-base">✚</span>
          {t('journal.newEntry', locale)}
        </button>
      </div>

      {/* Stats */}
      <StatsBanner entries={entries} locale={locale} />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Direction filter */}
        <div className="flex gap-1">
          {filterBtns.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setDirFilter(btn.value)}
              className={`clay-btn rounded-xl px-4 py-1.5 font-handwritten text-sm transition-all ${
                dirFilter === btn.value
                  ? 'gold-gradient text-white shadow-md'
                  : 'text-cream-dark dark:text-cream'
              }`}
              id={`filter-${btn.value.toLowerCase()}-btn`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2">
          <span className="font-handwritten text-xs text-cream-dark/50 dark:text-cream/40">
            {t('journal.filterDate', locale)}:
          </span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="clay-card-inset rounded-xl px-3 py-1.5 font-data text-sm text-cream-dark dark:text-cream bg-transparent outline-none"
            id="journal-date-filter"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="clay-btn rounded-lg px-2 py-1 text-xs text-cream-dark/50 dark:text-cream/40"
              id="journal-clear-date-btn"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Entry list */}
      {isLoading ? (
        <div className="clay-card-inset flex h-48 items-center justify-center rounded-2xl">
          <div className="font-handwritten text-cream-dark/50 dark:text-cream/40 animate-pulse">
            {t('common.loading', locale)}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="clay-card flex flex-col items-center justify-center rounded-2xl py-20 text-center">
          <div className="mb-4 text-5xl">📓</div>
          <p className="font-display text-lg font-semibold text-cream-dark/60 dark:text-cream/50">
            {t('journal.noEntries', locale)}
          </p>
          <p className="font-handwritten mt-2 text-sm text-cream-dark/40 dark:text-cream/30">
            {locale === 'th' ? 'กดปุ่มด้านบนเพื่อเพิ่มรายการแรก' : 'Tap the button above to log your first trade'}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map((entry) => (
            <JournalRow
              key={entry.id}
              entry={entry}
              locale={locale}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <Modal title={`✍️ ${t('journal.addEntry', locale)}`} onClose={() => setShowModal(false)}>
          <EntryForm
            locale={locale}
            onSubmit={handleCreate}
            onCancel={() => setShowModal(false)}
            isSaving={isSaving}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal title={`✏️ ${t('journal.editEntry', locale)}`} onClose={() => setEditTarget(null)}>
          <EntryForm
            locale={locale}
            isEdit
            initialValues={{
              date: toLocalDatetimeValue(editTarget.date),
              symbol: editTarget.symbol,
              direction: editTarget.direction,
              entry: editTarget.entry.toString(),
              exit: editTarget.exit.toString(),
              stopLoss: editTarget.stopLoss.toString(),
              takeProfit: editTarget.takeProfit.toString(),
              pips: editTarget.pips.toString(),
              pnl: editTarget.pnl.toString(),
              notes: editTarget.notes ?? '',
              screenshot: editTarget.screenshot ?? '',
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            isSaving={isSaving}
          />
        </Modal>
      )}

      {/* Delete confirm modal */}
      {deleteConfirmId && (
        <Modal title={`🗑️ ${t('journal.deleteEntry', locale)}`} onClose={() => setDeleteConfirmId(null)}>
          <p className="font-handwritten text-cream-dark dark:text-cream mb-6">
            {t('journal.confirmDelete', locale)}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="clay-btn px-5 py-2 font-handwritten text-sm text-cream-dark dark:text-cream"
              id="delete-cancel-btn"
            >
              {t('common.cancel', locale)}
            </button>
            <button
              onClick={confirmDelete}
              className="clay-btn rounded-xl bg-red-500 px-5 py-2 font-handwritten text-sm font-semibold text-white hover:bg-red-600"
              id="delete-confirm-btn"
            >
              {t('common.delete', locale)}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
