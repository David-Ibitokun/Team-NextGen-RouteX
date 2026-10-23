import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserPlus, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { AppHeader } from "../components/layout/AppHeader";
import { RouteXLogo } from "../components/common/RouteXLogo";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextDestination = searchParams.get("next") || "/map";
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const formatFieldError = (field) => {
    const err = fieldErrors[field];
    if (!err) return null;
    if (Array.isArray(err)) return err.join(" ");
    if (typeof err === "object") return Object.values(err).flat().join(" ");
    return String(err);
  };

  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errors = {};
    if (!username.trim() || username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters.";
    }
    if (!email.trim() || !email.includes("@")) {
      errors.email = "Please provide a valid email address.";
    }
    if (!password || password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    if (password !== passwordConfirm) {
      errors.password_confirm = "Passwords do not match.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setFieldErrors({});

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username: username.trim(),
        display_name: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirm: passwordConfirm,
      });
      navigate(nextDestination);
    } catch (err) {
      if (err.response && err.response.data) {
        if (typeof err.response.data === "object" && !err.response.data.detail) {
          setFieldErrors(err.response.data);
          const topError = err.response.data.non_field_errors || err.response.data.detail;
          if (topError) {
            setServerError(Array.isArray(topError) ? topError.join(" ") : String(topError));
          }
        } else {
          setServerError(err.response.data.detail || "Registration failed. Please try again.");
        }
      } else {
        setServerError("Could not complete registration. Check your connection.");
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
              Create a RouteX Account
            </h1>
            <p className="text-xs text-[#667784] dark:text-slate-400 mt-1">
              Join the community road reporting network.
            </p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-[#D64545] dark:text-red-300 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200 mb-1"
              >
                Username <span className="text-[#D64545]">*</span>
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearFieldError("username");
                }}
                placeholder="e.g. adetola"
                required
                className={`w-full text-xs p-2.5 bg-[#F7F9FA] dark:bg-[#1B3142] border ${
                  formatFieldError("username")
                    ? "border-[#D64545] focus:border-[#D64545]"
                    : "border-[#DCE4E8] dark:border-slate-700 focus:border-[#087F8C]"
                } text-[#142B3B] dark:text-slate-100 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-[#152735] transition-colors`}
              />
              {formatFieldError("username") && (
                <p className="text-xs text-[#D64545] mt-1 font-medium">{formatFieldError("username")}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200 mb-1"
              >
                Display name <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Adetola Adeyemi"
                className="w-full text-xs p-2.5 bg-[#F7F9FA] dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 text-[#142B3B] dark:text-slate-100 rounded-lg focus:outline-none focus:border-[#087F8C] focus:bg-white dark:focus:bg-[#152735]"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200 mb-1"
              >
                Email address <span className="text-[#D64545]">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                placeholder="user@example.com"
                required
                className={`w-full text-xs p-2.5 bg-[#F7F9FA] dark:bg-[#1B3142] border ${
                  formatFieldError("email")
                    ? "border-[#D64545] focus:border-[#D64545]"
                    : "border-[#DCE4E8] dark:border-slate-700 focus:border-[#087F8C]"
                } text-[#142B3B] dark:text-slate-100 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-[#152735] transition-colors`}
              />
              {formatFieldError("email") && (
                <p className="text-xs text-[#D64545] mt-1 font-medium">{formatFieldError("email")}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200 mb-1"
              >
                Password <span className="text-[#D64545]">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  placeholder="Minimum 8 characters"
                  required
                  className={`w-full text-xs p-2.5 pr-10 bg-[#F7F9FA] dark:bg-[#1B3142] border ${
                    formatFieldError("password")
                      ? "border-[#D64545] focus:border-[#D64545]"
                      : "border-[#DCE4E8] dark:border-slate-700 focus:border-[#087F8C]"
                  } text-[#142B3B] dark:text-slate-100 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-[#152735] transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formatFieldError("password") && (
                <p className="text-xs text-[#D64545] mt-1 font-medium">{formatFieldError("password")}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="passwordConfirm"
                className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200 mb-1"
              >
                Confirm password <span className="text-[#D64545]">*</span>
              </label>
              <div className="relative">
                <input
                  id="passwordConfirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    clearFieldError("password_confirm");
                  }}
                  placeholder="Re-enter password"
                  required
                  className={`w-full text-xs p-2.5 pr-10 bg-[#F7F9FA] dark:bg-[#1B3142] border ${
                    formatFieldError("password_confirm")
                      ? "border-[#D64545] focus:border-[#D64545]"
                      : "border-[#DCE4E8] dark:border-slate-700 focus:border-[#087F8C]"
                  } text-[#142B3B] dark:text-slate-100 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-[#152735] transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 focus:outline-none transition-colors"
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
              {formatFieldError("password_confirm") && (
                <p className="text-xs text-[#D64545] mt-1 font-medium">{formatFieldError("password_confirm")}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create account</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              By creating an account, you agree to RouteX's{" "}
              <Link to="/privacy#terms" className="text-[#087F8C] dark:text-teal-400 hover:underline font-semibold">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-[#087F8C] dark:text-teal-400 hover:underline font-semibold">
                Privacy Policy
              </Link>.
            </p>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-[#667784] dark:text-slate-400">
            <span>Already have an account? </span>
            <Link
              to={`/login${nextDestination ? `?next=${encodeURIComponent(nextDestination)}` : ""}`}
              className="text-[#087F8C] dark:text-teal-400 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
