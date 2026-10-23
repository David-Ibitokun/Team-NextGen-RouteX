import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  MapPin,
  Lock,
  Trash2,
  Cpu,
  FileText,
  AlertTriangle,
  Mail,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Server,
  Globe,
} from "lucide-react";
import { AppHeader } from "../components/layout/AppHeader";
import { RouteXLogo } from "../components/common/RouteXLogo";

export function PrivacyPolicyPage({ defaultTab = "privacy" }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (location.hash === "#terms") {
      setActiveTab("terms");
    } else if (location.hash === "#privacy") {
      setActiveTab("privacy");
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] text-[#142B3B] dark:text-slate-100 flex flex-col font-sans transition-colors">
      <AppHeader />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#142B3B] to-[#1B364A] text-white pt-12 pb-14 px-4 sm:px-6 lg:px-8 border-b border-slate-700">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Civic Trust & Transparency</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            How We Use Data & Privacy
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            At RouteX, we believe community road safety tools should protect personal privacy, not track commuters.
            Learn what data we collect, how it keeps roads safe, and how you maintain full control.
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center pt-4">
            <div className="inline-flex rounded-xl bg-slate-800/80 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab("privacy")}
                className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "privacy"
                    ? "bg-[#087F8C] text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                Data Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("terms")}
                className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "terms"
                    ? "bg-[#087F8C] text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                Terms of Service & Guidelines
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {activeTab === "privacy" ? (
          <>
            {/* The RouteX Privacy Promise */}
            <div className="bg-white dark:bg-[#142533] rounded-2xl border border-teal-200 dark:border-teal-900/60 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/70 flex items-center justify-center text-[#087F8C] dark:text-teal-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#142B3B] dark:text-white">
                    The RouteX Privacy Promise
                  </h2>
                  <p className="text-xs text-[#667784] dark:text-slate-400">
                    Our core principles for handling your road observations and account data.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#142B3B] dark:text-white">
                    <EyeOff className="w-4 h-4 text-emerald-500" />
                    <span>No Background Tracking</span>
                  </div>
                  <p className="text-xs text-[#667784] dark:text-slate-300 leading-relaxed">
                    We never track your movements in the background. GPS location is only queried when you explicitly tap <strong>"Near Me"</strong> or choose a coordinate pin on the map.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#142B3B] dark:text-white">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>Zero Data Selling</span>
                  </div>
                  <p className="text-xs text-[#667784] dark:text-slate-300 leading-relaxed">
                    We do not sell, broker, or license personal data, movement habits, or accounts to data brokers, ad networks, or advertisers.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#142B3B] dark:text-white">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>EXIF & GPS Camera Scrubbing</span>
                  </div>
                  <p className="text-xs text-[#667784] dark:text-slate-300 leading-relaxed">
                    When you upload a hazard photograph, all embedded camera model, timestamp, and device GPS metadata are automatically stripped during client-side WebP optimization before upload.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#142B3B] dark:text-white">
                    <Trash2 className="w-4 h-4 text-emerald-500" />
                    <span>Self-Service Erasure</span>
                  </div>
                  <p className="text-xs text-[#667784] dark:text-slate-300 leading-relaxed">
                    You can permanently delete your user account and profile at any time in your Citizen Dashboard Settings with immediate effect.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: What We Collect */}
            <section className="bg-white dark:bg-[#142533] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#142B3B] dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#087F8C]" />
                <span>1. What Information We Collect</span>
              </h3>
              <p className="text-xs text-[#667784] dark:text-slate-300 leading-relaxed">
                RouteX collects only the minimal data strictly required to deliver accurate, community-powered road hazard awareness:
              </p>
              <ul className="space-y-3 text-xs text-[#667784] dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#142B3B] dark:text-slate-100">Hazard Report Observations:</strong> Category (e.g. pothole, flooding, fallen tree), descriptive details, road landmark name, and map coordinates (latitude and longitude) that you submit.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#142B3B] dark:text-slate-100">Optional Photographs:</strong> Image evidence uploaded to illustrate road obstructions. Photos are compressed into modern WebP format and stripped of device EXIF metadata.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#142B3B] dark:text-slate-100">User Account Credentials:</strong> If you register, we store your username, email address, optional display name, and securely salted/hashed password. Passwords are never stored in plaintext.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#142B3B] dark:text-slate-100">Foreground Geolocation Coordinates:</strong> With your permission, foreground coordinates are captured only when you use the <em>"Near Me (10 km)"</em> filter or tap the location picker.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#142B3B] dark:text-slate-100">Push Notification Tokens:</strong> In our mobile app, optional Expo device push tokens are registered so you can receive notifications when your reports are confirmed or verified.
                  </div>
                </li>
              </ul>
            </section>

            {/* Section 2: How We Use Data */}
            <section className="bg-white dark:bg-[#142533] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#142B3B] dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#087F8C]" />
                <span>2. How We Use Data</span>
              </h3>
              <p className="text-xs text-[#667784] dark:text-slate-300 leading-relaxed">
                Collected information is utilized strictly to provide road awareness and safeguard commuter journeys:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-[#142B3B] dark:text-white mb-1">Public Map Display</h4>
                  <p className="text-[#667784] dark:text-slate-300">
                    Placing verified hazard pins on interactive Leaflet maps so motorists, cyclists, and pedestrians know what road conditions lie ahead.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-[#142B3B] dark:text-white mb-1">Proximity Alert Filtering</h4>
                  <p className="text-[#667784] dark:text-slate-300">
                    Calculating distance via the Haversine formula to surface road hazards within a 10 km radius of your current location.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-[#142B3B] dark:text-white mb-1">Community Freshness</h4>
                  <p className="text-[#667784] dark:text-slate-300">
                    Tracking confirmations and timestamps so that obsolete or repaired hazards age gracefully and reflect actual road conditions.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-[#142B3B] dark:text-white mb-1">Notification Dispatch</h4>
                  <p className="text-[#667784] dark:text-slate-300">
                    Alerting you when fellow citizens confirm an issue you reported or when moderators verify a reported condition.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: AI Privacy & Google Gemini */}
            <section className="bg-white dark:bg-[#142533] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#142B3B] dark:text-white">
                    3. AI Privacy Safeguards & Google Gemini
                  </h3>
                  <p className="text-xs text-[#667784] dark:text-slate-400">
                    Strict boundaries governing our AI category suggestion and duplicate detection features.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
                <p className="leading-relaxed">
                  RouteX utilizes <strong>Google Gemini AI</strong> exclusively through server-side backend adapters to assist with:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Suggesting the most fitting hazard category based on draft descriptions.</li>
                  <li>Improving grammar and clarity while preserving the reporter's observed facts.</li>
                  <li>Providing objective summaries for moderators and commuters.</li>
                  <li>Proactively grouping duplicate reports in close geographic and temporal proximity.</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-[#667784] dark:text-slate-300 space-y-1.5">
                <strong className="text-[#142B3B] dark:text-white block">
                  Zero Personal Identifiers Transmitted to AI:
                </strong>
                <p className="leading-relaxed">
                  We <strong>NEVER</strong> transmit your username, email, user ID, IP address, or account profile to the Gemini API. Only the raw hazard description text is evaluated. AI assists the user; it never automatically decides whether a road is officially closed.
                </p>
              </div>
            </section>

            {/* Section 4: Account Deletion & Anonymization */}
            <section className="bg-white dark:bg-[#142533] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#142B3B] dark:text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>4. Data Retention & Account Deletion Policy</span>
              </h3>
              <p className="text-xs text-[#667784] dark:text-slate-300 leading-relaxed">
                You retain full ownership of your account and personal profile. You may permanently delete your account at any time:
              </p>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                  <span>How to Delete Your Account:</span>
                </div>
                <p className="text-[#667784] dark:text-slate-300">
                  Navigate to your <strong>Citizen Dashboard</strong> &rarr; <strong>Settings Tab</strong> &rarr; Click <strong>"Delete My Account"</strong>. You can also trigger self-service erasure via the REST endpoint <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[11px]">POST /api/v1/auth/delete-account/</code>.
                </p>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <strong className="text-[#142B3B] dark:text-white">Civic Road Safety Anonymization:</strong>
                  <p className="text-[#667784] dark:text-slate-300 mt-1 leading-relaxed">
                    Upon account deletion, your user credentials, profile, email address, password hash, and device push tokens are immediately and irreversibly destroyed. To ensure that dangerous road obstructions remain known to fellow commuters, previously submitted hazard markers remain on the map in a fully anonymized state (<code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">reporter = NULL</code>) with zero connection to your identity.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Third-Party Integrations */}
            <section className="bg-white dark:bg-[#142533] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#142B3B] dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-[#087F8C]" />
                <span>5. External Service Providers</span>
              </h3>
              <p className="text-xs text-[#667784] dark:text-slate-300 leading-relaxed">
                RouteX collaborates only with established open-source and infrastructure providers that uphold privacy standards:
              </p>
              <ul className="space-y-2.5 text-xs text-[#667784] dark:text-slate-300">
                <li className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#142B3B] dark:text-white">OpenStreetMap (OSM):</strong> We render base map tiles using OpenStreetMap in accordance with the OpenStreetMap Tile Usage Policy. No user credentials or identities are shared with OSM.
                  </div>
                </li>
                <li className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                  <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#142B3B] dark:text-white">Google Gemini API:</strong> Evaluates text descriptions on-demand with server-side proxying and strict privacy limits.
                  </div>
                </li>
                <li className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#142B3B] dark:text-white">Expo Push Gateway:</strong> Routes device push notifications for mobile app users using unique anonymous device tokens.
                  </div>
                </li>
              </ul>
            </section>
          </>
        ) : (
          /* Terms of Service & Community Guidelines */
          <div className="space-y-8">
            <div className="bg-white dark:bg-[#142533] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#142B3B] dark:text-white">
                    Driver Safety Pledge & Terms of Service
                  </h2>
                  <p className="text-xs text-[#667784] dark:text-slate-400">
                    Community rules and legal terms governing the use of RouteX.
                  </p>
                </div>
              </div>

              {/* Driver Safety Warning */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>DO NOT REPORT WHILE DRIVING</span>
                </div>
                <p className="leading-relaxed">
                  Never interact with RouteX, type descriptions, or take photographs while operating a motor vehicle, motorcycle, or bicycle. Always pull over to a safe, designated stopping area before submitting or reviewing hazard reports.
                </p>
              </div>

              {/* Terms Points */}
              <div className="space-y-4 text-xs text-[#667784] dark:text-slate-300">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-[#142B3B] dark:text-white">
                    1. Crowdsourced Observations Disclaimer
                  </h3>
                  <p className="leading-relaxed">
                    RouteX reports represent community-submitted observations from fellow road users. Reports do not constitute official government road closures, engineering assessments, or guaranteed real-time truth. Commuters must exercise personal discretion and observe real-world traffic signs.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-[#142B3B] dark:text-white">
                    2. Responsible Reporting & Community Standards
                  </h3>
                  <p className="leading-relaxed">
                    By submitting content to RouteX, you agree not to submit false, malicious, defamatory, or abusive reports. Do not upload photographs containing visible license plates, identifiable faces of private individuals, or copyrighted material.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-[#142B3B] dark:text-white">
                    3. Moderation & Audit Authority
                  </h3>
                  <p className="leading-relaxed">
                    Designated RouteX community moderators review flagged, duplicate, or inaccurate reports. Moderators reserve the right to edit, reclassify, resolve, or reject any report that violates community trust or accuracy guidelines.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-[#142B3B] dark:text-white">
                    4. Limitation of Liability
                  </h3>
                  <p className="leading-relaxed">
                    RouteX and Team NextGen provide the platform on an "as-is" and "as-available" basis. We are not liable for travel delays, vehicle damage, personal injury, or consequential losses resulting from reliance on crowdsourced road reports.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact & Privacy Inquiries */}
        <div className="bg-slate-100 dark:bg-[#142533] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-950/60 mx-auto flex items-center justify-center text-[#087F8C] dark:text-teal-400">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#142B3B] dark:text-white">
            Have Questions About Your Data?
          </h3>
          <p className="text-xs text-[#667784] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            For privacy inquiries, rights requests, data concerns, or inappropriate content removal, contact our data protection team:
          </p>
          <div className="pt-1">
            <a
              href="mailto:privacy@routex.org"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-lg shadow-xs transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>privacy@routex.org</span>
            </a>
          </div>
          <p className="text-[11px] text-slate-500 pt-2">
            Team NextGen &bull; RouteX Road Awareness Platform
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0B161E] text-slate-400 border-t border-slate-800 text-xs py-8 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <RouteXLogo size="sm" />
            <span className="font-bold text-white text-sm">RouteX</span>
          </div>
          <p className="text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} RouteX. Team NextGen. Know the Road Ahead.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default PrivacyPolicyPage;
