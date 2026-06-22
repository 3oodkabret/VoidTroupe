import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { KeyRound, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { resetPasswordRequest } from "@/lib/auth-api";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") ?? "";
  }, []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!token) {
      setError(t("auth.reset.invalidLink"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.reset.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.reset.passwordMismatch"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await resetPasswordRequest(token, password);
      setSuccess(response.message || t("auth.reset.success"));
      setTimeout(() => setLocation("/login"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
      <div className="max-w-md mx-auto">
        <div className="glass-panel rounded-3xl p-8 border border-purple-500/30">
          <h1 className="text-3xl font-display font-bold text-white">{t("auth.reset.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("auth.reset.subtitle")}</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <label className="text-sm text-white/80">{t("auth.fields.password")}</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60"
                placeholder={t("auth.placeholders.password")}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm text-white/80">{t("auth.reset.confirmPassword")}</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60"
                placeholder={t("auth.reset.confirmPasswordPlaceholder")}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full h-11 rounded-xl bg-primary/85 hover:bg-primary text-black font-semibold text-sm transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {t("auth.reset.submit")}
            </button>
          </form>

          <div className="mt-5 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-white transition-colors">
              {t("auth.forgot.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
