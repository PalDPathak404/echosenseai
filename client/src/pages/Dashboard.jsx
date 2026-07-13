import { useEffect, useState, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, AlertTriangle, Star, Activity, TrendingUp } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';

export default function DashboardHome() {
  const { businessId } = useOutletContext();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    if (!businessId) return;
    try {
      const q = query(
        collection(db, `businesses/${businessId}/feedbacks`),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const fbData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeedbacks(fbData);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeedbacks();
  };

  if (loading || !businessId) {
    return <div className="text-sm font-medium text-muted-foreground p-8">Loading workspace analytics...</div>;
  }

  const totalFeedback = feedbacks.length;
  
  // Calculate Average Rating
  const validRatings = feedbacks.filter(f => typeof f.rating === 'number' && f.rating > 0);
  const avgRating = validRatings.length > 0 
    ? (validRatings.reduce((acc, curr) => acc + curr.rating, 0) / validRatings.length).toFixed(1)
    : 0;

  // Rating Distribution
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  validRatings.forEach(f => ratingCounts[f.rating]++);
  
  // Negative Alert Engine
  const criticalFeedbacks = feedbacks.filter(f => 
    (f.status === 'open' || f.status === 'critical') && 
    (f.rating <= 2 || f.urgency === 'High' || f.businessImpact?.level === 'Critical')
  );

  const containerAnimations = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemAnimations = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerAnimations} initial="hidden" animate="show" className="h-full flex flex-col space-y-6">
      <Helmet>
        <title>Analytics Dashboard | Shruviq</title>
      </Helmet>

      {/* Negative Alert Engine Banner */}
      <AnimatePresence>
        {criticalFeedbacks.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/60 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Action Required: Critical Feedback Detected</h3>
                <p className="text-xs mt-0.5 opacity-80">You have {criticalFeedbacks.length} unresolved feedback items requiring immediate attention.</p>
              </div>
            </div>
            <Link to="/feedback" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap">
                Review Escalations
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-semibold tracking-tight">Analytics Overview</h2>
           <p className="text-muted-foreground mt-1">Real-time performance and customer sentiment.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-4 min-h-[500px] h-full pb-10">
        
        {/* Card 1: Average Rating */}
        <motion.div variants={itemAnimations} className="md:col-span-4 lg:col-span-3 flex flex-col">
          <Card className="h-full flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow p-5 rounded-xl border-l-4 border-l-yellow-500">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" /> Average Experience
            </div>
            <div className="flex items-baseline gap-2">
               <div className="text-5xl font-extrabold leading-none tracking-tight">{avgRating}</div>
               <div className="text-xl font-medium text-muted-foreground">/ 5</div>
            </div>
            <div className="text-[13px] font-medium mt-3 text-success flex items-center gap-1">
               <TrendingUp className="w-3.5 h-3.5" /> +0.2 from last week
            </div>
          </Card>
        </motion.div>
        
        {/* Card 2: Voice/Feedback Volume */}
        <motion.div variants={itemAnimations} className="md:col-span-4 lg:col-span-3 flex flex-col">
          <Card className="h-full flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow p-5 rounded-xl border-l-4 border-l-primary">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Total Feedback Volume
              </div>
              <div className="text-4xl font-extrabold leading-none">{totalFeedback}</div>
              <div className="text-[13px] font-medium mt-1 text-muted-foreground">Total records analyzed</div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
               <div className="text-xs font-medium text-muted-foreground flex justify-between">
                 <span>Audio Notes</span>
                 <span className="font-bold text-foreground">
                   {feedbacks.filter(f => f.audioBase64).length}
                 </span>
               </div>
               <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${totalFeedback ? (feedbacks.filter(f => f.audioBase64).length / totalFeedback) * 100 : 0}%` }}
                  />
               </div>
            </div>
          </Card>
        </motion.div>

        {/* Card 3: Rating Distribution */}
        <motion.div variants={itemAnimations} className="md:col-span-4 lg:col-span-6 md:row-span-2 flex flex-col">
          <Card className="h-full flex flex-col shadow-sm p-5 rounded-xl hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">Rating Distribution</div>
            <div className="flex-grow flex flex-col justify-center gap-4">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts[star];
                const pct = validRatings.length > 0 ? (count / validRatings.length) * 100 : 0;
                
                let colorClass = 'bg-primary';
                if (star === 5) colorClass = 'bg-green-500';
                if (star === 4) colorClass = 'bg-lime-500';
                if (star === 3) colorClass = 'bg-yellow-500';
                if (star === 2) colorClass = 'bg-orange-500';
                if (star === 1) colorClass = 'bg-red-500';

                return (
                  <div key={star} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-12 shrink-0">
                      <span className="text-sm font-semibold">{star}</span>
                      <Star className="w-3.5 h-3.5 text-muted-foreground fill-current" />
                    </div>
                    <div className="flex-grow h-3 bg-secondary rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${pct}%` }} 
                        transition={{ duration: 1, delay: 0.2 + (5 - star) * 0.1 }} 
                        className={`h-full rounded-full ${colorClass}`} 
                      />
                    </div>
                    <div className="w-8 text-right text-xs font-semibold text-muted-foreground shrink-0">{count}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Card 4: Key Themes Velocity */}
        <motion.div variants={itemAnimations} className="md:col-span-8 lg:col-span-6 flex flex-col">
          <Card className="h-full flex flex-col shadow-sm p-5 rounded-xl hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Detected Categories Velocity</div>
            <div className="flex flex-wrap gap-2 flex-grow content-start">
              {(() => {
                const allCategories = feedbacks.flatMap(f => f.detectedCategories || f.topics || []).reduce((acc, t) => {
                  acc[t] = (acc[t] || 0) + 1;
                  return acc;
                }, {});
                const sorted = Object.entries(allCategories).sort((a, b) => b[1] - a[1]).slice(0, 10);
                
                if (sorted.length > 0) {
                  return sorted.map(([t, count], idx) => (
                    <div key={t} className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap
                      ${idx < 3 ? 'bg-primary/10 text-primary font-bold' : 'bg-secondary text-secondary-foreground'}`}>
                      {t} ({count})
                    </div>
                  ));
                } else {
                  return (
                    <div className="text-sm font-medium text-muted-foreground py-2">No categories extracted yet.</div>
                  )
                }
              })()}
            </div>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}
