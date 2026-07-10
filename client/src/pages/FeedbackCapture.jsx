import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CheckCircle2, AlertCircle, Moon, Sun, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';

import VoiceRecorder from '../components/voice/VoiceRecorder';
import TranscriptViewer from '../components/voice/TranscriptViewer';
import AIInsightCards from '../components/voice/AIInsightCards';

export default function FeedbackCapture({ previewMode = false, previewConfig = null }) {
  const { businessId } = useParams();
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [askingContact, setAskingContact] = useState(false);
  const [contactInfo, setContactInfo] = useState('');
  const [pendingPayload, setPendingPayload] = useState(null);
  const [kioskConfig, setKioskConfig] = useState(null);
  const [error, setError] = useState(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [analysisResult, setAnalysisResult] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      setIsDark(true);
    }
  };

  useEffect(() => {
    if (previewMode) {
      setKioskConfig(previewConfig);
      return;
    }
    if (!businessId) return;
    const fetchBiz = async () => {
      try {
        const d = await getDoc(doc(db, 'businesses', businessId));
        if (d.exists()) {
          const data = d.data();
          const brandingData = data.branding || {};
          setKioskConfig({ ...data, ...brandingData });
        }
      } catch (err) {
        console.error("Config fetch error:", err);
      }
    };
    fetchBiz();
  }, [businessId, previewMode, previewConfig]);

  const handleVoiceSubmit = async (blob) => {
    setProcessing(true);
    setError(null);

    // Convert blob to base64 to save in Firestore
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      try {
        const base64data = reader.result;
        const base64String = base64data.split(',')[1];
        const ext = blob.type.split('/')[1] || 'webm';
        const storedBase64 = `${ext}|${base64String}`;
        setAudioBase64(storedBase64);

        // Upload using FormData
        const formData = new FormData();
        formData.append('audio', blob, `feedback.${ext}`);

        const res = await fetch("/api/voice/analyze", {
          method: "POST",
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to analyze feedback.");
        }

        const analysis = await res.json();
        setAnalysisResult(analysis);

        // Construct final payload
        const payload = {
          text: analysis.transcript, // standard text field
          transcript: analysis.transcript,
          language: analysis.language,
          confidence: analysis.confidence,
          sentiment: analysis.sentiment,
          urgency: analysis.urgency,
          categories: analysis.categories,
          positive_points: analysis.positive_points,
          negative_points: analysis.negative_points,
          summary: analysis.summary,
          manager_action: analysis.manager_action,
          escalation_required: analysis.escalation_required,
          escalation_reason: analysis.escalation_reason,
          keywords: analysis.keywords,
          audioBase64: storedBase64,
          source: 'qr',
          status: 'open',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        if (kioskConfig?.collectContact) {
          setPendingPayload(payload);
          setAskingContact(true);
        } else {
          if (!previewMode) {
            await addDoc(collection(db, `businesses/${businessId}/feedbacks`), payload);
          }
          setDone(true);
        }
      } catch (err) {
        console.error("Feedback Capture Error:", err);
        setError(err.message || "Failed to process voice feedback.");
      } finally {
        setProcessing(false);
      }
    };
  };

  const finalizeFeedback = async (skipContact = false) => {
    setProcessing(true);
    try {
      const finalPayload = { ...pendingPayload };
      if (!skipContact && contactInfo.trim()) {
        finalPayload.customerContact = contactInfo.trim();
      }
      if (!previewMode) {
        await addDoc(collection(db, `businesses/${businessId}/feedbacks`), finalPayload);
      }
      setDone(true);
    } catch (e) {
      console.error("Feedback finalizing error:", e);
      setError("Failed to save securely to the database.");
    } finally {
      setProcessing(false);
      setAskingContact(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setAudioBase64(null);
    setDone(false);
    setAskingContact(false);
    setContactInfo('');
    setPendingPayload(null);
    setError(null);
  };

  const dynamicStyles = kioskConfig ? {
    '--background': kioskConfig.backgroundColor || undefined,
    '--foreground': kioskConfig.textColor || undefined,
    '--card': kioskConfig.surfaceColor || undefined,
    '--card-foreground': kioskConfig.textColor || undefined,
    '--primary': kioskConfig.primaryColor || undefined,
    '--primary-foreground': kioskConfig.buttonTextColor || undefined,
    '--accent': kioskConfig.accentColor || undefined,
    '--ring': kioskConfig.accentColor || undefined,
    '--radius': kioskConfig.borderRadius || undefined,
    'fontFamily': kioskConfig.bodyFont || undefined
  } : {};

  // Clean undefined keys
  Object.keys(dynamicStyles).forEach(key => dynamicStyles[key] === undefined && delete dynamicStyles[key]);

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-12 px-4 selection:bg-accent/20 relative flex items-center justify-center" style={dynamicStyles}>
        <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-neutral-600 dark:text-neutral-400 transition-colors z-50">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-2xl space-y-6 text-center"
        >
          <div className="bg-card rounded-[2rem] border border-border p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/50"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </motion.div>
            
            <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-foreground">
              {kioskConfig?.thankyouHeadline || "Thank you for your feedback!"}
            </h2>
            <p className="text-muted-foreground font-medium text-sm max-w-md mx-auto">
              {kioskConfig?.thankyouDescription || "Your voice feedback has been analyzed with AI and securely shared with the business manager."}
            </p>
          </div>

          {/* Detailed analysis report shown to the user if available */}
          {analysisResult && (
            <div className="space-y-4">
              <TranscriptViewer 
                transcript={analysisResult.transcript}
                language={analysisResult.language}
                confidence={analysisResult.confidence}
                positive_points={analysisResult.positive_points}
                negative_points={analysisResult.negative_points}
                keywords={analysisResult.keywords}
              />

              <AIInsightCards 
                sentiment={analysisResult.sentiment}
                urgency={analysisResult.urgency}
                categories={analysisResult.categories}
                summary={analysisResult.summary}
                manager_action={analysisResult.manager_action}
                escalation_required={analysisResult.escalation_required}
                escalation_reason={analysisResult.escalation_reason}
              />
            </div>
          )}

          <button
            onClick={handleReset}
            type="button"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer mt-4"
          >
            Leave another feedback <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  if (askingContact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 selection:bg-accent/20 relative" style={dynamicStyles}>
        <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-neutral-600 dark:text-neutral-400 transition-colors z-50">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border p-10 w-full max-w-md text-center relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground mb-2">Want a follow-up?</h2>
          <p className="text-sm font-medium text-muted-foreground mb-8">Leave your email or number so the manager can get back to you.</p>
          
          <input 
            type="text" 
            placeholder="Email or Phone Number"
            className="w-full h-12 px-4 rounded-xl border border-input bg-transparent text-sm mb-4 focus:ring-2 focus:ring-accent outline-none transition-all text-foreground"
            value={contactInfo}
            onChange={e => setContactInfo(e.target.value)}
            disabled={processing}
          />
          
          <div className="flex gap-3">
            <button 
              onClick={() => finalizeFeedback(true)}
              className="flex-1 h-12 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
              disabled={processing}
            >
              Skip
            </button>
            <button 
              onClick={() => finalizeFeedback(false)}
              className="flex-1 h-12 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 transition-opacity"
              disabled={processing}
            >
              {processing ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 selection:bg-accent/20 relative" style={dynamicStyles}>
      <Helmet>
        <title>Provide Feedback | Klyvora AI</title>
      </Helmet>
      <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-neutral-600 dark:text-neutral-400 transition-colors z-50">
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border p-10 w-full max-w-md text-center relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        
        {kioskConfig?.logoUrl && (
          <img src={kioskConfig.logoUrl} alt="Brand Logo" className="h-12 w-auto mx-auto mb-6 object-contain" />
        )}

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-3">
          {kioskConfig?.kioskTitle || "How was your experience?"}
        </h1>
        <p className="text-[15px] font-medium text-muted-foreground mb-12">
          {kioskConfig?.kioskMessage || "Speak clearly in Hinglish, English, or Hindi."}
        </p>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              className="flex items-center gap-3 text-rose-600 bg-rose-50 border border-rose-100 p-4 rounded-xl text-sm mb-8 text-left"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="py-4">
          <VoiceRecorder 
            onSubmit={handleVoiceSubmit}
            onReset={handleReset}
            processing={processing}
          />
        </div>
      </motion.div>
    </div>
  );
}
