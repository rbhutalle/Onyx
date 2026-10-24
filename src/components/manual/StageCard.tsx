import { ReactNode } from 'react';

interface StageCardProps {
  id: string;
  badgeText: string;
  title: string;
  description: ReactNode;
  roles: string;
  navigation: string;
  tables: string;
  output: string;
  screenshotSrc?: string;
  screenshotCaption?: string;
  onOpenLightbox: (src: string) => void;
  children?: ReactNode;
}

export function StageCard({
  id,
  badgeText,
  title,
  description,
  roles,
  navigation,
  tables,
  output,
  screenshotSrc,
  screenshotCaption,
  onOpenLightbox,
  children,
}: StageCardProps) {
  return (
    <section id={id} className="mb-20 pt-8 border-t border-white/5 scroll-mt-20">
      <div className="mb-7">
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-500 flex items-center gap-1.5 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-ping"></span>
          {badgeText}
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight text-(--text-primary) mb-2">{title}</h2>
        <div className="text-(--text-muted) max-w-4xl text-sm leading-relaxed">{description}</div>
      </div>

      {/* Bento Grid Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-(--bg-card) border border-(--border-main) rounded-2xl p-5 mb-7 shadow-lg">
        <div className="flex flex-col gap-1">
          <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-(--text-muted)">👤 Primary Roles</span>
          <span className="text-xs font-semibold text-(--text-primary)">{roles}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-(--text-muted)">🧭 Source Navigation</span>
          <span className="text-xs font-semibold text-(--text-primary)">{navigation}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-(--text-muted)">🗄️ Database Tables / RPC</span>
          <span className="text-xs font-semibold text-(--text-primary)"><code>{tables}</code></span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-(--text-muted)">⚙️ Transaction Output</span>
          <span className="text-xs font-semibold text-(--text-primary)">{output}</span>
        </div>
      </div>

      {screenshotSrc && (
        <div className="screenshot-card bg-(--bg-surface) border border-(--border-main) rounded-2xl overflow-hidden mb-8 shadow-2xl transition-all duration-300 hover:border-blue-500/50">
          <div className="bg-linear-to-b from-slate-800 to-slate-900 p-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-black/20"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-black/20"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-black/20"></span>
            </div>
            <div className="text-xs font-mono text-(--text-muted) bg-(--bg-main) px-4 py-1 rounded-lg border border-white/10">RC-MRO — {id}</div>
            <div></div>
          </div>
          <div className="bg-(--bg-main) cursor-zoom-in overflow-hidden group" onClick={() => onOpenLightbox(screenshotSrc)}>
            <img src={screenshotSrc} alt={`${title} Screenshot`} className="w-full h-auto block transition-transform duration-500 group-hover:scale-102" />
          </div>
          {screenshotCaption && (
            <div className="p-4 bg-(--bg-surface) border-t border-(--border-main) text-xs text-(--text-muted) flex justify-between items-center">
              <span>{screenshotCaption}</span>
              <span className="text-blue-400 font-semibold flex items-center gap-1">Click to expand 🔍</span>
            </div>
          )}
        </div>
      )}

      {children}
    </section>
  );
}