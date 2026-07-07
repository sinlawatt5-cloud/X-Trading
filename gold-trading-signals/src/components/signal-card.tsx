'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useLocale } from '@/components/locale-provider';

interface ConfluenceFactor {
  factor: string;
  weight: number;
}

interface Signal {
  id: string;
  type: 'BUY' | 'SELL' | 'NEUTRAL';
  timeframe: string;
  entry: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  confluence: string;
  reasoning: string;
  analysis: string;
  status: string;
  createdAt: string;
}

interface SignalCardProps {
  signal: Signal;
  className?: string;
}

export function SignalCard({ signal, className = '' }: SignalCardProps) {
  const { locale } = useLocale();

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'BUY':
        return 'border-l-green-500';
      case 'SELL':
        return 'border-l-red-500';
      default:
        return 'border-l-muted-foreground';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'BUY':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'SELL':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-primary/10 text-primary';
      case 'CLOSED':
        return 'bg-muted text-muted-foreground';
      case 'CANCELLED':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return t('signal.active', locale);
      case 'CLOSED':
        return t('signal.closed', locale);
      case 'CANCELLED':
        return t('signal.cancelled', locale);
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'BUY':
        return t('signal.buy', locale);
      case 'SELL':
        return t('signal.sell', locale);
      default:
        return type;
    }
  };

  const calculatePips = (entry: number, target: number, type: string) => {
    const diff = Math.abs(target - entry);
    const pips = diff * 10;
    return type === 'BUY' ? `+${pips.toFixed(1)}` : `-${pips.toFixed(1)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  let confluenceFactors: ConfluenceFactor[] = [];
  try {
    confluenceFactors = JSON.parse(signal.confluence);
  } catch {
    confluenceFactors = [];
  }

  return (
    <div className={cn('clay-card border-l-4 p-5', getBorderColor(signal.type), className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-handwritten text-sm text-muted-foreground">
            XAUUSD · {signal.timeframe}
          </span>
          <Badge className={cn('font-data text-xs', getStatusBadge(signal.status))}>
            {getStatusLabel(signal.status)}
          </Badge>
        </div>
        <Badge className={cn('font-data text-xs', getBadgeVariant(signal.type))}>{getTypeLabel(signal.type)}</Badge>
      </div>

      <div className="clay-card-inset mb-4 p-4">
        <div className="font-data text-3xl font-bold text-gold-dark dark:text-gold-bright">
          ${signal.entry.toFixed(2)}
        </div>
        <div className="font-handwritten text-sm text-muted-foreground">
          {t('signal.entryPrice', locale)}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="clay-card-inset p-3">
          <div className="font-data text-sm font-semibold text-green-600 dark:text-green-400">
            ${signal.takeProfit.toFixed(2)}
          </div>
          <div className="font-handwritten text-xs text-muted-foreground">
            {t('signal.takeProfitLabel', locale)} ({calculatePips(signal.entry, signal.takeProfit, signal.type)})
          </div>
        </div>
        <div className="clay-card-inset p-3">
          <div className="font-data text-sm font-semibold text-red-600 dark:text-red-400">
            ${signal.stopLoss.toFixed(2)}
          </div>
          <div className="font-handwritten text-xs text-muted-foreground">
            {t('signal.stopLossLabel', locale)} ({calculatePips(signal.entry, signal.stopLoss, signal.type)})
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="font-handwritten text-sm">
          {t('signal.confidence', locale)}:{' '}
          <span className="font-data font-semibold text-gold-dark dark:text-gold-bright">
            {signal.confidence}%
          </span>
        </div>
        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
          <div className="gold-gradient h-full rounded-full" style={{ width: `${signal.confidence}%` }} />
        </div>
      </div>

      <div className="clay-card-inset mb-4 p-3">
        <div className="mb-1 font-handwritten text-xs text-muted-foreground">
          {t('signal.analysis', locale)}
        </div>
        <p className="font-handwritten text-sm leading-relaxed text-cream-dark dark:text-cream">
          {signal.reasoning}
        </p>
      </div>

      {confluenceFactors.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 font-handwritten text-xs text-muted-foreground">
            {t('signal.confluenceFactors', locale)}
          </div>
          <div className="flex flex-wrap gap-2">
            {confluenceFactors.slice(0, 3).map((factor, index) => (
              <span
                key={index}
                className="clay-card-inset inline-flex items-center px-2 py-1 font-handwritten text-xs text-cream-dark dark:text-cream"
              >
                {factor.factor}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border pt-3">
        <div className="font-handwritten text-xs text-muted-foreground">
          {t('signal.generatedAt', locale)}: {formatDate(signal.createdAt)}
        </div>
      </div>
    </div>
  );
}
