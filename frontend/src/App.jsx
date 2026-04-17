import { useState, useCallback, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Leaf,
  Recycle,
  FileText,
  Zap,
  Droplets,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Camera,
  Globe,
  ShieldCheck,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:8000/api/classify/'

const CATEGORIES = {
  Plastic: {
    Icon: Recycle,
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.35)',
    badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    label: 'Recyclable Plastic',
    bg: 'from-blue-500/20 to-transparent',
  },
  Paper: {
    Icon: FileText,
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.35)',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    label: 'Recyclable Paper',
    bg: 'from-amber-500/20 to-transparent',
  },
  Metal: {
    Icon: Zap,
    color: '#e2e8f0',
    glow: 'rgba(226,232,240,0.25)',
    badge: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
    label: 'Recyclable Metal',
    bg: 'from-slate-400/20 to-transparent',
  },
  Glass: {
    Icon: Droplets,
    color: '#22d3ee',
    glow: 'rgba(34,211,238,0.35)',
    badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    label: 'Recyclable Glass',
    bg: 'from-cyan-500/20 to-transparent',
  },
  Organic: {
    Icon: Leaf,
    color: '#4ade80',
    glow: 'rgba(74,222,128,0.35)',
    badge: 'bg-green-500/20 text-green-300 border border-green-500/30',
    label: 'Organic Waste',
    bg: 'from-green-500/20 to-transparent',
  },
  Unknown: {
    Icon: HelpCircle,
    color: '#c084fc',
    glow: 'rgba(192,132,252,0.35)',
    badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    label: 'Unknown Material',
    bg: 'from-purple-500/20 to-transparent',
  },
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: 'easeIn' } },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

