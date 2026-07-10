import { MessageSquare, Quote, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function TranscriptViewer({ transcript, language, confidence, positive_points = [], negative_points = [], keywords = [] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 text-left shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Transcript & Audio Info</h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2.5 py-0.5 rounded-full font-semibold">
            {language || "Auto"}
          </span>
          {confidence !== undefined && (
            <span className="bg-secondary text-muted-foreground px-2.5 py-0.5 rounded-full font-semibold">
              STT Confidence: {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
      </div>

      <div className="relative mb-6">
        <Quote className="absolute -top-3 -left-3 w-8 h-8 text-secondary/30 -z-10 rotate-180" />
        <p className="text-foreground font-medium leading-relaxed italic text-base md:text-lg pl-4 border-l-2 border-accent">
          "{transcript}"
        </p>
      </div>

      {keywords && keywords.length > 0 && (
        <div className="mb-6">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Keywords Extracted</h4>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-secondary text-foreground rounded-md font-semibold">
                #{kw}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Positive Points */}
        <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 rounded-xl">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-3">
            <ThumbsUp className="w-3.5 h-3.5" />
            Praise & Compliments
          </div>
          {positive_points && positive_points.length > 0 ? (
            <ul className="space-y-2">
              {positive_points.map((pt, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">No specific positive points highlighted.</p>
          )}
        </div>

        {/* Negative Points */}
        <div className="p-4 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/30 rounded-xl">
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider mb-3">
            <ThumbsDown className="w-3.5 h-3.5" />
            Issues & Complaints
          </div>
          {negative_points && negative_points.length > 0 ? (
            <ul className="space-y-2">
              {negative_points.map((pt, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-rose-500 mt-0.5">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">No specific pain points highlighted.</p>
          )}
        </div>
      </div>
    </div>
  );
}
