import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { AppHeader } from "../components/layout/AppHeader";
import { RouteXLogo } from "../components/common/RouteXLogo";
import { authService } from "../services/apiClient";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [username, setUsername] = useState("");
  const [validationError, setValidationError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!uid || !token) {
        if (isMounted) {
          setValidating(false);
          setTokenValid(false);
          setValidationError("Invalid password reset link. Security parameters are missing.");
        }
        return;
      }

      try {
        const res = await authService.validateResetToken(uid, token);
        if (isMounted) {
          setTokenValid(true);
          setUsername(res.username || "");
        }
      } catch (err) {
        if (isMounted) {
          setTokenValid(false);
          if (err.response && err.response.data && err.response.data.detail) {
            setValidationError(err.response.data.detail);
          } else {
            setValidationError("This password reset link is invalid or has expired. Please request a new link.");
          }
        }
      } finally {
        if (isMounted) {
          setValidating(false);
        }
      }
    }

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!newPassword || newPassword.length < 8) {
      setSubmitError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await authService.confirmPasswordReset({
        uid,
        token,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      setSuccess(true);
    } catch (err) {
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.detail) {
          setSubmitError(data.detail);
        } else if (data.new_password) {
          setSubmitError(Array.isArray(data.new_password) ? data.new_password[0] : data.new_password);
        } else if (data.new_password_confirm) {
          setSubmitError(
            Array.isArray(data.new_password_confirm)
              ? data.new_password_confirm[0]
              : data.new_password_confirm
          );
        } else {
          setSubmitError("Failed to reset password. Please try again or request a new reset link.");
        }
      } else {
        setSubmitError("Network error. Unable to complete password reset.");
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
              Choose New Password
            </h1>
            <p className="text-xs text-[#667784] dark:text-slate-400 mt-1">
              {username ? `Create a new password for account @${username}.` : "Set a new, secure password for your RouteX account."}
            </p>
          </div>

          {validating ? (
            <div className="text-center py-8 space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#087F8C] mx-auto" />
              <p className="text-xs text-[#667784] dark:text-slate-400">
                Verifying password reset security link...
              </p>
            </div>
          ) : !tokenValid ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-950/50 text-[#D64545] dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-[#142B3B] dark:text-white">
                Link Expired or Invalid
              </h2>
              <p className="text-xs text-[#667784] dark:text-slate-300 leading-relaxed">
                {validationError || "This password reset link is invalid or has expired for your security."}
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/forgot-password"
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-lg transition-colors flex items-center justify-center"
                >
                  Request a New Reset Link
                </Link>
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 text-xs font-medium text-[#667784] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/50 text-[#087F8C] dark:text-teal-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-[#142B3B] dark:text-white">
                Password Reset Successfully
              </h2>
              <p className="text-xs text-[#667784] dark:text-slate-300 leading-relaxed">
                Your password has been updated. You can now sign in with your new credentials.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full py-3 px-4 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>Sign In Now</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-[#D64545] dark:text-red-300 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    className="w-full text-xs p-3 pr-11 bg-[#F7F9FA] dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 text-[#142B3B] dark:text-slate-100 rounded-lg focus:outline-none focus:border-[#087F8C] focus:bg-white dark:focus:bg-[#152735]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 focus:outline-none transition-colors"
                    aria-label={showPassword ? "Hide new password" : "Show new password"}
                    title={showPassword ? "Hide new password" : "Show new password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#667784] dark:text-slate-400 mt-1">
                  Must be at least 8 characters long and not too common.
                </p>
              </div>

              <div>
                <label
                  htmlFor="newPasswordConfirm"
                  className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200 mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="newPasswordConfirm"
                    type={showPasswordConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    className="w-full text-xs p-3 pr-11 bg-[#F7F9FA] dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 text-[#142B3B] dark:text-slate-100 rounded-lg focus:outline-none focus:border-[#087F8C] focus:bg-white dark:focus:bg-[#152735]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 focus:outline-none transition-colors"
                    aria-label={showPasswordConfirm ? "Hide confirm password" : "Show confirm password"}
                    title={showPasswordConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showPasswordConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Save New Password</span>
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

export default ResetPasswordPage;
