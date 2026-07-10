import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Play, Pause, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Star, Lightbulb, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTemplate } from '../lib/templates';
import { Button } from '@/components/ui/button';

function ExecutiveCard({ fb, businessId, members, updateStatus, updateAssignee, playAudio, playingId, audioSource }) {
  const [expanded, setExpanded] = useState(false);
  const template = getTemplate(fb.businessType || 'generic');
  const TemplateIcon = template.icon;
  
  const isCritical = fb.businessImpact?.level === 'Critical' || fb.urgency === 'High' || fb.rating <= 2;

  return (
    <Card className={`p-0 overflow-hidden transition-all duration-300 hover:shadow-md border-l-4 ${isCritical ? 'border-l-red-500' : 'border-l-primary'}`}>
      {/* Top Banner */}
      <div className="bg-secondary/40 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between border-b border-border gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
             <TemplateIcon className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{fb.emotion || '😐 Neutral'}</h3>
              {isCritical && <Badge variant="destructive" className="animate-pulse">Critical Priority</Badge>}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                {fb.rating || 3}/5
              </span>
              <span>•</span>
              <span>{fb.createdAt?.toDate ? format(fb.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}</span>
              {fb.customerContact && (
                <>
                  <span>•</span>
                  <span className="font-mono">{fb.customerContact}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={fb.status} onValueChange={(val) => updateStatus(fb.id, val)}>
            <SelectTrigger className="h-9 w-[130px] text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fb.assigneeId || 'unassigned'} onValueChange={(val) => updateAssignee(fb.id, val)}>
            <SelectTrigger className="h-9 w-[130px] text-xs font-medium">
              <SelectValue placeholder="Assign" />
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

      {/* Main Body */}
      <div className="p-6">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                 Executive Summary
              </h4>
              <p className="text-base leading-relaxed font-medium">
                {fb.executiveSummary || fb.text}
              </p>
            </div>
            
            {fb.rootCause && (
              <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                <h4 className="text-xs uppercase font-bold tracking-wider text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" /> Root Cause
                </h4>
                <p className="text-sm text-red-900 dark:text-red-200">{fb.rootCause}</p>
              </div>
            )}

            {fb.recommendation && fb.recommendation.length > 0 && (
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5" /> Recommended Actions
                </h4>
                <ul className="space-y-2">
                  {fb.recommendation.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div>
               <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">Detected Themes</h4>
               <div className="flex flex-wrap gap-2">
                 {(fb.detectedCategories || fb.topics || []).map((t, i) => (
                   <Badge key={i} variant="secondary" className="font-normal">{t}</Badge>
                 ))}
               </div>
            </div>
            
            {fb.businessImpact && (
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">Business Impact</h4>
                <p className="text-sm">
                   <span className="font-semibold text-foreground">{fb.businessImpact.level || 'Medium'}</span>: {fb.businessImpact.explanation}
                </p>
              </div>
            )}

            {fb.confidence && (
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">AI Confidence</h4>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${fb.confidence}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Transcript & Audio */}
        <div className="mt-8 pt-4 border-t border-border">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? "Hide raw transcript" : "Show raw customer feedback"}
          </button>
          
          {expanded && (
            <div className="mt-4 bg-secondary/30 p-4 rounded-xl text-sm leading-relaxed border border-border">
              {fb.audioBase64 && (
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/50">
                  <Button 
                    size="sm"
                    variant={playingId === fb.id ? "destructive" : "default"}
                    onClick={() => playAudio(fb.id, fb.audioBase64)}
                    className="gap-2 rounded-full h-8 px-4"
                  >
                    {playingId === fb.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {playingId === fb.id ? "Pause Audio" : "Play Original Audio"}
                  </Button>
                  <span className="text-xs text-muted-foreground">Original voice recording</span>
                </div>
              )}
              <p className="font-mono text-muted-foreground">"{fb.text}"</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}


export default function FeedbackList() {
  const { businessId } = useOutletContext();
  const [feedbacks, setFeedbacks] = useState([]);
  const [members, setMembers] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
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

  const playAudio = async (id, base64) => {
    if (playingId === id && audioSource) {
      audioSource.pause();
      setPlayingId(null);
      return;
    }
    
    if (audioSource) audioSource.pause();

    try {
      const parts = base64.split('|');
      let ext = 'webm';
      let pureBase64 = base64;
      
      if (parts.length > 1) {
        ext = parts[0];
        pureBase64 = parts[1];
      }

      const res = await fetch(`data:audio/${ext};base64,${pureBase64}`).catch(() => null);
      if (!res) throw new Error("Fetch failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audio.onended = () => {
        setPlayingId(null);
        URL.revokeObjectURL(url);
      };
      
      audio.onerror = () => {
         const fallbackAudio = new Audio(`data:audio/webm;base64,${base64}`);
         fallbackAudio.onended = () => setPlayingId(null);
         fallbackAudio.play().catch(e => setPlayingId(null));
         setAudioSource(fallbackAudio);
      };

      await audio.play();
      setAudioSource(audio);
      setPlayingId(id);
    } catch (err) {
      const fallbackAudio = new Audio(`data:audio/mp3;base64,${base64}`);
      fallbackAudio.onended = () => setPlayingId(null);
      fallbackAudio.play().catch(e => setPlayingId(null));
      setAudioSource(fallbackAudio);
      setPlayingId(id);
    }
  };

  if (loading) {
    return <div className="text-sm font-medium text-muted-foreground p-8">Loading executive insights...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-semibold tracking-tight">Executive Inbox</h2>
          <p className="text-muted-foreground">Actionable insights generated from customer feedback.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary transition-all active:scale-95 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-6">
        {feedbacks.map((fb) => (
          <ExecutiveCard 
            key={fb.id} 
            fb={fb} 
            businessId={businessId} 
            members={members} 
            updateStatus={updateStatus} 
            updateAssignee={updateAssignee} 
            playAudio={playAudio} 
            playingId={playingId} 
            audioSource={audioSource} 
          />
        ))}

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