const childFade = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBar({ confidence, color }) {
  const getLabel = (v) => (v >= 80 ? 'High' : v >= 50 ? 'Medium' : 'Low')
  const getLabelColor = (v) =>
    v >= 80 ? 'text-emerald-400' : v >= 50 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-white/40">
          Confidence
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-xs font-semibold ${getLabelColor(confidence)}`}>
            {getLabel(confidence)}
          </span>
          <span className="text-2xl font-black tabular-nums" style={{ color }}>
            {confidence}%
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            boxShadow: `0 0 8px ${color}`,
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.25 }}
        />
      </div>
    </div>
  )
}

function TipCard({ tip, index }) {
  return (
    <motion.div
      variants={childFade}
      className="group flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-emerald-500/25 transition-all duration-200 cursor-default"
    >
      <span
        className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500/25 transition-colors"
      >
        {index + 1}
      </span>
      <p className="text-sm text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">
        {tip}
      </p>
    </motion.div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function App() {
  const [status, setStatus] = useState('idle') // idle | scanning | success | error
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const processFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) return
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setErrorMsg('')
    setStatus('idle')
  }, [preview])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      processFile(e.dataTransfer.files[0])
    },
    [processFile],
  )

  const onDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const onDragLeave = () => setIsDragging(false)
  const onFileChange = (e) => processFile(e.target.files[0])

  const analyze = async () => {
    if (!file) return
    setStatus('scanning')
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
      setStatus('success')
    } catch (err) {
      console.error('[EcoLens] classify error:', err)
      let msg = 'Classification failed. Check your connection and try again.'
      if (err.response?.data?.error) {
        msg = err.response.data.error
      } else if (err.response) {
        msg = `Server error ${err.response.status}: ${err.response.statusText}`
      } else if (err.request) {
        msg = 'Cannot reach the backend. Is Django running on http://localhost:8000?'
      } else {
        msg = err.message || msg
      }
      setErrorMsg(msg)
      setStatus('error')
    }
  }

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview)
    setStatus('idle')
    setFile(null)
    setPreview(null)
    setResult(null)
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const catInfo = result ? (CATEGORIES[result.category] ?? CATEGORIES.Unknown) : null

  // ── Render ──

  return (
    <div className="min-h-screen bg-[#050a08] text-white relative overflow-x-hidden">
      {/* Background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Ambient glow orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 -left-40 w-[500px] h-[500px] rounded-full animate-glow-pulse"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.07) 0%, transparent 65%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-40 -right-40 w-[500px] h-[500px] rounded-full animate-glow-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 65%)',
          animationDelay: '1.5s',
        }}
      />

      {/* Page content */}
      <div className="relative z-10 max-w-xl mx-auto px-4 py-12 pb-20">
        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 mb-5 rounded-full border text-xs font-semibold tracking-widest uppercase"
            style={{
              background: 'rgba(0,255,136,0.08)',
              borderColor: 'rgba(0,255,136,0.2)',
              color: '#00ff88',
            }}
          >
            <Sparkles className="w-3 h-3" />
            Gemini 1.5 Flash · Vision AI
          </motion.div>

          {/* Title */}
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight leading-none mb-3">
            <span className="text-white">Eco</span>
            <span
              style={{
                color: '#00ff88',
                textShadow: '0 0 40px rgba(0,255,136,0.5), 0 0 80px rgba(0,255,136,0.2)',
              }}
            >
              Lens
            </span>
            <span
              className="ml-2 text-4xl sm:text-5xl font-light text-white/30 align-middle"
            >
              AI
            </span>
          </h1>

          <p className="text-white/35 text-sm sm:text-base mt-2 max-w-sm mx-auto leading-relaxed">
            Snap. Drop. Know. — Instant AI waste classification & eco-tips in seconds.
          </p>
        </motion.header>

        {/* ── Main Card ── */}
        <motion.main
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 0 0 1px rgba(0,255,136,0.04), 0 32px 64px rgba(0,0,0,0.5)',
          }}
        >
          <AnimatePresence mode="wait">

            {/* ════════════════ IDLE / ERROR STATE ════════════════ */}
            {(status === 'idle' || status === 'error') && (
              <motion.div key="upload" {...fadeUp} className="p-6">

                {/* Drop Zone */}
                <div
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onClick={() => !preview && inputRef.current?.click()}
                  className={`
                    relative rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden
                    ${isDragging
                      ? 'border-[#00ff88] bg-[rgba(0,255,136,0.07)]'
                      : preview
                      ? 'border-white/10 cursor-default'
                      : 'border-white/[0.12] hover:border-[rgba(0,255,136,0.4)] hover:bg-[rgba(0,255,136,0.04)] cursor-pointer'
                    }
                  `}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileChange}
                  />

                  {preview ? (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Selected waste image"
                        className="w-full object-cover max-h-72 block"
                        style={{ borderRadius: '0.6rem 0.6rem 0 0' }}
                      />
                      {/* Vignette overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(to bottom, transparent 60%, rgba(5,10,8,0.6) 100%)',
                        }}
                      />
                      {/* Reset button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); reset() }}
                        className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 hover:bg-black/80 border border-white/10 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                        title="Remove image"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-white/70" />
                      </button>
                      {/* File name pill */}
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-xs text-white/50 truncate max-w-[200px]">
                        {file?.name}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-14 px-8 select-none">
                      <motion.div
                        animate={{ y: isDragging ? -10 : 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="mb-5 p-5 rounded-2xl"
                        style={{
                          background: 'rgba(0,255,136,0.08)',
                          border: '1px solid rgba(0,255,136,0.18)',
                          boxShadow: isDragging ? '0 0 30px rgba(0,255,136,0.2)' : 'none',
                        }}
                      >
                        {isDragging ? (
                          <Camera className="w-8 h-8" style={{ color: '#00ff88' }} />
                        ) : (
                          <Upload className="w-8 h-8" style={{ color: '#00ff88' }} />
                        )}
                      </motion.div>
                      <p className="text-white/55 text-sm font-medium mb-1">
                        {isDragging ? 'Release to classify!' : 'Drag & drop a waste image'}
                      </p>
                      <p className="text-white/25 text-xs">or click to browse · PNG, JPG, WEBP up to 10 MB</p>
                    </div>
                  )}
                </div>

                {/* Error banner */}
                <AnimatePresence>
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/25 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Analyse button */}
                <AnimatePresence>
                  {preview && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4"
                    >
                      <motion.button
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.975 }}
                        onClick={analyze}
                        className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-[0.12em] text-black flex items-center justify-center gap-2.5"
                        style={{
                          background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                          boxShadow:
                            '0 0 0 1px rgba(0,255,136,0.3), 0 0 30px rgba(0,255,136,0.2), 0 8px 24px rgba(0,0,0,0.4)',
                        }}
                      >
                        <Sparkles className="w-4 h-4" />
                        Analyse Waste
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ════════════════ SCANNING STATE ════════════════ */}
            {status === 'scanning' && (
              <motion.div key="scanning" {...fadeUp} className="p-6">
                {/* Image with laser scan overlay */}
                <div
                  className="relative rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(0,255,136,0.2)' }}
                >
                  <img
                    src={preview}
                    alt="Scanning"
                    className="w-full object-cover max-h-72 block opacity-50"
                  />

                  {/* Dark scan tint */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'rgba(5,10,8,0.4)' }}
                  />

                  {/* Scanline grid overlay */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(0,255,136,0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,255,136,0.5) 1px, transparent 1px)
                      `,
                      backgroundSize: '28px 28px',
                    }}
                  />

                  {/* ── Laser Line ── */}
                  <motion.div
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{
                      height: '2px',
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(0,255,136,0.2) 15%, #00ff88 50%, rgba(0,255,136,0.2) 85%, transparent 100%)',
                      boxShadow: '0 0 12px 4px rgba(0,255,136,0.7), 0 0 40px 10px rgba(0,255,136,0.2)',
                      top: 0,
                    }}
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{
                      duration: 2.2,
                      ease: 'linear',
                      repeat: Infinity,
                    }}
                  />

                  {/* Corner brackets */}
                  {[
                    'top-3 left-3 border-t-2 border-l-2',
                    'top-3 right-3 border-t-2 border-r-2',
                    'bottom-3 left-3 border-b-2 border-l-2',
                    'bottom-3 right-3 border-b-2 border-r-2',
                  ].map((cls, i) => (
                    <div
                      key={i}
                      className={`absolute w-5 h-5 rounded-sm ${cls}`}
                      style={{ borderColor: '#00ff88' }}
                    />
                  ))}

                  {/* Centre reticle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1.05, 0.95] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        border: '1.5px solid rgba(0,255,136,0.5)',
                        background: 'rgba(0,255,136,0.06)',
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: '#00ff88', boxShadow: '0 0 8px #00ff88' }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Status text */}
                <div className="mt-5 text-center space-y-1">
                  <motion.p
                    className="text-sm font-semibold tracking-widest uppercase"
                    style={{ color: '#00ff88' }}
                    animate={{ opacity: [1, 0.45, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    Scanning with Gemini AI…
                  </motion.p>
                  <p className="text-white/25 text-xs">Identifying material and generating eco-tips</p>

                  {/* Loading dots */}
                  <div className="flex justify-center gap-1.5 pt-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: '#00ff88' }}
                        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════════════ SUCCESS STATE ════════════════ */}
            {status === 'success' && result && catInfo && (
              <motion.div key="result" {...fadeUp} className="p-6">

                {/* Category glow header */}
                <div
                  className="relative rounded-xl p-4 mb-5 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${catInfo.glow.replace('0.35', '0.12')}, rgba(255,255,255,0.02))`,
                    border: `1px solid ${catInfo.color}30`,
                  }}
                >
                  {/* Decorative large icon */}
                  <catInfo.Icon
                    className="absolute -right-4 -top-4 w-28 h-28 opacity-[0.06] pointer-events-none"
                    style={{ color: catInfo.color }}
                  />

                  <div className="flex items-start gap-4 relative">
                    {/* Thumbnail */}
                    <div
                      className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden"
                      style={{ border: `2px solid ${catInfo.color}40` }}
                    >
                      <img src={preview} alt="Result" className="w-full h-full object-cover" />
                      {/* Icon badge overlay */}
                      <div
                        className="absolute bottom-0 right-0 p-1.5 rounded-tl-lg"
                        style={{ background: `${catInfo.color}25`, backdropFilter: 'blur(4px)' }}
                      >
                        <catInfo.Icon className="w-3.5 h-3.5" style={{ color: catInfo.color }} />
                      </div>
                    </div>

                    {/* Text info */}
                    <div className="min-w-0 flex-1">
                      {/* Category badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-2 ${catInfo.badge}`}
                      >
                        <catInfo.Icon className="w-3 h-3" />
                        {catInfo.label}
                      </span>

                      {/* Item name */}
                      <h2 className="text-lg font-extrabold text-white leading-tight truncate">
                        {result.item_name || result.category}
                      </h2>
                      <p className="text-white/35 text-xs mt-0.5">
                        Detected category: <span className="text-white/55 font-medium">{result.category}</span>
                      </p>

                      {/* Confidence bar */}
                      <div className="mt-3">
                        <ConfidenceBar confidence={result.confidence} color={catInfo.color} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Eco-Insights section */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <h3 className="text-[10px] font-bold tracking-widest uppercase text-white/40">
                      Eco-Insights
                    </h3>
                  </div>
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2">
                    {result.tips?.map((tip, i) => (
                      <TipCard key={i} tip={tip} index={i} />
                    ))}
                  </motion.div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/[0.06] mb-4" />

                {/* Trust badge + Reset */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-white/25 text-[10px]">
                    <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
                    Powered by Gemini Vision
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={reset}
                    className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] text-white/50 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/[0.05] text-xs font-medium transition-all duration-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Classify Another
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.main>

        {/* ── Footer ── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 space-y-1"
        >
          <p className="text-white/[0.18] text-xs">
            EcoLens AI · Making recycling smarter, one scan at a time.
          </p>
          <p className="text-white/[0.1] text-[10px]">
            Built with Django · React · Gemini 1.5 Flash
          </p>
        </motion.footer>
      </div>
    </div>
  )
}
