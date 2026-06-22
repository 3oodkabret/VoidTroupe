import { Link } from "wouter";
import { Sparkles, History, UserCircle, LogOut, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuthStore } from "@/store/use-auth-store";

export function Navbar() {
  const { t } = useTranslation();
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:box-glow transition-all duration-500">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            {t("ui.nav.brand")}
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link href="/history" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-white/5">
            <History className="w-4 h-4" />
            {t("ui.nav.history")}
          </Link>
          <Link href="/mbti" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-white/5">
            {t("ui.nav.mbtiTest")}
          </Link>
          {session ? (
            <>
              <Link href="/profile" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-white/5">
                <UserCircle className="w-4 h-4" />
                {t("ui.nav.profile")}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-white/5"
              >
                <LogOut className="w-4 h-4" />
                {t("ui.nav.logout")}
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-white/5">
              <LogIn className="w-4 h-4" />
              {t("ui.nav.login")}
            </Link>
          )}
          <Link href="/analyze" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] cursor-pointer">
            {t("ui.nav.startAnalysis")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
