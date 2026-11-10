'use client'

import { useState, useRef, useCallback, useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  Play,
  Settings as SettingsIcon,
  Maximize2,
  Clock,
  Pause,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import {
  FeaturesSection,
  WhySection,
  FaqSection,
  FooterSection,
} from "./components/sections";
import { useTranslation } from "@/lib/i18n";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

function VideoSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-4 sm:flex-row">
      <div className="w-full space-y-2 sm:w-1/2">
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      <div className="w-full space-y-3 sm:w-1/2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PatternSkeleton() {
  return (
    <div className="mt-5 flex flex-col gap-4 rounded-xl border border-border bg-background/60 p-4 sm:flex-row sm:gap-5">
      <div className="hidden w-32 shrink-0 space-y-3 sm:block">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20 mt-3" />
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-5/6" />
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-4/6" />
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-3/4" />
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-2/3" />
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-5/6" />
        <Skeleton className="h-2.5 w-full" />
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

interface YTPlayer {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  pauseVideo: () => void
  setPlaybackRate: (rate: number) => void
}

declare global {
  interface Window {
    YT: {
      Player: new (id: string, config: Record<string, unknown>) => YTPlayer
      PlayerState: { PLAYING: number; PAUSED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayerRef {
  player: YTPlayer | null
  ready: boolean
}

export default function Index() {
  const { t, locale, setLocale } = useTranslation()
  const [url, setUrl] = useState("")
  const [videoInfo, setVideoInfo] = useState<{
    title: string
    channelName: string
    channelAvatar: string
    thumbnailUrl: string
    description: string
    videoId: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPattern, setLoadingPattern] = useState(false)
  const [error, setError] = useState("")
  const [generated, setGenerated] = useState(false)
  const [terminology, setTerminology] = useState<"us" | "fr">("fr")
  const [pattern, setPattern] = useState<{
    materials: string
    abbreviations: string
    steps: { label: string; timestamp: number; uncertain: boolean; rounds: { number: number; instruction: string; stitches: number; timestamp: number }[] }[]
  } | null>(null)

  const [progress, setProgress] = useState(0)
  const [playerReady, setPlayerReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [notTutorial, setNotTutorial] = useState(false)
  const playerRef = useRef<YTPlayerRef>({ player: null, ready: false })
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const iframeId = `yt-player-${videoInfo?.videoId ?? "none"}`

  const loadYTPlayer = useCallback(() => {
    if (window.YT?.Player) {
      createPlayer()
      return
    }
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => createPlayer()
  }, [videoInfo?.videoId])

  const createPlayer = useCallback(() => {
    if (!videoInfo?.videoId || !document.getElementById(iframeId)) return
    const player = new window.YT.Player(iframeId, {
      videoId: videoInfo.videoId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
        color: "white",
      },
      events: {
        onReady: () => {
          playerRef.current = { player, ready: true }
          setPlayerReady(true)
        },
        onStateChange: (e: { data: number }) => {
          setIsPlaying(e.data === window.YT?.PlayerState?.PLAYING)
        },
      },
    })
  }, [videoInfo?.videoId, iframeId])

  useEffect(() => {
    if (videoInfo?.videoId && generated) {
      setPlayerReady(false)
      setIsPlaying(false)
      setPlaybackRate(1)
      playerRef.current = { player: null, ready: false }
      setTimeout(loadYTPlayer, 100)
    }
  }, [videoInfo?.videoId, generated])

  useEffect(() => {
    if (!loadingPattern) {
      setProgress(0)
      return
    }
    const duration = 55000
    const interval = 100
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      setProgress(Math.min((elapsed / duration) * 100, 100))
    }, interval)
    return () => clearInterval(timer)
  }, [loadingPattern])


  const seekTo = useCallback((seconds: number) => {
    const p = playerRef.current.player
    if (p && playerRef.current.ready) {
      p.seekTo(seconds, true)
      p.playVideo()
    }
  }, [])

  const togglePlay = useCallback(() => {
    const p = playerRef.current.player
    if (!p || !playerRef.current.ready) return
    if (isPlaying) p.pauseVideo()
    else p.playVideo()
  }, [isPlaying])

  const changeSpeed = useCallback((rate: number) => {
    const p = playerRef.current.player
    if (p && playerRef.current.ready) {
      p.setPlaybackRate(rate)
      setPlaybackRate(rate)
    }
    setShowSpeedMenu(false)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const container = playerContainerRef.current
    if (!container) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }, [])

  const parsePattern = (raw: string) => {
    let cleaned = raw.trim()
    const jsonMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
    if (jsonMatch) {
      cleaned = jsonMatch[1].trim()
    }
    try {
      const parsed = JSON.parse(cleaned)
      // Migrate old format: instruction string -> rounds array
      if (parsed.steps) {
        parsed.steps = parsed.steps.map((s: Record<string, unknown>) => {
          if (!s.rounds && s.instruction && typeof s.instruction === 'string') {
            const lines = (s.instruction as string).split('\n').filter((l: string) => l.trim())
            const rounds = lines.map((line: string) => {
              const match = line.trim().match(/^(?:Rnd|Rang|Row|Rée?)\s*(\d+)[.:]\s*(.+)/i)
              if (match) {
                const stitchMatch = match[2].match(/\((\d+)\s*(?:sts?)?\)\s*$/i)
                return {
                  number: parseInt(match[1]),
                  instruction: stitchMatch ? match[2].replace(stitchMatch[0], '').trim() : match[2],
                  stitches: stitchMatch ? parseInt(stitchMatch[1]) : 0,
                  timestamp: s.timestamp || 0,
                }
              }
              return { number: 0, instruction: line.trim(), stitches: 0, timestamp: s.timestamp || 0 }
            })
            return { label: s.label, timestamp: s.timestamp || 0, uncertain: s.uncertain || false, rounds }
          }
          // Ensure rounds have timestamp field
          if (s.rounds && Array.isArray(s.rounds)) {
            s.rounds = s.rounds.map((r: Record<string, unknown>) => ({
              ...r,
              timestamp: r.timestamp || s.timestamp || 0,
            }))
          }
          return s
        })
        // Clean step labels: remove parenthetical content
        parsed.steps = parsed.steps.map((s: { label: string; [key: string]: unknown }) => ({
          ...s,
          label: s.label.replace(/\s*\(.*?\)\s*/g, '').trim(),
        }))
      }
      return parsed as {
        materials: string
        abbreviations: string
        steps: { label: string; timestamp: number; uncertain: boolean; rounds: { number: number; instruction: string; stitches: number; timestamp: number }[] }[]
      }
    } catch {
      return null
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setLoadingPattern(false)
    setError("")
    setNotTutorial(false)
    setVideoInfo(null)
    setPattern(null)
    setGenerated(true)
    try {
      const res = await fetch(`/api/video-info?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('errors.fetchError'))
      setVideoInfo(data)
      setLoading(false)

      const checkRes = await fetch(`/api/check-tutorial?title=${encodeURIComponent(data.title)}`)
      const checkData = await checkRes.json()
      if (!checkRes.ok) throw new Error(checkData.error || t('errors.unexpectedError'))
      if (!checkData.isTutorial) {
        setNotTutorial(true)
        return
      }

      setLoadingPattern(true)
      const langParam = terminology === "fr" ? "fr" : "en"
      const transcriptRes = await fetch(
        `/api/transcript?videoId=${data.videoId}&lang=${langParam}&terminology=${terminology}`
      )
      const transcriptData = await transcriptRes.json()
      if (!transcriptRes.ok) throw new Error(transcriptData.error || t('errors.transcriptError'))
      if (transcriptData.pattern) {
        const parsed = parsePattern(transcriptData.pattern)
        if (parsed) setPattern(parsed)
        else {
          console.error('Failed to parse pattern:', transcriptData.pattern)
          setError(t('errors.unexpectedError'))
        }
      }
    } catch {
      setError(t('errors.unexpectedError'))
    } finally {
      setLoading(false)
      setLoadingPattern(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit()
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased overflow-hidden">
      {/* NAV */}
      <header className="relative mx-auto max-w-[1400px] px-4 py-4 md:px-8 md:py-6" role="banner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Hookara" className="h-6 w-auto" />
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <nav className="hidden items-center gap-10 text-sm text-foreground/80 md:flex" aria-label="Main navigation">
              <a href="#fonctionnalites" className="hover:text-foreground">{t('nav.features')}</a>
              <a href="#faq" className="hover:text-foreground">{t('nav.faq')}</a>
            </nav>
            <div className="flex overflow-hidden rounded-lg border border-border bg-background">
              <button
                onClick={() => setLocale("fr")}
                className={`px-2 py-1 text-base transition ${locale === "fr" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-secondary"}`}
              >
                🇫🇷
              </button>
              <button
                onClick={() => setLocale("en")}
                className={`px-2 py-1 text-base transition ${locale === "en" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-secondary"}`}
              >
                🇬🇧
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-secondary md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-lg md:hidden" aria-label="Mobile navigation">
            <a href="#fonctionnalites" onClick={() => setMobileMenuOpen(false)} className="text-sm text-foreground/80 hover:text-foreground">{t('nav.features')}</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm text-foreground/80 hover:text-foreground">{t('nav.faq')}</a>
          </nav>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main>
      <section className="relative bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-background/70 md:bg-gradient-to-r md:from-background md:via-background/90 md:to-transparent" />
        <div className="relative mx-auto flex max-w-[1400px] flex-col gap-6 px-4 pb-6 pt-4 sm:gap-12 sm:px-8 sm:pb-20 sm:pt-8 lg:flex-row">
          {/* LEFT PANEL */}
          <div
            className={`shrink-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${generated ? "w-full lg:w-[45%]" : "w-full"}`}
          >
            <div className={generated ? "max-w-xl" : "mx-auto"}>
              <h1 className={`mt-4 font-bold leading-[1.05] tracking-tight text-foreground sm:mt-6 ${generated ? "text-3xl sm:text-4xl md:text-5xl lg:text-[64px]" : "text-center max-w-4xl mx-auto text-4xl sm:text-5xl md:text-6xl lg:text-[72px]"}`}>
                {t('hero.title')}{" "}
                <span className="relative whitespace-nowrap text-primary">
                  {t('hero.titleHighlight')}
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 5"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 8 Q 150 -2 298 6"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p className={`mt-4 leading-relaxed text-muted-foreground sm:mt-6 ${generated ? "max-w-lg text-base sm:text-lg" : "mx-auto text-center text-base sm:text-xl"}`}>
                {t('hero.description')}
              </p>

              {/* Input */}
              <div className={`mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:mt-8 ${generated ? "" : "max-w-3xl mx-auto"}`}>
                <div className="hidden h-10 w-10 shrink-0 items-center justify-center sm:flex">
                  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#FF0000" d="M29.41,9.26a3.5,3.5,0,0,0-2.47-2.47C24.76,6.2,16,6.2,16,6.2s-8.76,0-10.94.59A3.5,3.5,0,0,0,2.59,9.26,36.13,36.13,0,0,0,2,16a36.13,36.13,0,0,0,.59,6.74,3.5,3.5,0,0,0,2.47,2.47C7.24,25.8,16,25.8,16,25.8s8.76,0,10.94-.59a3.5,3.5,0,0,0,2.47-2.47A36.13,36.13,0,0,0,30,16,36.13,36.13,0,0,0,29.41,9.26ZM13.2,20.2V11.8L20.47,16Z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground/80 outline-none"
                />
                <div className="flex items-center gap-2 border-l border-border pl-3 ml-1 hidden sm:flex">
                  <div className="flex overflow-hidden rounded-lg border border-border bg-background">
                    <button
                      onClick={() => setTerminology("fr")}
                      className={`px-2 py-1 text-xs font-medium transition ${terminology === "fr" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-secondary"}`}
                    >
                      FR
                    </button>
                    <button
                      onClick={() => setTerminology("us")}
                      className={`px-2 py-1 text-xs font-medium transition ${terminology === "us" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-secondary"}`}
                    >
                      US
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50 sm:px-6 sm:py-3"
                >
                  {loading ? t('input.loading') : t('input.generate')}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </div>
          </div>

          {/* RIGHT PANEL — Pattern card */}
          <div
            className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${generated ? "w-full lg:w-[55%]" : "h-0 w-0 overflow-hidden"}`}
            style={{
              opacity: generated ? 1 : 0,
              transitionDelay: generated ? "100ms" : "0ms",
            }}
          >
            <div
              className="w-full max-w-[800px] rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-6"
              style={{
                transform: generated ? "translateX(0)" : "translateX(40px)",
                transitionDelay: generated ? "150ms" : "0ms",
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-foreground/60" />
                  <span className="text-sm font-semibold">{t('pattern.title')}</span>
                </div>
              </div>

              {/* Video section */}
              {loading ? (
                <VideoSkeleton />
              ) : videoInfo?.title && videoInfo?.channelName ? (
                <div className="mt-4 flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out] sm:flex-row">
                  <div ref={playerContainerRef} className="relative w-full overflow-hidden rounded-lg bg-black sm:w-1/2">
                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                      <div id={iframeId} className="absolute inset-0 h-full w-full" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <button
                          onClick={togglePlay}
                          aria-label={isPlaying ? "Pause video" : "Play video"}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
                        >
                        {isPlaying ? <Pause className="h-3 w-3" fill="white" /> : <Play className="h-3 w-3" fill="white" />}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          aria-label="Change playback speed"
                          className="flex items-center gap-0.5 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] text-white hover:bg-white/30 transition"
                        >
                          <SettingsIcon className="h-2.5 w-2.5" />
                          {playbackRate}x
                        </button>
                        {showSpeedMenu && (
                          <div className="absolute bottom-full left-0 mb-1 rounded-lg border border-border bg-card p-1 shadow-lg">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                              <button
                                key={rate}
                                onClick={() => changeSpeed(rate)}
                                className={`block w-full rounded-md px-3 py-1 text-left text-xs transition hover:bg-secondary ${playbackRate === rate ? "font-semibold text-primary" : ""}`}
                              >
                                {rate}x
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex-1" />
                      <button
                        onClick={toggleFullscreen}
                        aria-label="Toggle fullscreen"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
                      >
                        <Maximize2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full sm:w-1/2">
                    <p className="text-sm font-semibold leading-snug text-left">{videoInfo.title}</p>
                    <div className="mt-4 flex items-center gap-2">
                      {videoInfo.channelAvatar ? (
                        <img src={videoInfo.channelAvatar} alt={`${videoInfo.channelName} channel avatar`} referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {videoInfo.channelName?.[0] ?? ""}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium">{videoInfo.channelName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                  <div className="w-full overflow-hidden rounded-lg bg-black/5 sm:w-1/2">
                    <div className="flex h-40 w-full items-center justify-center bg-secondary text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="w-full sm:w-1/2">
                    <p className="text-sm font-semibold leading-snug text-muted-foreground">
                      {t('pattern.waiting')}
                    </p>
                  </div>
                </div>
              )}

              {notTutorial && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {t('errors.notTutorial')}
                </div>
              )}

              {/* Pattern section */}
              {loadingPattern ? (
                <div className="mt-5 rounded-xl border border-border bg-background/60 p-4 sm:p-6">
                  <div className="flex items-center justify-between text-sm font-semibold mb-3">
                    <span>{t('pattern.generating')}</span>
                    <span className="text-primary">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {progress < 100
                      ? t('progress.analyzing')
                      : t('progress.almostDone')}
                  </p>
                </div>
              ) : pattern ? (
                pattern.steps.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-border bg-background/60 p-4 text-center text-sm text-muted-foreground">
                    {t('pattern.noSteps')}
                  </div>
                ) : (
                <div className="mt-5 flex flex-col gap-4 rounded-xl border border-border bg-background/60 p-4 sm:flex-row sm:gap-5">
                  <div className="hidden w-32 shrink-0 space-y-3 text-xs sm:block">
                    <div>
                      <p className="font-semibold">{t('pattern.materials')}</p>
                      <p className="mt-1 text-muted-foreground">{pattern.materials}</p>
                    </div>
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-semibold">{t('pattern.abbreviations')}</p>
                    <p className="mt-1 text-muted-foreground">{pattern.abbreviations}</p>
                    <div className="mt-3 space-y-3">
                      {pattern.steps.map((step, i) => (
                        <div key={i} className="border-b border-border/60 pb-2">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{step.label}</p>
                            {step.timestamp > 0 && (
                              <button
                                onClick={() => seekTo(step.timestamp)}
                                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition"
                              >
                                <Clock className="h-2.5 w-2.5" />
                                {formatTime(step.timestamp)}
                              </button>
                            )}
                          </div>
                           <div className="mt-1 space-y-1">
                            {step.rounds.map((round, ri) => (
                              <div key={ri} className="group/rnd flex items-center gap-2">
                                <span className="whitespace-pre-line text-foreground/80">
                                  {round.number > 0 ? `${t('pattern.round')} ${round.number}: ` : ""}{round.instruction}
                                  {round.stitches > 0 ? ` (${round.stitches} ${t('pattern.stitches')})` : ""}
                                </span>
                                {round.timestamp > 0 && (
                                  <button
                                    onClick={() => seekTo(round.timestamp)}
                                    className="flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500 opacity-0 transition-opacity hover:bg-neutral-200 hover:text-neutral-700 group-hover/rnd:opacity-100"
                                  >
                                    <Clock className="h-2.5 w-2.5" />
                                    {formatTime(round.timestamp)}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {step.uncertain && (
                            <p className="mt-1 text-[10px] text-amber-500">{t('pattern.uncertain')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                )
              ) : notTutorial ? null : (
                <div className="mt-5 rounded-xl border border-border bg-background/60 p-4 text-center text-sm text-muted-foreground">
                  {t('pattern.placeholder')}
                </div>
              )}

              
            </div>
          </div>
        </div>
      </section>

      <FeaturesSection />
      <WhySection />
      <FaqSection />
      </main>
      <FooterSection />


    </div>
  );
}
