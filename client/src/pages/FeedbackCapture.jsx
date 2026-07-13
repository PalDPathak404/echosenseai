import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Mic, Square, CheckCircle2, Moon, Sun, ArrowRight, Loader2, Star, Play, Pause, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { getTemplate } from '../lib/templates';
import { Button } from '@/components/ui/button';

const RATING_COLORS = {
  0: 'text-muted-foreground',
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-lime-500',
  5: 'text-green-500'
};

export default function FeedbackCapture({ previewMode = false, previewConfig = null }) {
  const { businessId } = useParams();
  
  // State Machine: 'welcome' -> 'feedback' -> 'processing' -> 'contact' -> 'done'
  const [step, setStep] = useState('welcome');
  
  const [kioskConfig, setKioskConfig] = useState(null);
  const [rating, setRating] = useState(0);
  const [textFeedback, setTextFeedback] = useState('');
  
  // Voice Recording State
  const [recording, setRecording] = useState(false);
  const [time, setTime] = useState(0);
  const [audioBase64, setAudioBase64] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPlayerRef = useRef(null);
  
  const [error, setError] = useState(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [contactInfo, setContactInfo] = useState('');
  const [pendingFeedback, setPendingFeedback] = useState(null);
  const [analysisSteps, setAnalysisSteps] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
      setKioskConfig(previewConfig || {});
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
        } else {
          setError("Business not found.");
        }
      } catch (err) {
        console.error("Config fetch error:", err);
      }
    };
    fetchBiz();
  }, [businessId, previewMode, previewConfig]);

  const template = useMemo(() => {
    return getTemplate(kioskConfig?.businessType || 'generic');
  }, [kioskConfig?.businessType]);

  const TemplateIcon = template.icon;

  useEffect(() => {
    let timer;
    if (recording) {
      timer = setInterval(() => {
        setTime(t => {
          if (t >= 60) {
            stopRecording();
            return t;
          }
          return t + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [recording]);

  const startRecording = async () => {
    try {
      setRecording(true);
      setError(null);
      setTime(0);
      setAudioBase64(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
      else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.resolvedMimeType = mimeType;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const generatedMimeType = mediaRecorder.resolvedMimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: generatedMimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const split = reader.result.split(',');
          let ext = 'webm';
          if(generatedMimeType.includes('mp4')) ext = 'mp4';
          if(generatedMimeType.includes('ogg')) ext = 'ogg';
          setAudioBase64(`${ext}|${split[1] || split[0]}`);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Microphone Error:", err);
      setError(`Microphone access error: ${err.message}`);
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // Stop all tracks to release microphone icon in browser tab
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setRecording(false);
  };

  const discardRecording = () => {
    setAudioBase64(null);
    setTime(0);
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !audioBase64) return;
    
    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      const parts = audioBase64.split('|');
      if (parts.length > 1 && !audioPlayerRef.current.src) {
         audioPlayerRef.current.src = `data:audio/${parts[0]};base64,${parts[1]}`;
      }
      audioPlayerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleRatingSelect = (selectedRating) => {
    setRating(selectedRating);
    setTimeout(() => setStep('feedback'), 400);
  };

  const isFeedbackRequired = useMemo(() => {
    const rule = kioskConfig?.voiceFeedbackRequired || 'conditional';
    if (rule === 'always') return true;
    if (rule === 'optional') return false;
    return rating <= 2;
  }, [kioskConfig?.voiceFeedbackRequired, rating]);

  const canProceed = !isFeedbackRequired || (audioBase64 || textFeedback.trim().length > 3);

  const submitFeedback = async () => {
    setStep('processing');
    
    // Simulate loading steps for UX
    const loaderInterval = setInterval(() => {
      setAnalysisSteps(s => (s < 3 ? s + 1 : s));
    }, 1500);

    try {
      let finalBase64 = audioBase64;
      
      const payload = {
        text: textFeedback,
        audioBase64: finalBase64,
        rating: rating,
        businessType: kioskConfig?.businessType || 'generic',
        organizationId: kioskConfig?.organizationId || 'preview',
        branchId: kioskConfig?.branchId || 'main',
        businessId: businessId, // Server will write to Firestore for us
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to analyze feedback.");
      const analysis = await res.json();

      const dbPayload = {
        text: analysis.text || textFeedback,
        sentiment: analysis.sentiment,
        emotion: analysis.emotion,
        score: analysis.score,
        topics: analysis.topics,
        executiveSummary: analysis.executiveSummary,
        rootCause: analysis.rootCause,
        businessImpact: analysis.businessImpact,
        urgency: analysis.urgency,
        recommendation: analysis.recommendation,
        confidence: analysis.confidence,
        source: 'kiosk',
        status: analysis.urgency === 'High' ? 'critical' : 'open',
        rating: rating,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (finalBase64) dbPayload.audioBase64 = finalBase64;

      if (kioskConfig?.collectContact) {
        setPendingFeedback(dbPayload);
        setStep('contact');
      } else {
        if (!previewMode) {
          try {
             await addDoc(collection(db, `businesses/${businessId}/feedbacks`), dbPayload);
          } catch(dbErr) {
             console.error("Firestore Write Error:", dbErr);
             throw new Error("Missing or insufficient permissions. Please update your Firebase Rules.");
          }
        }
        setStep('done');
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. " + err.message);
      setStep('feedback'); // Fallback
    } finally {
      clearInterval(loaderInterval);
    }
  };

  const finalizeFeedback = async (skipContact = false) => {
    setStep('processing');
    try {
      const finalPayload = { ...pendingFeedback };
      if (!skipContact && contactInfo.trim()) {
        finalPayload.customerContact = contactInfo.trim();
      }
      if (!previewMode) {
        await addDoc(collection(db, `businesses/${businessId}/feedbacks`), finalPayload);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to save securely.");
    } finally {
      setStep('done');
    }
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
  Object.keys(dynamicStyles).forEach(key => dynamicStyles[key] === undefined && delete dynamicStyles[key]);

  const followUpQuestion = rating <= 2 
    ? template.followUpQuestions.negative 
    : rating === 3 
      ? template.followUpQuestions.neutral 
      : template.followUpQuestions.positive;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative font-sans overflow-hidden" style={dynamicStyles}>
      <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-neutral-600 dark:text-neutral-400 transition-colors z-50">
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-[0.03]">
        <TemplateIcon className="w-[120vw] h-[120vw] text-foreground rotate-12" />
      </div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: WELCOME & RATING */}
        {step === 'welcome' && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl p-8 md:p-10 text-center relative z-10"
          >
            {kioskConfig?.logoUrl && (
              <img src={kioskConfig.logoUrl} alt="Logo" className="h-16 mx-auto mb-6 object-contain" />
            )}
            
            <h1 className="text-3xl font-extrabold tracking-tight mb-3 text-card-foreground">
              {kioskConfig?.kioskTitle || template.defaultWelcome}
            </h1>
            <p className="text-muted-foreground font-medium mb-10">
              {kioskConfig?.kioskMessage || 'Please rate your experience with us.'}
            </p>

            <div className="relative mb-8 flex justify-center">
              {/* Background (empty) icon */}
              <TemplateIcon className="w-32 h-32 text-muted-foreground/20 stroke-[1.5]" />
              {/* Foreground (filled) icon - clips from left based on rating */}
              {rating > 0 && (
                <div 
                  className={`absolute inset-0 flex justify-center transition-all duration-700 ease-out ${RATING_COLORS[rating]}`}
                  style={{ clipPath: `inset(0 ${100 - (rating / 5) * 100}% 0 0)` }}
                >
                  <TemplateIcon className="w-32 h-32 stroke-[1.5] fill-current" />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center bg-secondary/50 rounded-full p-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={(e) => { e.stopPropagation(); handleRatingSelect(star); }}
                  className="p-3 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors duration-300 ${rating >= star ? RATING_COLORS[rating] : 'text-muted-foreground/30'} ${rating >= star ? 'fill-current' : ''}`}
                  />
                </button>
              ))}
            </div>
            
            <div className="h-6">
              <AnimatePresence mode="wait">
                {rating > 0 && (
                  <motion.p 
                    key={rating}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`font-semibold ${RATING_COLORS[rating]}`}
                  >
                    {template.ratingLabels[rating]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* STEP 2: FEEDBACK COLLECTION */}
        {step === 'feedback' && (
          <motion.div 
            key="feedback"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl p-8 relative z-10"
          >
            <button onClick={() => setStep('welcome')} className="absolute top-6 left-6 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            
            <div className="mt-8 text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">{followUpQuestion}</h2>
              {isFeedbackRequired ? (
                <p className="text-red-500 text-sm font-medium">Please provide more details to help us improve.</p>
              ) : (
                <p className="text-muted-foreground text-sm">You can skip this step if you'd like.</p>
              )}
            </div>

            <div className="space-y-6">
              {/* Voice Recorder */}
              <div className="bg-secondary/30 p-6 rounded-2xl border border-border text-center">
                {!recording && !audioBase64 && (
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={startRecording}
                      className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                    >
                      <Mic className="w-10 h-10" />
                    </button>
                    <p className="mt-4 font-medium">Tap to Record Voice</p>
                  </div>
                )}
                
                {recording && (
                  <div className="flex flex-col items-center">
                    <div className="w-full h-12 flex items-center justify-center gap-1 mb-6">
                       {[...Array(10)].map((_, i) => (
                         <motion.div 
                           key={i}
                           animate={{ height: ['20%', '80%', '20%'] }}
                           transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                           className="w-2 bg-red-500 rounded-full"
                         />
                       ))}
                    </div>
                    <button 
                      onClick={stopRecording}
                      className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform animate-pulse"
                    >
                      <Square className="w-6 h-6 fill-current" />
                    </button>
                    <p className="mt-4 font-mono font-medium text-red-500">00:{time.toString().padStart(2, '0')}</p>
                  </div>
                )}

                {audioBase64 && (
                  <div className="flex items-center justify-between bg-background p-3 rounded-xl border border-border">
                    <button onClick={togglePlayback} className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                    </button>
                    <div className="flex-1 px-4 text-sm font-medium">Voice note recorded</div>
                    <button onClick={discardRecording} className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <audio ref={audioPlayerRef} onEnded={() => setIsPlaying(false)} className="hidden" />
                  </div>
                )}
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea
                  className="w-full bg-background border border-border rounded-xl p-4 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Or type your feedback here..."
                  value={textFeedback}
                  onChange={(e) => setTextFeedback(e.target.value)}
                />
              </div>

              {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
              
              <div className="flex gap-4">
                <Button 
                  onClick={submitFeedback}
                  disabled={!canProceed}
                  className="w-full h-14 rounded-xl text-lg font-semibold gap-2"
                >
                  Submit Feedback <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: PROCESSING */}
        {step === 'processing' && (
          <motion.div 
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 max-w-sm relative z-10"
          >
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Analyzing Feedback</h2>
            <div className="h-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={analysisSteps}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-muted-foreground"
                >
                  {['Transcribing audio...', 'Understanding sentiment...', 'Extracting business insights...', 'Finalizing report...'][analysisSteps]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* STEP 4: CONTACT (Optional) */}
        {step === 'contact' && (
          <motion.div 
            key="contact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl p-10 text-center relative z-10"
          >
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground mb-2">Want a follow-up?</h2>
            <p className="text-sm font-medium text-muted-foreground mb-8">Leave your email or number so we can get back to you.</p>
            <input 
              type="text" 
              placeholder="Email or Phone Number"
              className="w-full bg-background border border-border rounded-xl px-4 py-4 text-base focus:ring-2 focus:ring-primary/50 outline-none mb-6"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
            <Button onClick={() => finalizeFeedback(false)} disabled={!contactInfo.trim()} className="w-full h-12 mb-3">
              Notify Me
            </Button>
            <Button variant="ghost" onClick={() => finalizeFeedback(true)} className="w-full h-12">
              Skip for now
            </Button>
          </motion.div>
        )}

        {/* STEP 5: DONE */}
        {step === 'done' && (
          <motion.div 
            key="done"
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-center p-8 max-w-md w-full relative z-10"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/20"
            >
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-foreground">
              {kioskConfig?.thankyouHeadline || "Thank you!"}
            </h2>
            <p className="text-muted-foreground font-medium mb-8">
              {kioskConfig?.thankyouDescription || "Your feedback has been securely analyzed and relayed to the manager."}
            </p>
            
            {/* Google Review CTA only for 5 stars */}
            {rating === 5 && kioskConfig?.googleReviewLink && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card border border-border p-6 rounded-2xl shadow-lg mt-8"
              >
                <div className="flex justify-center mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 text-yellow-500 fill-current" />)}
                </div>
                <h3 className="font-bold text-lg mb-2">Support us on Google</h3>
                <p className="text-sm text-muted-foreground mb-6">If you loved your experience, we'd greatly appreciate a public review.</p>
                <a href={kioskConfig.googleReviewLink} target="_blank" rel="noopener noreferrer">
                   <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                     Leave a Google Review <ArrowRight className="w-4 h-4" />
                   </Button>
                </a>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
