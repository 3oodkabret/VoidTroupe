import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { BrainCircuit, Loader2, Lock, Save, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { updateProfileRequest } from "@/lib/auth-api";
import { useAuthStore } from "@/store/use-auth-store";

export default function Profile() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const session = useAuthStore((state) => state.session);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);

  const [name, setName] = useState(session?.user.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reportLanguage, setReportLanguage] = useState("en");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLocation("/login");
    }
  }, [session, setLocation]);

  if (!session) return null;

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = await updateProfileRequest(session.token, name.trim());
      updateUser(payload.user ?? { name: name.trim() });
      setSuccess(t("profile.page.saveSuccess"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.errors.generic"));
    } finally {
      setIsSaving(false);
    }
  };

  const onLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
      <div className="max-w-3xl mx-auto">
        <div className="glass-panel rounded-3xl p-8 md:p-10 border border-purple-500/30">
          <div className="flex items-center gap-3">
            <UserCircle className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-display font-bold text-white">{t("profile.page.title")}</h1>
          </div>
          <p className="text-muted-foreground mt-2">{t("profile.page.subtitle")}</p>

          <form onSubmit={onSave} className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-white/80">{t("auth.fields.name")}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60"
                placeholder={t("auth.placeholders.name")}
                disabled={isSaving}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-white/80">{t("auth.fields.email")}</label>
              <input
                type="email"
                value={session.user.email}
                className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white/70"
                disabled
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl border border-purple-500/30 bg-black/30 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-semibold text-white">{t("profile.security")}</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/70">{t("profile.currentPassword")}</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-1 w-full h-10 rounded-xl border border-white/10 bg-black/50 px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/70">{t("profile.newPassword")}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 w-full h-10 rounded-xl border border-white/10 bg-black/50 px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/70">{t("profile.confirmPassword")}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 w-full h-10 rounded-xl border border-white/10 bg-black/50 px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-black/30 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-semibold text-white">{t("profile.personalitySummary")}</h3>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/50 px-3 py-3">
                  <p className="text-sm text-white/85">{t("profile.latestResult", { result: "INTJ-A" })}</p>
                  <div className="mt-3 h-24 rounded-lg border border-white/10 bg-black/40 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute w-16 h-16 border border-primary/35 rounded-full" />
                    <div className="absolute w-10 h-10 border border-primary/25 rounded-full" />
                    <div className="absolute w-20 h-[1px] bg-primary/20" />
                    <div className="absolute h-20 w-[1px] bg-primary/20" />
                    <div className="absolute w-14 h-[1px] bg-primary/15 rotate-45" />
                    <div className="absolute w-14 h-[1px] bg-primary/15 -rotate-45" />
                    <div className="absolute w-10 h-10 border border-primary/35 bg-primary/10 rounded-sm rotate-12" />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs text-white/70">{t("profile.reportLanguagePreference")}</label>
                  <select
                    value={reportLanguage}
                    onChange={(e) => setReportLanguage(e.target.value)}
                    className="mt-1 w-full h-10 rounded-xl border border-white/10 bg-black/50 px-3 text-sm text-white focus:outline-none focus:border-primary/60"
                    disabled={isSaving}
                  >
                    <option value="en" className="bg-black text-white">
                      {t("profile.reportLanguageOptions.english")}
                    </option>
                    <option value="tr" className="bg-black text-white">
                      {t("profile.reportLanguageOptions.turkish")}
                    </option>
                    <option value="ar" className="bg-black text-white">
                      {t("profile.reportLanguageOptions.arabic")}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <p className="md:col-span-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="md:col-span-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="h-11 px-5 rounded-xl bg-primary/85 hover:bg-primary text-black font-semibold text-sm transition-colors disabled:opacity-60 inline-flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t("profile.page.saveButton")}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="h-11 px-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm transition-colors"
              >
                {t("profile.page.logoutButton")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
