import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  PlusCircle,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Droplets,
  Cone,
  AlertTriangle,
  TreePine,
  Layers,
  ArrowRight,
  Camera,
  ThumbsUp,
  Flag,
  Info,
  Compass,
  Users,
  Sparkles,
  Smartphone,
  Download,
  Radio,
  Navigation,
  PhoneCall,
  Check,
  Activity,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { AppHeader } from "../components/layout/AppHeader";
import { RouteXLogo } from "../components/common/RouteXLogo";
import { RevealOnScroll } from "../components/common/RevealOnScroll";
import { HazardMap } from "../components/map/HazardMap";
import { CategoryBadge } from "../components/hazards/CategoryBadge";
import { FreshnessBadge } from "../components/hazards/FreshnessBadge";
import { hazardService } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { HAZARD_CATEGORIES } from "../utils/hazardConstants";

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hazards, setHazards] = useState([]);
  const [selectedPreviewHazard, setSelectedPreviewHazard] = useState(null);
  const [loadingHazards, setLoadingHazards] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      alert("To install RouteX, tap the Share or Browser menu and select 'Add to Home Screen'.");
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  useEffect(() => {
    async function loadPreviewData() {
      try {
        setLoadingHazards(true);
        const data = await hazardService.getHazards();
        const items = data.results ? data.results : data;
        setHazards(items);
        if (items.length > 0) {
          setSelectedPreviewHazard(items[0]);
        }
      } catch (err) {
        setHazards([]);
      } finally {
        setLoadingHazards(false);
      }
    }
    loadPreviewData();
  }, []);

  const handleReportCta = () => {
    if (!user) {
      navigate("/login?next=/report");
    } else {
      navigate("/report");
    }
  };

  const hasDemoData = hazards.some((h) => h.is_demo);

  const faqItems = [
    {
      q: "What is RouteX?",
      a: "RouteX is a community-powered road-hazard reporting platform designed for road users everywhere. It enables commuters, drivers, cyclists, and pedestrians to discover real-time hazards reported by fellow community members, verify active updates, and share what they see to make journeys safer and more predictable.",
    },
    {
      q: "Can anyone browse the map?",
      a: "Yes. Public browsing of the interactive hazard map, category filters, and report details is open to everyone without needing an account or signing in. You can explore road conditions, inspect specific corridors, and verify timestamps freely.",
    },
    {
      q: "How do I report a road hazard?",
      a: "To submit a hazard report, create a free RouteX account or sign in, select 'Report a hazard', choose the appropriate category (flooding, pothole, blocked road, fallen tree, or other), place the pin on the map, provide a short description, and optionally attach a photo.",
    },
    {
      q: "Does a community-confirmed report mean the road was officially inspected?",
      a: "No. Community confirmations indicate that eligible community members have recently observed and confirmed that the hazard remains present. They represent timely peer activity, not an official inspection by government transportation authorities.",
    },
    {
      q: "What happens when a report becomes old?",
      a: "RouteX clearly displays report ages and timestamps. Reports that have not received recent confirmations or updates are marked as potentially out of date rather than deleted, so users can understand the freshness of the information and exercise appropriate judgement.",
    },
    {
      q: "Do I need to allow access to my location?",
      a: "No. While browser geolocation can help place your hazard pin quickly when requested, you can always manually tap the map or drag the location pin to any roadway or junction. RouteX never tracks your location in the background.",
    },
    {
      q: "Can I report a hazard without a photo?",
      a: "Yes. Photographic evidence is optional. We encourage photos when safe and practical, but you can submit reports with just a selected map location, category, and descriptive text. Never take photographs while driving.",
    },
  ];

  const categoryIcons = {
    flooding: Droplets,
    pothole: Cone,
    blocked_road: AlertTriangle,
    fallen_tree: TreePine,
    other: Layers,
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] text-[#142B3B] dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-[#087F8C] selection:text-white">
      {/* Header */}
      <AppHeader />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================= */}
        <section className="relative pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
          {/* Subtle Ambient Background Gradient Orbs */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/5 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Headline and CTAs */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <RevealOnScroll direction="up" delay={50} duration={600}>
                  {/* Eyebrow Label */}
                  {/* <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#087F8C]/10 dark:bg-[#087F8C]/25 text-[#087F8C] dark:text-teal-300 border border-[#087F8C]/20 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#087F8C] dark:bg-teal-400 animate-pulse" />
                    COMMUNITY-POWERED ROAD AWARENESS
                  </div> */}
                </RevealOnScroll>

                <RevealOnScroll direction="up" delay={150} duration={700}>
                  {/* Main Headline */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#142B3B] dark:text-white leading-[1.12]">
                    Know The Road Ahead.
                  </h1>
                </RevealOnScroll>

                <RevealOnScroll direction="up" delay={250} duration={700}>
                  {/* Supporting Copy */}
                  <p className="text-base sm:text-lg text-[#667784] dark:text-slate-300 leading-relaxed max-w-xl">
                    Discover community-reported road hazards on the roads and corridors you travel.
                    Share what you see, check recent updates, and help other road users make better-informed decisions.
                  </p>
                </RevealOnScroll>

                <RevealOnScroll direction="up" delay={350} duration={700}>
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                      to="/map"
                      className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-lg shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 active:scale-[0.99]"
                    >
                      <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Explore the map</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleReportCta}
                      className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#142B3B] dark:text-slate-100 bg-white dark:bg-[#142533] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 active:scale-[0.99]"
                    >
                      <PlusCircle className="w-4 h-4 text-[#087F8C] group-hover:rotate-90 transition-transform duration-200" />
                      <span>Report a hazard</span>
                    </button>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll direction="up" delay={450} duration={600}>
                  {/* Honest Reassurance */}
                  <p className="text-xs text-[#667784] dark:text-slate-400 pt-1 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>
                      Reports are community-submitted. Always check timestamps and current conditions.
                    </span>
                  </p>
                </RevealOnScroll>
              </div>

              {/* Right Column: Live Map Product Preview */}
              <div className="lg:col-span-6 relative">
                <RevealOnScroll direction="scale" delay={200} duration={800}>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#142533] group hover:border-[#087F8C]/40 transition-colors">
                    {/* Preview Top Bar */}
                    <div className="bg-[#142B3B] dark:bg-[#0B161E] text-white px-4 py-3 flex items-center justify-between text-xs border-b border-slate-700/80">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="font-semibold text-slate-200">Live Community Map Preview</span>
                      </div>
                      {hasDemoData && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Demo data
                        </span>
                      )}
                    </div>

                    {/* Leaflet Map Preview Container */}
                    <div className="h-[360px] sm:h-[440px] w-full relative">
                      <HazardMap
                        hazards={hazards}
                        selectedHazard={selectedPreviewHazard}
                        onSelectHazard={(h) => setSelectedPreviewHazard(h)}
                      />

                      {/* Empty State Overlay if backend has no reports */}
                      {!loadingHazards && hazards.length === 0 && (
                        <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-1000">
                          <MapPin className="w-10 h-10 text-slate-400 mb-2" />
                          <h4 className="text-sm font-bold text-[#142B3B] dark:text-white">
                            No active hazards currently listed
                          </h4>
                          <p className="text-xs text-[#667784] dark:text-slate-400 max-w-xs mt-1">
                            Roads in your area are awaiting community updates. Be the first to report what you see.
                          </p>
                          <Link
                            to="/report"
                            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-md shadow-xs transition-all"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Submit a report</span>
                          </Link>
                        </div>
                      )}

                      {/* Floating Hazard Card Preview */}
                      {selectedPreviewHazard && (
                        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs bg-white dark:bg-[#142533] rounded-xl p-3.5 shadow-xl border border-slate-200 dark:border-slate-700 z-1000 animate-in fade-in slide-in-from-bottom-2 duration-200">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <CategoryBadge category={selectedPreviewHazard.category} />
                            <FreshnessBadge freshness={selectedPreviewHazard.freshness} />
                          </div>
                          <h4 className="text-xs font-bold text-[#142B3B] dark:text-white truncate">
                            {selectedPreviewHazard.location_label || "Reported Road Hazard"}
                          </h4>
                          <p className="text-[11px] text-[#667784] dark:text-slate-300 line-clamp-2 mt-1 leading-snug">
                            {selectedPreviewHazard.description}
                          </p>
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 font-medium">
                              <ThumbsUp className="w-3 h-3 text-[#087F8C]" />
                              <span>{selectedPreviewHazard.confirmations_count} confirmed</span>
                            </span>
                            <Link
                              to="/map"
                              className="font-semibold text-[#087F8C] dark:text-teal-400 hover:underline flex items-center gap-0.5"
                            >
                              <span>Open on map</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. TRUST STRIP */}
        {/* ========================================================= */}
        <section className="bg-white dark:bg-[#101F2B] border-b border-slate-200/80 dark:border-slate-800/80 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <RevealOnScroll direction="up" delay={50}>
                <div className="flex items-center gap-3.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900/60 flex items-center justify-center text-[#087F8C] dark:text-teal-400 shrink-0 shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#142B3B] dark:text-white">
                      Community-powered reports
                    </h3>
                    <p className="text-[11px] text-[#667784] dark:text-slate-400 mt-0.5">
                      Contributed directly by commuters, drivers, and local road users.
                    </p>
                  </div>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="up" delay={150}>
                <div className="flex items-center gap-3.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900/60 flex items-center justify-center text-[#087F8C] dark:text-teal-400 shrink-0 shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#142B3B] dark:text-white">
                      Clear timestamps and updates
                    </h3>
                    <p className="text-[11px] text-[#667784] dark:text-slate-400 mt-0.5">
                      See exactly when reports were submitted or confirmed recently.
                    </p>
                  </div>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="up" delay={250}>
                <div className="flex items-center gap-3.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900/60 flex items-center justify-center text-[#087F8C] dark:text-teal-400 shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#142B3B] dark:text-white">
                      Transparent report status
                    </h3>
                    <p className="text-[11px] text-[#667784] dark:text-slate-400 mt-0.5">
                      Know whether a report is freshly reported, confirmed, or under review.
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. HOW IT WORKS */}
        {/* ========================================================= */}
        <section
          id="how-it-works"
          className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left"
        >
          <RevealOnScroll direction="up" delay={50}>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#087F8C] dark:text-teal-400 mb-2">
                Three Simple Steps
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#142B3B] dark:text-white">
                How RouteX Works
              </h3>
              <p className="text-sm text-[#667784] dark:text-slate-400 mt-2">
                A transparent civic platform built to keep road users and commuters informed.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <RevealOnScroll direction="up" delay={100}>
              <div className="bg-white dark:bg-[#142533] rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-black text-[#087F8C]/20 dark:text-teal-400/25 font-mono group-hover:text-[#087F8C]/40 transition-colors">
                    01
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#087F8C]/10 text-[#087F8C] dark:text-teal-400 flex items-center justify-center">
                    <Compass className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="text-base font-bold text-[#142B3B] dark:text-white">
                  Explore the map
                </h4>
                <p className="text-xs text-[#667784] dark:text-slate-300 mt-2.5 leading-relaxed">
                  See reported hazards in the area you care about. Filter by type, status, and recent activity.
                </p>
              </div>
            </RevealOnScroll>

            {/* Step 2 */}
            <RevealOnScroll direction="up" delay={200}>
              <div className="bg-white dark:bg-[#142533] rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-black text-[#087F8C]/20 dark:text-teal-400/25 font-mono group-hover:text-[#087F8C]/40 transition-colors">
                    02
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#087F8C]/10 text-[#087F8C] dark:text-teal-400 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="text-base font-bold text-[#142B3B] dark:text-white">
                  Share what you see
                </h4>
                <p className="text-xs text-[#667784] dark:text-slate-300 mt-2.5 leading-relaxed">
                  Report a pothole, flooded road, blocked route, fallen tree, or another hazard with a location and optional photograph.
                </p>
              </div>
            </RevealOnScroll>

            {/* Step 3 */}
            <RevealOnScroll direction="up" delay={300}>
              <div className="bg-white dark:bg-[#142533] rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-black text-[#087F8C]/20 dark:text-teal-400/25 font-mono group-hover:text-[#087F8C]/40 transition-colors">
                    03
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#087F8C]/10 text-[#087F8C] dark:text-teal-400 flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="text-base font-bold text-[#142B3B] dark:text-white">
                  Help keep reports useful
                </h4>
                <p className="text-xs text-[#667784] dark:text-slate-300 mt-2.5 leading-relaxed">
                  Confirm a hazard when it is still present, flag inaccurate information, and check the latest report activity.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. FEATURE SHOWCASE */}
        {/* ========================================================= */}
        <section
          id="features"
          className="py-16 lg:py-24 bg-white dark:bg-[#101F2B] border-y border-slate-200/80 dark:border-slate-800/80 text-left"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll direction="up" delay={50}>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#087F8C] dark:text-teal-400 mb-2">
                  Platform Capabilities
                </h2>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#142B3B] dark:text-white">
                  Engineered for Road Awareness
                </h3>
                <p className="text-sm text-[#667784] dark:text-slate-400 mt-2">
                  Straightforward, practical tools designed specifically for real road conditions and active travel corridors.
                </p>
              </div>
            </RevealOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <RevealOnScroll direction="up" delay={100}>
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7F9FA] dark:bg-[#142533] flex flex-col justify-between h-full hover:border-[#087F8C]/50 transition-all hover:shadow-md">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#087F8C]/10 text-[#087F8C] dark:text-teal-400 flex items-center justify-center mb-4">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#142B3B] dark:text-white">
                      Interactive hazard map
                    </h4>
                    <p className="text-xs text-[#667784] dark:text-slate-300 mt-2 leading-relaxed">
                      Browse markers and open report details. Inspect coordinates, street landmarks, and descriptions across your city and travel corridors.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                    <Link
                      to="/map"
                      className="text-xs font-semibold text-[#087F8C] dark:text-teal-400 hover:underline inline-flex items-center gap-1 group"
                    >
                      <span>Browse map</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </RevealOnScroll>

              {/* Feature 2 */}
              <RevealOnScroll direction="up" delay={200}>
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7F9FA] dark:bg-[#142533] flex flex-col justify-between h-full hover:border-[#087F8C]/50 transition-all hover:shadow-md">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#087F8C]/10 text-[#087F8C] dark:text-teal-400 flex items-center justify-center mb-4">
                      <Camera className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#142B3B] dark:text-white">
                      Simple hazard reporting
                    </h4>
                    <p className="text-xs text-[#667784] dark:text-slate-300 mt-2 leading-relaxed">
                      Select a category, choose a location with the map picker, describe the issue, and optionally attach a photo.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={handleReportCta}
                      className="text-xs font-semibold text-[#087F8C] dark:text-teal-400 hover:underline inline-flex items-center gap-1 group"
                    >
                      <span>Start report</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </RevealOnScroll>

              {/* Feature 3 */}
              <RevealOnScroll direction="up" delay={300}>
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7F9FA] dark:bg-[#142533] flex flex-col justify-between h-full hover:border-[#087F8C]/50 transition-all hover:shadow-md">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#087F8C]/10 text-[#087F8C] dark:text-teal-400 flex items-center justify-center mb-4">
                      <ThumbsUp className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#142B3B] dark:text-white">
                      Community updates
                    </h4>
                    <p className="text-xs text-[#667784] dark:text-slate-300 mt-2 leading-relaxed">
                      Let eligible users confirm ongoing hazards and flag reports that need attention. Multiple community confirmations elevate status.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Active peer confirmation
                    </span>
                  </div>
                </div>
              </RevealOnScroll>

              {/* Feature 4 */}
              <RevealOnScroll direction="up" delay={400}>
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7F9FA] dark:bg-[#142533] flex flex-col justify-between h-full hover:border-[#087F8C]/50 transition-all hover:shadow-md">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#087F8C]/10 text-[#087F8C] dark:text-teal-400 flex items-center justify-center mb-4">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#142B3B] dark:text-white">
                      Report transparency
                    </h4>
                    <p className="text-xs text-[#667784] dark:text-slate-300 mt-2 leading-relaxed">
                      Display when reports were created or last confirmed, along with their current status. Stale reports are clearly indicated.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Honest freshness tracking
                    </span>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4.5. LIVE COMMUNITY ROAD PULSE */}
        {/* ========================================================= */}
        <section className="py-16 bg-slate-50 dark:bg-[#0E1A24] border-y border-slate-200 dark:border-slate-800 text-left transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll direction="up" delay={50}>
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-[#087F8C] dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    <span>Live Incident Stream</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#142B3B] dark:text-white mt-2">
                    Recent Community Observations
                  </h3>
                  <p className="text-sm text-[#667784] dark:text-slate-400 mt-1 max-w-xl">
                    Ground-level reports contributed and confirmed by commuters along active transit corridors.
                  </p>
                </div>

                <Link
                  to="/map"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#087F8C] hover:text-[#06636d] dark:text-teal-400 dark:hover:text-teal-300"
                >
                  <span>View all on live map</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </RevealOnScroll>

            {loadingHazards ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Fetching recent community reports...
              </div>
            ) : hazards.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#142533] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                No active road hazards currently reported. You can be the first to contribute!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {hazards.slice(0, 3).map((hz, idx) => (
                  <RevealOnScroll key={hz.id} direction="up" delay={idx * 150}>
                    <div className="bg-white dark:bg-[#142533] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <CategoryBadge category={hz.category} />
                          <FreshnessBadge info={hz.freshness_info} />
                        </div>
                        <h4 className="font-bold text-sm text-[#142B3B] dark:text-white line-clamp-1">
                          {hz.location_label || "Active Road Observation"}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {hz.description}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-medium text-teal-600 dark:text-teal-400">
                          {hz.confirmations_count} confirmation{hz.confirmations_count !== 1 ? "s" : ""}
                        </span>
                        <Link
                          to={`/map?lat=${hz.latitude}&lng=${hz.longitude}`}
                          className="font-semibold text-[#087F8C] hover:underline flex items-center gap-1"
                        >
                          Inspect <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </RevealOnScroll>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. HAZARD CATEGORY PREVIEW */}
        {/* ========================================================= */}
        <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <RevealOnScroll direction="up" delay={50}>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#087F8C] dark:text-teal-400 mb-2">
                Hazard Categories
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#142B3B] dark:text-white">
                Five Supported Categories
              </h3>
              <p className="text-sm text-[#667784] dark:text-slate-400 mt-2">
                Click any category to view current reports filtered on the map.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {HAZARD_CATEGORIES.map((cat, idx) => {
              const Icon = categoryIcons[cat.id] || AlertTriangle;
              return (
                <RevealOnScroll key={cat.id} direction="up" delay={idx * 100}>
                  <button
                    type="button"
                    onClick={() => navigate(`/map?category=${cat.id}`)}
                    className="w-full h-full p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#142533] hover:border-[#087F8C] dark:hover:border-teal-500 hover:shadow-lg transition-all text-left group flex flex-col justify-between hover:-translate-y-1.5"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-[#087F8C]/10 text-[#087F8C] dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-[#142B3B] dark:text-white group-hover:text-[#087F8C] dark:group-hover:text-teal-300 transition-colors">
                        {cat.label}
                      </h4>
                      <p className="text-xs text-[#667784] dark:text-slate-400 mt-1 leading-snug">
                        {cat.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-2 text-[11px] font-semibold text-[#087F8C] dark:text-teal-400 flex items-center gap-1">
                      <span>View on map</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </RevealOnScroll>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5.5. EMERGENCY ADVISORY & CITIZEN SAFETY PLEDGE */}
        {/* ========================================================= */}
        <section className="py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* When to use RouteX vs Call Emergency */}
            <RevealOnScroll direction="left" delay={100}>
              <div className="p-7 rounded-2xl bg-white dark:bg-[#142533] border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col justify-between space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Emergency Advisory</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#142B3B] dark:text-white mt-3">
                    When to Use RouteX vs Emergency Services
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    RouteX is an informational civic awareness tool. Knowing when to dial emergency dispatch ensures critical life safety is prioritized.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 space-y-2">
                    <span className="font-bold text-[#087F8C] dark:text-teal-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-teal-600" /> Report on RouteX
                    </span>
                    <ul className="text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                      <li>• Severe road potholes & surface cracks</li>
                      <li>• Standing rainwater & street flooding</li>
                      <li>• Broken branches or debris in transit lanes</li>
                      <li>• Stalled vehicles causing traffic slowdown</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
                    <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" /> Dial 112 / 911
                    </span>
                    <ul className="text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                      <li>• Accidents with injuries or trapped victims</li>
                      <li>• Active vehicle or structural fires</li>
                      <li>• Fallen electrical high-voltage lines</li>
                      <li>• Armed robbery or immediate danger</li>
                    </ul>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* Road Safety Observer Pledge */}
            <RevealOnScroll direction="right" delay={200}>
              <div className="p-7 rounded-2xl bg-[#142B3B] text-white border border-slate-700 shadow-sm h-full flex flex-col justify-between space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-900/60 text-teal-300 border border-teal-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Citizen Observer Pledge</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-3">
                    Four Principles of Civic Responsibility
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    By contributing to RouteX, community members agree to protect the safety of all road users.
                  </p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-800/60 text-teal-300 flex items-center justify-center shrink-0 font-bold text-[11px]">1</div>
                    <p className="text-slate-200 leading-relaxed"><strong>Never report while driving:</strong> Only photograph or place pins when parked safely or as a passenger or pedestrian.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-800/60 text-teal-300 flex items-center justify-center shrink-0 font-bold text-[11px]">2</div>
                    <p className="text-slate-200 leading-relaxed"><strong>Precise pin placement:</strong> Zoom into the road intersection to drop the marker directly on the affected roadway.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-800/60 text-teal-300 flex items-center justify-center shrink-0 font-bold text-[11px]">3</div>
                    <p className="text-slate-200 leading-relaxed"><strong>Objective descriptions:</strong> State what is present clearly (depth, lane affected) rather than speculative commentary.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-800/60 text-teal-300 flex items-center justify-center shrink-0 font-bold text-[11px]">4</div>
                    <p className="text-slate-200 leading-relaxed"><strong>Confirm or flag truthfully:</strong> Verify active hazards to elevate status; flag resolved or inaccurate submissions.</p>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. SAFETY AND TRUST SECTION */}
        {/* ========================================================= */}
        <section
          id="safety-and-trust"
          className="py-16 lg:py-24 bg-slate-100/70 dark:bg-[#0E1A24] border-y border-slate-200 dark:border-slate-800 text-left"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll direction="up" delay={50}>
              <div className="max-w-2xl mb-12">
                <span className="text-xs font-bold uppercase tracking-wider text-[#087F8C] dark:text-teal-400">
                  Integrity & Governance
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B3B] dark:text-white mt-1">
                  Useful information. Clear about what we know.
                </h2>
                <p className="text-sm text-[#667784] dark:text-slate-300 mt-2">
                  RouteX operates with complete transparency regarding data origins, freshness, and the limits of crowd reporting.
                </p>
              </div>
            </RevealOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RevealOnScroll direction="up" delay={100}>
                <div className="p-6 rounded-2xl bg-white dark:bg-[#142533] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all h-full">
                  <h4 className="text-sm font-bold text-[#142B3B] dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#087F8C]" />
                    <span>Community-submitted reports</span>
                  </h4>
                  <p className="text-xs text-[#667784] dark:text-slate-300 mt-2 leading-relaxed">
                    Every report is submitted by fellow road users. While submissions are reviewed and moderated, they reflect ground-level observations rather than official government road announcements.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="up" delay={200}>
                <div className="p-6 rounded-2xl bg-white dark:bg-[#142533] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all h-full">
                  <h4 className="text-sm font-bold text-[#142B3B] dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#F2B544]" />
                    <span>Report age and freshness</span>
                  </h4>
                  <p className="text-xs text-[#667784] dark:text-slate-300 mt-2 leading-relaxed">
                    The age of a report matters greatly. Road conditions change rapidly after rainstorms or construction. Reports without recent activity are flagged as potentially out of date.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="up" delay={300}>
                <div className="p-6 rounded-2xl bg-white dark:bg-[#142533] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all h-full">
                  <h4 className="text-sm font-bold text-[#142B3B] dark:text-white flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-[#27865B]" />
                    <span>Community confirmations</span>
                  </h4>
                  <p className="text-xs text-[#667784] dark:text-slate-300 mt-2 leading-relaxed">
                    Confirmations signal that other registered commuters verified the hazard's presence. They indicate recent activity, not an official inspection or engineering certification.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="up" delay={400}>
                <div className="p-6 rounded-2xl bg-white dark:bg-[#142533] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all h-full">
                  <h4 className="text-sm font-bold text-[#142B3B] dark:text-white flex items-center gap-2">
                    <Flag className="w-4 h-4 text-[#D64545]" />
                    <span>Moderator review queue</span>
                  </h4>
                  <p className="text-xs text-[#667784] dark:text-slate-300 mt-2 leading-relaxed">
                    When a report is flagged for inaccuracies, cleared status, or abuse, it enters a dedicated moderation queue for review and resolution.
                  </p>
                </div>
              </RevealOnScroll>
            </div>

            {/* Frank Disclaimer Box */}
            <RevealOnScroll direction="up" delay={500}>
              <div className="mt-8 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3.5 shadow-xs">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-xs">Honest Safety Notice</p>
                  <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    RouteX never claims to guarantee safe journeys or provide officially certified road closures. Road conditions change constantly. Always follow official signage, emergency instructions, and exercise sound personal driving judgement.
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. ABOUT ROUTEX AND HOW TO USE */}
        {/* ========================================================= */}
        <section id="about" className="py-16 lg:py-24 bg-white dark:bg-[#101F2B] text-left border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll direction="up" delay={50}>
              <div className="max-w-2xl mb-10">
                <span className="text-xs font-bold uppercase tracking-wider text-[#087F8C] dark:text-teal-400">About RouteX</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B3B] dark:text-white mt-1">A clearer view of the roads we share.</h2>
                <p className="text-sm text-[#667784] dark:text-slate-300 mt-2 leading-relaxed">RouteX is a community-powered road awareness platform for commuters, drivers, cyclists, and pedestrians who want better information before and during a journey.</p>
              </div>
            </RevealOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                [Users, "Community knowledge", "Share timely, local observations with the people who use the same roads."],
                [ShieldCheck, "Clear context", "See timestamps, freshness, and confirmations so you can judge a report for yourself."],
                [MapPin, "Practical awareness", "Turn scattered observations into a useful view of the roads ahead."],
              ].map(([Icon, title, text], index) => (
                <RevealOnScroll key={title} direction="up" delay={100 + index * 100}>
                  <div className="h-full p-5 rounded-xl bg-[#F7F9FA] dark:bg-[#142533] border border-slate-200 dark:border-slate-800">
                    <Icon className="w-5 h-5 text-[#087F8C] dark:text-teal-300 mb-3" />
                    <h3 className="text-sm font-bold text-[#142B3B] dark:text-white">{title}</h3>
                    <p className="text-xs text-[#667784] dark:text-slate-300 mt-2 leading-relaxed">{text}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section id="how-to-use" className="py-16 lg:py-24 bg-[#F7F9FA] dark:bg-[#0B161E] text-left">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll direction="up" delay={50}>
              <div className="max-w-2xl mb-10">
                <span className="text-xs font-bold uppercase tracking-wider text-[#087F8C] dark:text-teal-400">How to use RouteX</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B3B] dark:text-white mt-1">From road observation to useful update.</h2>
                <p className="text-sm text-[#667784] dark:text-slate-300 mt-2 leading-relaxed">Check the map, understand how fresh a report is, and contribute a careful update when it is safe to do so.</p>
              </div>
            </RevealOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["1", "Explore", "Browse the map and filter reports by category or status."],
                ["2", "Check details", "Review the location, description, photo, timestamp, and confirmation activity."],
                ["3", "Share safely", "Sign in, place a pin, choose a category, and describe what you see."],
                ["4", "Keep it current", "Confirm a listed hazard when you can safely verify that it is still present."],
              ].map(([number, title, text], index) => (
                <RevealOnScroll key={title} direction="up" delay={100 + index * 80}>
                  <div className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-[#142533] border border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-[#087F8C] text-white flex items-center justify-center text-xs font-bold shrink-0">{number}</div>
                    <div>
                      <h3 className="text-sm font-bold text-[#142B3B] dark:text-white">{title}</h3>
                      <p className="text-xs text-[#667784] dark:text-slate-300 mt-1.5 leading-relaxed">{text}</p>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
            <div className="mt-6 flex items-start gap-3 text-xs text-[#667784] dark:text-slate-400">
              <Info className="w-4 h-4 shrink-0 text-amber-500" />
              <p>Never browse or report while driving. Pull over safely first, and only take photos when it is safe to do so.</p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 8. FAQ ACCORDION */}
        {/* ========================================================= */}
        <section id="faq" className="py-16 lg:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <RevealOnScroll direction="up" delay={50}>
            <div className="text-center mb-12">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#087F8C] dark:text-teal-400 mb-2">
                Frequently Asked Questions
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#142B3B] dark:text-white">
                Questions & Answers
              </h3>
            </div>
          </RevealOnScroll>

          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <RevealOnScroll key={idx} direction="up" delay={idx * 60}>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#142533] overflow-hidden transition-colors shadow-xs">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-800/50"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-bold text-[#142B3B] dark:text-white">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-180 text-[#087F8C]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-[#667784] dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in duration-150">
                        {item.a}
                      </div>
                    )}
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7.5. NATIVE PROGRESSIVE WEB APP (PWA) SHOWCASE */}
        {/* ========================================================= */}
        <section className="py-16 bg-gradient-to-b from-[#142B3B] to-[#0B161E] text-white text-left">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll direction="scale" delay={100}>
              <div className="p-8 md:p-12 rounded-3xl bg-[#142533]/80 border border-slate-700/80 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-8 backdrop-blur-md">
                <div className="max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/30">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Native-Like Web App</span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                    Install RouteX on Any Device.
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Experience RouteX as a fast, responsive standalone app on iOS, Android, macOS, and Windows. No app store downloads required—add to your home screen for offline shell launch, instant reporting, and low data bandwidth usage.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-400" />
                      <span>Zero App Store Bloat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-400" />
                      <span>Offline Shell Cache</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-400" />
                      <span>Low Data Bandwidth</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-[#087F8C] hover:bg-[#0aa3b3] shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>{installPrompt ? "Install RouteX App" : "Add to Home Screen"}</span>
                  </button>

                  <Link
                    to="/map"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 transition-all border border-slate-700 text-center"
                  >
                    <Navigation className="w-4 h-4 text-teal-400" />
                    <span>Launch in Browser</span>
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 8. CALLS TO ACTION (Lower CTA) */}
        {/* ========================================================= */}
        <section className="py-20 bg-[#142B3B] text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/20 via-transparent to-amber-900/10 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
            <RevealOnScroll direction="scale" delay={100} duration={700}>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Help make road information more useful for everyone.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed mt-4">
                Explore existing reports or contribute an update from your community.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Link
                  to="/map"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-sm font-semibold text-[#142B3B] bg-white hover:bg-slate-100 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
                >
                  <MapPin className="w-4 h-4 text-[#087F8C]" />
                  <span>Explore the map</span>
                </Link>

                <button
                  type="button"
                  onClick={handleReportCta}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-sm font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Report a hazard</span>
                </button>
              </div>
            </RevealOnScroll>
          </div>
        </section>
      </main>

      {/* ========================================================= */}
      {/* 9. FOOTER */}
      {/* ========================================================= */}
      <footer className="bg-[#0B161E] text-slate-400 border-t border-slate-800 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-left">
            {/* Col 1: Brand & Tagline */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <RouteXLogo size="md" />
                <span className="font-extrabold text-base tracking-tight text-white">RouteX</span>
              </div>
              <p className="text-slate-300 text-xs font-medium">Know the Road Ahead.</p>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                Community-powered road hazard reporting platform developed by Team NextGen.
              </p>
            </div>

            {/* Col 2: Navigation */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-1.5">
                <li>
                  <Link to="/map" className="hover:text-white transition-colors">
                    Hazard map
                  </Link>
                </li>
                <li>
                  <Link to="/report" className="hover:text-white transition-colors">
                    Report a hazard
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    Create account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Platform Resources */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Resources</h4>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href="/api/docs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>Swagger API Docs</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>Map data © OpenStreetMap contributors</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </li>
                <li className="text-[11px] text-slate-500">
                  Privacy policy & terms: Scheduled for release with public deployment (see BACKLOG.md).
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} RouteX. Team NextGen.</p>
            <p>
              OpenStreetMap tile policy compliant. No turn-by-turn navigation or tracking implied.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
