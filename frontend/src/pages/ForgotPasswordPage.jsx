import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Clock } from "lucide-react";
import { AppHeader } from "../components/layout/AppHeader";
import { RouteXLogo } from "../components/common/RouteXLogo";
import { authService } from "../services/apiClient";

const COOLDOWN_DURATION_SECONDS = 120; // 2 minutes cooldown
const STORAGE_KEY = "routex_reset_cooldown";

function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return "0:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Restore cooldown from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { email: savedEmail, expiresAt } = JSON.parse(stored);
        const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
        if (remaining > 0) {
          setCountdown(remaining);
          if (savedEmail) {
            setEmail(savedEmail);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Live countdown timer ticking every second
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          localStorage.removeItem(STORAGE_KEY);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const startCooldown = (targetEmail, duration = COOLDOWN_DURATION_SECONDS) => {
    setCountdown(duration);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          email: targetEmail,
          expiresAt: Date.now() + duration * 1000,
        })
      );
    } catch {
      // Ignore localStorage write error if disabled
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (countdown > 0) {
      setError(`Please wait ${formatCountdown(countdown)} before requesting another reset email.`);
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setSubmitting(true);
    try {
      const res = await authService.requestPasswordReset(cleanEmail);
      const retryAfter = res?.retry_after || COOLDOWN_DURATION_SECONDS;
      startCooldown(cleanEmail, retryAfter);
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = err.response.data?.retry_after || COOLDOWN_DURATION_SECONDS;
        startCooldown(cleanEmail, retryAfter);
        setError(
          err.response.data?.detail ||
            `Please wait ${formatCountdown(retryAfter)} before requesting another reset email.`
        );
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.email) {
        setError(
          Array.isArray(err.response.data.email)
            ? err.response.data.email[0]
            : err.response.data.email
        );
      } else {
        setError("Unable to submit password reset request. Please check your connection.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0B161E] text-[#142B3B] dark:text-slate-100 flex flex-col font-sans transition-colors">
      <AppHeader />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-[#142533] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <RouteXLogo size="lg" />
            </div>
            <h1 className="text-xl font-bold text-[#142B3B] dark:text-white">
              Reset Your Password
            </h1>
            <p className="text-xs text-[#667784] dark:text-slate-400 mt-1">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-[#D64545] dark:text-red-300 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/50 text-[#087F8C] dark:text-teal-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-[#142B3B] dark:text-white">
                Check Your Inbox
              </h2>
              <p className="text-xs text-[#667784] dark:text-slate-300 leading-relaxed">
                If an account matches <strong className="text-[#142B3B] dark:text-white">{email}</strong>, you will receive an email with instructions to reset your password shortly.
              </p>

              {/* 2-Minute Cooldown Countdown Banner */}
              {countdown > 0 ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-[#667784] dark:text-slate-300">
                      <Clock className="w-4 h-4 text-[#087F8C] animate-pulse" />
                      <span>Resend cooldown:</span>
                    </span>
                    <span className="font-mono font-bold text-xs bg-slate-200/70 dark:bg-slate-700 text-[#142B3B] dark:text-white px-2 py-0.5 rounded">
                      {formatCountdown(countdown)}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#087F8C] h-full transition-all duration-1000 ease-linear rounded-full"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((COOLDOWN_DURATION_SECONDS - countdown) / COOLDOWN_DURATION_SECONDS) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-[#667784] dark:text-slate-400">
                    To prevent spam, you can request another email in{" "}
                    <strong className="text-[#142B3B] dark:text-slate-200">
                      {formatCountdown(countdown)}
                    </strong>
                    .
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-teal-50/60 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-900/50 text-xs text-left text-teal-800 dark:text-teal-300">
                  <p>Ready to request another link if you didn't receive the email.</p>
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-500 dark:text-slate-400 text-left">
                <p>&bull; The reset link is valid for 24 hours.</p>
                <p>&bull; Be sure to check your spam or junk folder if you don't see it.</p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={countdown > 0}
                  onClick={() => {
                    setSuccess(false);
                  }}
                  className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    countdown > 0
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                      : "text-[#087F8C] dark:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-[#087F8C]/30"
                  }`}
                >
                  {countdown > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Resend available in {formatCountdown(countdown)}</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Resend reset email</span>
                    </>
                  )}
                </button>

                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cooldown Info Banner if user navigates back while countdown is active */}
              {countdown > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
                    <span>Cooldown active. Try again in:</span>
                  </div>
                  <span className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded text-amber-900 dark:text-amber-200">
                    {formatCountdown(countdown)}
                  </span>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full text-xs p-3 bg-[#F7F9FA] dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 text-[#142B3B] dark:text-slate-100 rounded-lg focus:outline-none focus:border-[#087F8C] focus:bg-white dark:focus:bg-[#152735]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || countdown > 0}
                className="w-full py-3 px-4 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending reset link...</span>
                  </>
                ) : countdown > 0 ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Try again in {formatCountdown(countdown)}</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Reset Link</span>
                  </>
                )}
              </button>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#087F8C] dark:text-teal-400 font-semibold hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default ForgotPasswordPage;
