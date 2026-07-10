import { Mic, Square } from 'lucide-react';
import { motion } from 'motion/react';

export default function RecordingButton({ isRecording, onClick, disabled }) {
  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <>
          <motion.div
            animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-rose-500/30 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
            className="absolute inset-0 bg-rose-500/20 rounded-full"
          />
        </>
      )}
      <button
        onClick={onClick}
        disabled={disabled}
        type="button"
        className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none ${
          isRecording
            ? 'bg-rose-50 border-4 border-rose-500 text-rose-500 scale-110 shadow-[0_0_40px_rgba(244,63,94,0.3)]'
            : 'bg-slate-900 text-white hover:scale-105 hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:opacity-50'
        }`}
      >
        {isRecording ? (
          <Square className="w-8 h-8 fill-current" />
        ) : (
          <Mic className="w-10 h-10 stroke-[1.5]" />
        )}
      </button>
    </div>
  );
}
