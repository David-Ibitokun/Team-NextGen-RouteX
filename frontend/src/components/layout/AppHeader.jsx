import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  PlusCircle,
  FileCode,
  Sun,
  Moon,
  Menu,
  X,
  MapPin,
  Shield,
  ShieldAlert,
  User as UserIcon,
  LogOut,
  CheckCircle2,
  Sliders,
  Download,
  LayoutDashboard,
  CircleHelp,
  Info,
  ShieldCheck,
} from "lucide-react";
import { RouteXLogo } from "../common/RouteXLogo";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "../notifications/NotificationBell";
import { ToastNotification } from "../notifications/ToastNotification";

export function AppHeader({ onReportClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user, isModerator, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  const handleReport = () => {
    setMobileMenuOpen(false);
    if (onReportClick) {
      onReportClick();
    } else {
      navigate("/report");
    }
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate("/");
  };

  const isMapRoute = location.pathname === "/map";
  const isDashboardRoute = location.pathname === "/dashboard" || location.pathname === "/my-reports";
  const isModeratorRoute = location.pathname === "/moderator" || location.pathname === "/moderation";
  const isAdminRoute = location.pathname === "/admin-dashboard" || location.pathname === "/admin";

  return (
    <header className="sticky top-0 bg-[#142B3B]/90 dark:bg-[#0B161E]/90 backdrop-blur-md text-white border-b border-slate-700/80 dark:border-slate-800 shrink-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand with SVG Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus:outline-none rounded-lg p-1"
        >
          <RouteXLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-teal-300 transition-colors">
                RouteX
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Main Navigation"
          className="max-md:hidden flex items-center gap-5 text-xs font-medium text-slate-300"
        >
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="max-lg:hidden flex items-center gap-1 text-xs font-medium text-slate-300">
            <a
              href="/#features"
              className="hover:text-white transition-colors py-1.5 px-2 rounded-md hover:bg-slate-800/40"
            >
              Features
            </a>
            <a
              href="/#safety-and-trust"
              className="hover:text-white transition-colors py-1.5 px-2 rounded-md hover:bg-slate-800/40"
            >
              Safety & Trust
            </a>
            <a
              href="/#about"
              className="hover:text-white transition-colors py-1.5 px-2 rounded-md hover:bg-slate-800/40"
            >
              About us
            </a>
            <a
              href="/#how-to-use"
              className="hover:text-white transition-colors py-1.5 px-2 rounded-md hover:bg-slate-800/40"
            >
              How to use
            </a>
            <Link
              to="/privacy"
              className={`hover:text-white transition-colors py-1.5 px-2 rounded-md ${
                location.pathname === "/privacy" || location.pathname === "/terms"
                  ? "text-teal-400 font-semibold bg-slate-800/60"
                  : "hover:bg-slate-800/40"
              }`}
            >
              Data & Privacy
            </Link>
            <Link
              to="/map"
              className={`flex items-center gap-1.5 transition-colors py-1.5 px-2 rounded-md ${
                isMapRoute
                  ? "text-teal-400 font-semibold bg-slate-800/60"
                  : "hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>Explore Map</span>
            </Link>
          </div>

          {/* PWA Install Button (desktop & mobile supported) */}
          {installPrompt && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-teal-300 hover:text-white bg-teal-950/60 hover:bg-teal-900/80 rounded-md border border-teal-800 transition-colors animate-pulse"
              title="Install RouteX App on your device"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span className="max-sm:hidden inline">Install App</span>
            </button>
          )}

          {/* Swagger API Docs */}
          <a
            href="/api/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="max-xl:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 rounded-md border border-slate-700 transition-colors"
            title="Open interactive Swagger UI API documentation"
          >
            <FileCode className="w-3.5 h-3.5 text-teal-400" />
            {/* <span>API Docs</span> */}
          </a>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors border border-slate-700/80"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#F2B544]" />
            ) : (
              <Moon className="w-4 h-4 text-slate-200" />
            )}
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Auth Controls */}
          {user ? (
            <div className="relative max-sm:hidden block">
              <button
                type="button"
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
                aria-expanded={userDropdownOpen}
              >
                <div className="w-5 h-5 rounded-full bg-[#087F8C] flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {user.display_name ? user.display_name.charAt(0) : user.username.charAt(0)}
                </div>
                <span className="max-sm:hidden inline max-w-[100px] truncate">
                  {user.display_name || user.username}
                </span>
                <span
                  className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                    isAdmin
                      ? "bg-purple-900/60 text-purple-300 border border-purple-700"
                      : isModerator
                      ? "bg-amber-900/60 text-amber-300 border border-amber-700"
                      : "bg-teal-900/60 text-teal-300 border border-teal-700"
                  }`}
                >
                  {isAdmin ? "Admin" : isModerator ? "Mod" : "Citizen"}
                </span>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#142533] text-[#142B3B] dark:text-slate-100 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  role="menu"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold truncate">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email || `@${user.username}`}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                      {isAdmin ? "Platform Administrator" : isModerator ? "Community Moderator" : "Citizen Contributor"}
                    </span>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                      isDashboardRoute
                        ? "text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    }`}
                    role="menuitem"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Citizen Dashboard</span>
                  </Link>

                  {isModerator && (
                    <Link
                      to="/moderator"
                      onClick={() => setUserDropdownOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                        isModeratorRoute
                          ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40"
                          : "text-amber-700 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                      }`}
                      role="menuitem"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      <span>Moderator Queue</span>
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      to="/admin-dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                        isAdminRoute
                          ? "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40"
                          : "text-indigo-700 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                      }`}
                      role="menuitem"
                    >
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Admin Portal</span>
                    </Link>
                  )}


                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors border-t border-slate-100 dark:border-slate-800"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="max-sm:hidden flex items-center gap-2">
              <Link
                to="/login"
                className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Primary Report Action */}
          <button
            type="button"
            onClick={handleReport}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <PlusCircle className="max-sm:hidden inline-flex w-3.5 h-3.5" />
            <span className="sm:hidden">Report</span>
            <span className="max-sm:hidden inline">Report a Hazard</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-700/80 dark:border-slate-800 bg-[#142B3B]/95 dark:bg-[#0B161E]/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top duration-150">
          <nav className="flex flex-col space-y-1">

            {user && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 text-teal-400"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Citizen Dashboard</span>
              </Link>
            )}

            {isModerator && (
              <Link
                to="/moderator"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 text-amber-400"
              >
                <Shield className="w-4 h-4" />
                <span>Moderator Queue</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 text-indigo-400"
              >
                <Sliders className="w-4 h-4" />
                <span>Admin Operations</span>
              </Link>
            )}

            {installPrompt && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleInstallClick();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-teal-900/60 text-teal-300"
              >
                <Download className="w-4 h-4" />
                <span>Install RouteX App</span>
              </button>
            )}

            <a
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 text-slate-200"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
              Features
            </a>
            <a
              href="/#safety-and-trust"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 text-slate-200"
            >
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              Safety & Trust
            </a>
            <a
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 text-slate-200"
            >
              <Info className="w-4 h-4 text-slate-400" />
              About us
            </a>
            <a
              href="/#how-to-use"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 text-slate-200"
            >
              <CircleHelp className="w-4 h-4 text-slate-400" />
              How to use
            </a>

            <Link
              to="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 text-slate-200"
            >
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Data & Privacy Policy</span>
            </Link>
            
            <Link
              to="/map"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 text-teal-400"
            >
              {/* <MapPin className="w-4 h-4" /> */}
              <span>Explore Map</span>
            </Link>

            <a
              href="/api/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 text-slate-300"
            >
              <FileCode className="w-4 h-4 text-teal-400" />
              <span>Swagger API Docs</span>
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-700/80 space-y-2">
            {user ? (
              <>
                <div className="px-3 py-1 text-xs text-slate-400 flex items-center justify-between">
                  <span>Signed in as <strong className="text-white">{user.username}</strong></span>
                  <span className="capitalize text-[10px] font-bold text-teal-400">{user.role}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-md"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      <ToastNotification />
    </header>
  );
}

export default AppHeader;
