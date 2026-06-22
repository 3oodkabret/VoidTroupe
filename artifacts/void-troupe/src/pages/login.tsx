import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { loginRequest } from "@/lib/auth-api";
import { useAuthStore } from "@/store/use-auth-store";

export default function Login() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const session = useAuthStore((state) => state.session);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setLocation("/profile");
    }
  }, [session, setLocation]);

  if (session) return null;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await loginRequest(email.trim(), password);
      setSession(response);
      setLocation("/profile");
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
          <h1 className="text-3xl font-display font-bold text-white">{t("auth.login.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("auth.login.subtitle")}</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <label className="text-sm text-white/80">{t("auth.fields.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60"
                placeholder={t("auth.placeholders.email")}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm text-white/80">{t("auth.fields.password")}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60"
                placeholder={t("auth.placeholders.password")}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-primary/85 hover:bg-primary text-black font-semibold text-sm transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {t("auth.login.submit")}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
            <Link href="/forgot-password" className="hover:text-white transition-colors">
              {t("auth.login.forgotPassword")}
            </Link>
            <Link href="/register" className="hover:text-white transition-colors">
              {t("auth.login.createAccount")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
