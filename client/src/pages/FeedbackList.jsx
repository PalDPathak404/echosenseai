import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertCircle, RefreshCw, Globe, ShieldAlert } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AudioPlayer from '../components/voice/AudioPlayer';

const URGENCY_COLORS = {
  critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50',
  high: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50',
  medium: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
  low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50'
};

export default function FeedbackList() {
  const { businessId } = useOutletContext();
  const [feedbacks, setFeedbacks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!businessId) return;
    try {
      const qFeedbacks = query(
        collection(db, `businesses/${businessId}/feedbacks`),
        orderBy('createdAt', 'desc')
      );
      const qMembers = query(collection(db, `businesses/${businessId}/members`));

      const [feedbackSnap, memberSnap] = await Promise.all([
        getDocs(qFeedbacks),
        getDocs(qMembers)
      ]);

      setFeedbacks(feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setMembers(memberSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Feedback list fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const updateStatus = async (id, newStatus) => {
    if (!businessId) return;
    await updateDoc(doc(db, `businesses/${businessId}/feedbacks`, id), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    fetchData();
  };

  const updateAssignee = async (id, assigneeId) => {
    if (!businessId) return;
    await updateDoc(doc(db, `businesses/${businessId}/feedbacks`, id), {
      assigneeId: assigneeId === 'unassigned' ? null : assigneeId,
      updatedAt: serverTimestamp()
    });
    fetchData();
  };

  if (loading) {
    return <div className="text-sm font-medium text-muted-foreground">Loading feedback...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-semibold tracking-tight">Feedback Inbox</h2>
          <p className="text-muted-foreground">Manage and resolve customer experiences.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary transition-all active:scale-95 self-start cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-4">
        {feedbacks.map((fb) => {
          const categories = fb.categories || fb.topics || [];
          const keywords = fb.keywords || [];
          
          return (
            <Card key={fb.id} className="p-6 transition-colors hover:bg-secondary/30">
              <div className="flex flex-col md:flex-row md:gap-8">
                {/* Score Column */}
                <div className="flex-shrink-0 flex md:flex-col items-center gap-4 md:w-28 mb-4 md:mb-0 pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-border justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-light leading-none">{fb.score || 50}</div>
                    <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mt-1">Score</div>
                  </div>
                </div>

                {/* Content Column */}
                <div className="flex-1 space-y-4 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Sentiment Badge */}
                    <Badge variant={fb.sentiment === 'positive' ? 'default' : fb.sentiment === 'negative' ? 'destructive' : 'secondary'} className="font-semibold uppercase text-[10px]">
                      {fb.sentiment || 'neutral'}
                    </Badge>
                    
                    {/* Urgency Badge */}
                    {fb.urgency && (
                      <Badge variant="outline" className={`font-semibold capitalize text-[10px] ${URGENCY_COLORS[fb.urgency.toLowerCase()] || URGENCY_COLORS.low}`}>
                        {fb.urgency}
                      </Badge>
                    )}

                    {/* Detected Language Badge */}
                    {fb.language && (
                      <Badge variant="outline" className="bg-transparent text-muted-foreground border-border text-[10px] font-semibold flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        {fb.language}
                      </Badge>
                    )}

                    <Badge variant="outline" className="bg-transparent capitalize text-[10px] font-semibold">{fb.emotion || 'neutral'}</Badge>
                    
                    <span className="text-xs text-muted-foreground">
                      {fb.createdAt?.toDate ? format(fb.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                    </span>

                    {/* Escalation Required indicator */}
                    {fb.escalation_required && (
                      <span className="flex items-center text-xs text-red-500 font-semibold ml-auto gap-1">
                        <ShieldAlert className="w-4 h-4" />
                        Escalated
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <p className="text-foreground text-base md:text-lg font-medium leading-relaxed italic">
                      "{fb.transcript || fb.text}"
                    </p>

                    {/* Reusable Audio Player */}
                    {fb.audioBase64 && (
                      <div className="w-full max-w-md mt-1">
                        <AudioPlayer base64={fb.audioBase64} />
                      </div>
                    )}

                    {/* AI Feedback Summary */}
                    {fb.summary && fb.summary !== (fb.transcript || fb.text) && (
                      <div className="text-xs text-muted-foreground leading-relaxed bg-secondary/20 p-3 rounded-xl border border-border/40 max-w-2xl">
                        <strong className="text-foreground text-[10px] uppercase block mb-1">AI Summary</strong>
                        {fb.summary}
                      </div>
                    )}

                    {/* Recommended Action */}
                    {fb.manager_action && (
                      <div className="p-3 bg-secondary/35 rounded-xl border border-border text-xs max-w-2xl">
                        <span className="font-bold text-[10px] uppercase text-muted-foreground block mb-1">Recommended Action</span>
                        <span className="text-foreground leading-relaxed">{fb.manager_action}</span>
                      </div>
                    )}

                    {/* Escalation Reason */}
                    {fb.escalation_required && fb.escalation_reason && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl text-xs max-w-2xl text-rose-800 dark:text-rose-400">
                        <span className="font-bold text-[10px] uppercase block mb-1">Escalation Reason</span>
                        <span className="leading-relaxed font-semibold">{fb.escalation_reason}</span>
                      </div>
                    )}

                    {/* Customer Contact */}
                    {fb.customerContact && (
                      <div className="flex items-center text-xs font-semibold text-muted-foreground bg-secondary/50 w-fit px-3 py-1.5 rounded-md border border-border">
                        <span className="mr-2 text-[9px] uppercase font-bold tracking-wider opacity-70">Contact:</span> 
                        {fb.customerContact}
                      </div>
                    )}

                    {/* Categories and Keywords */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {categories.map((topic) => (
                        <span key={topic} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px] font-bold uppercase tracking-wider">
                          {topic}
                        </span>
                      ))}
                      {keywords.map((kw) => (
                        <span key={kw} className="text-slate-400 dark:text-zinc-500 text-xs font-medium">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Column */}
                <div className="flex-shrink-0 md:w-48 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 space-y-4">
                  <div>
                    <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">Status</div>
                    <Select value={fb.status || 'open'} onValueChange={(val) => updateStatus(fb.id, val)}>
                      <SelectTrigger className="h-8 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">Assignee</div>
                    <Select value={fb.assigneeId || 'unassigned'} onValueChange={(val) => updateAssignee(fb.id, val)}>
                      <SelectTrigger className="h-8 text-xs font-medium">
                        <SelectValue placeholder="Assign Staff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {feedbacks.length === 0 && (
          <div className="text-center py-16 px-4 bg-card rounded-lg border border-dashed border-border">
            <h3 className="text-lg font-medium text-foreground mb-1">Inbox Zero</h3>
            <p className="text-muted-foreground text-sm">No feedback has been captured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
