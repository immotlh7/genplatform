"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { 
  Bot, 
  Zap, 
  Brain, 
  Shield, 
  BarChart3, 
  Folder, 
  Terminal, 
  Clock, 
  ArrowRight, 
  ChevronDown,
  Sparkles,
  Cpu,
  Globe,
  CheckCircle,
  Star,
  Play,
  Github,
  ExternalLink,
  Menu,
  X
} from "lucide-react"

// Hide sidebar & navbar on this page
function HideChrome() {
  useEffect(() => {
    const style = document.createElement("style")
    style.id = "landing-hide-chrome"
    style.textContent = `
      .lg\\:fixed.lg\\:inset-y-0 { display: none !important; }
      .lg\\:pl-72 { padding-left: 0 !important; }
      .rtl\\:lg\\:pr-72 { padding-right: 0 !important; }
      header, nav:not(.landing-nav) { display: none !important; }
      main.py-4 { padding: 0 !important; }
    `
    document.head.appendChild(style)
    return () => { style.remove() }
  }, [])
  return null
}

// Animated counter
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let frame: number
    const duration = 2000
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [visible, target])

  return <span ref={ref}>{count}{suffix}</span>
}

// Floating particles background
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-blue-500/10"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
          50% { transform: translateY(-40px) translateX(-10px); opacity: 0.5; }
          75% { transform: translateY(-20px) translateX(15px); opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

const FEATURES = [
  {
    icon: Bot,
    title: "AI Agents",
    description: "Deploy intelligent agents that learn, adapt, and execute tasks autonomously across your entire workflow.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "Automations",
    description: "Build powerful automation pipelines with visual workflows. No code required, infinite possibilities.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Brain,
    title: "Smart Memory",
    description: "Persistent context that evolves. Your AI remembers decisions, preferences, and project history.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Terminal,
    title: "Command Center",
    description: "A unified command interface to control everything — projects, agents, deployments, and more.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Role-based access, audit logs, and encrypted communications. Built for teams that take security seriously.",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Real-time dashboards, AI-generated reports, and actionable insights into your development lifecycle.",
    color: "from-indigo-500 to-violet-500",
  },
]

const CAPABILITIES = [
  "Multi-agent orchestration",
  "Real-time system monitoring",
  "Cron job management",
  "Project & task tracking",
  "Skills marketplace",
  "Self-improving AI",
  "Workflow automation",
  "Team collaboration",
  "Custom dashboards",
  "API integrations",
  "Invoice management",
  "Security auditing",
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <HideChrome />

      {/* ============= NAVBAR ============= */}
      <nav className={`landing-nav fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5" : ""
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="font-bold text-xl tracking-tight">
              Gen<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Platform</span>.ai
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#capabilities" className="text-sm text-gray-400 hover:text-white transition-colors">Capabilities</a>
            <a href="#stats" className="text-sm text-gray-400 hover:text-white transition-colors">Impact</a>
            <div className="h-4 w-px bg-white/10" />
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
            >
              Open Dashboard
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 space-y-3">
            <a href="#features" className="block py-2 text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#capabilities" className="block py-2 text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Capabilities</a>
            <a href="#stats" className="block py-2 text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Impact</a>
            <Link href="/login" className="block py-2 text-gray-400 hover:text-white">Sign In</Link>
            <Link href="/dashboard" className="block py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-center font-medium">
              Open Dashboard
            </Link>
          </div>
        )}
      </nav>

      {/* ============= HERO ============= */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <ParticleField />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-gray-300">AI-Powered Mission Control</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-6">
            Build Smarter.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Ship Faster.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one AI platform that manages your projects, orchestrates agents, 
            automates workflows, and gives you superpowers to build anything.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-lg font-semibold hover:from-blue-500 hover:to-purple-500 transition-all shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              Get Started
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-lg font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              <Play className="h-5 w-5" />
              See How It Works
            </a>
          </div>

          {/* Scroll indicator */}
          <a href="#features" className="inline-flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors">
            <span className="text-xs uppercase tracking-widest">Explore</span>
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ============= FEATURES ============= */}
      <section id="features" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
              <Cpu className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                nothing you don&apos;t
              </span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              A complete AI-powered platform designed for modern teams building the future.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative p-8 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500"
              >
                {/* Icon */}
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>

                {/* Hover glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] rounded-2xl transition-opacity duration-500`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= CAPABILITIES ============= */}
      <section id="capabilities" className="relative py-32">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                <Globe className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">Capabilities</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                One platform,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  limitless power
                </span>
              </h2>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                From project management to AI orchestration, GenPlatform.ai consolidates your entire 
                development workflow into a single, intelligent command center.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/20"
              >
                Explore All Features
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right: Capability grid */}
            <div className="grid grid-cols-2 gap-3">
              {CAPABILITIES.map((cap, i) => (
                <div
                  key={cap}
                  className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                >
                  <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-300">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============= STATS ============= */}
      <section id="stats" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative p-12 md:p-20 bg-gradient-to-br from-blue-950/50 to-purple-950/50 border border-white/5 rounded-3xl overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

            <div className="relative">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  Built for{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                    impact
                  </span>
                </h2>
                <p className="text-gray-400 text-lg">Numbers that speak for themselves.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: 10, suffix: "+", label: "AI Agents" },
                  { value: 50, suffix: "+", label: "Automations" },
                  { value: 99, suffix: "%", label: "Uptime" },
                  { value: 24, suffix: "/7", label: "Monitoring" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============= CTA ============= */}
      <section className="relative py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-amber-300">Ready to transform your workflow?</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Start building with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              AI superpowers
            </span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Join the next generation of developers who ship faster, build smarter, 
            and let AI handle the rest.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-lg font-semibold hover:from-blue-500 hover:to-purple-500 transition-all shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              Launch Mission Control
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://github.com/immotlh7/genplatform"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-lg font-medium hover:bg-white/10 transition-all"
            >
              <Github className="h-5 w-5" />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ============= FOOTER ============= */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-semibold">
                Gen<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Platform</span>.ai
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/dashboard" className="hover:text-gray-300 transition-colors">Dashboard</Link>
              <Link href="/help" className="hover:text-gray-300 transition-colors">Docs</Link>
              <a href="https://github.com/immotlh7/genplatform" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors flex items-center gap-1">
                GitHub <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} GenPlatform.ai — All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
