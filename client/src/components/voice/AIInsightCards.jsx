import { ShieldAlert, Sparkles, Smile, Meh, Frown } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

const SENTIMENT_ICONS = {
  positive: { icon: Smile, color: 'text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' },
  neutral: { icon: Meh, color: 'text-slate-600 bg-slate-50/50 dark:bg-zinc-900/40 dark:text-slate-400 border-slate-100 dark:border-zinc-800' },
  negative: { icon: Frown, color: 'text-rose-600 bg-rose-50/50 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/50' }
};

const URGENCY_STYLES = {
  critical: 'bg-red-500 hover:bg-red-600 text-white border-transparent shadow-[0_0_15px_rgba(239,68,68,0.2)]',
  high: 'bg-orange-500 hover:bg-orange-600 text-white border-transparent',
  medium: 'bg-amber-500 hover:bg-amber-600 text-white border-transparent',
  low: 'bg-blue-500 hover:bg-blue-600 text-white border-transparent'
};

export default function AIInsightCards({ sentiment, urgency, categories = [], summary, manager_action, escalation_required, escalation_reason }) {
  const normSentiment = String(sentiment || 'neutral').trim().toLowerCase();
  const normUrgency = String(urgency || 'low').trim().toLowerCase();
  
  const sentimentConfig = SENTIMENT_ICONS[normSentiment] || SENTIMENT_ICONS.neutral;
  const SentimentIcon = sentimentConfig.icon;
  const urgencyStyle = URGENCY_STYLES[normUrgency] || URGENCY_STYLES.low;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
      {/* Sentiment, Urgency & Category Card */}
      <Card className="border border-border shadow-sm rounded-2xl overflow-hidden md:col-span-1">
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Sentiment & Urgency</span>
              <div className="flex flex-col gap-3">
                {/* Sentiment */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${sentimentConfig.color}`}>
                  <SentimentIcon className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider block opacity-70">Customer Sentiment</span>
                    <span className="font-extrabold capitalize text-xs md:text-sm">{normSentiment}</span>
                  </div>
                </div>
                
                {/* Urgency */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
                  <span className="text-[9px] font-bold uppercase tracking-wider block text-muted-foreground">Urgency Level</span>
                  <Badge className={`font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full ${urgencyStyle}`}>
                    {normUrgency}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Complaint Categories</span>
              <div className="flex flex-wrap gap-1">
                {categories && categories.length > 0 ? (
                  categories.map((cat, i) => (
                    <Badge key={i} variant="outline" className="text-[9px] uppercase font-bold tracking-wider bg-transparent">
                      {cat}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground/60 italic">General Feedback</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary & Recommended Actions Card */}
      <Card className="border border-border shadow-sm rounded-2xl md:col-span-2 overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-4 pt-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              AI Feedback Summary
            </div>
            <p className="text-foreground text-sm font-semibold leading-relaxed">
              {summary}
            </p>
          </div>

          <div className="p-3 bg-secondary/30 rounded-xl border border-border space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Recommended Manager Action</span>
            <p className="text-xs text-foreground font-medium leading-relaxed">
              {manager_action}
            </p>
          </div>

          {/* Escalation Warning */}
          {escalation_required && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl text-rose-800 dark:text-rose-400">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider block">Escalation Flagged</span>
                <p className="text-xs font-semibold">{escalation_reason || "Operational escalation flagged."}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
