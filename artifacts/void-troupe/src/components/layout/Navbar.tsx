import { useState } from "react";
import { Link } from "wouter";
import {
  Sparkles,
  History,
  UserCircle,
  LogOut,
  LogIn,
  Menu,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuthStore } from "@/store/use-auth-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavLinksProps = {
  onNavigate?: () => void;
  layout?: "row" | "column";
};

function NavLinks({ onNavigate, layout = "row" }: NavLinksProps) {
  const { t } = useTranslation();
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);

  const linkClass = cn(
    "text-sm font-medium text-muted-foreground hover:text-white transition-colors rounded-md hover:bg-white/5",
    layout === "column"
      ? "flex items-center gap-3 px-4 py-3 w-full text-base"
      : "flex items-center gap-1.5 px-3 py-2",
  );

  const handleLogout = () => {
    logout();
    onNavigate?.();
  };

  return (
    <>
      <LanguageSwitcher className={layout === "column" ? "w-full justify-between px-4 py-3" : undefined} />
      <Link href="/history" className={linkClass} onClick={onNavigate}>
        <History className="w-4 h-4 shrink-0" />
        {t("ui.nav.history")}
      </Link>
      <Link href="/mbti" className={linkClass} onClick={onNavigate}>
        {t("ui.nav.mbtiTest")}
      </Link>
      {session ? (
        <>
          <Link href="/profile" className={linkClass} onClick={onNavigate}>
            <UserCircle className="w-4 h-4 shrink-0" />
            {t("ui.nav.profile")}
          </Link>
          <button type="button" onClick={handleLogout} className={linkClass}>
            <LogOut className="w-4 h-4 shrink-0" />
            {t("ui.nav.logout")}
          </button>
        </>
      ) : (
        <Link href="/login" className={linkClass} onClick={onNavigate}>
          <LogIn className="w-4 h-4 shrink-0" />
          {t("ui.nav.login")}
        </Link>
      )}
      <Link
        href="/analyze"
        className={cn(
          layout === "column"
            ? "mt-2 flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            : "px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] cursor-pointer",
        )}
        onClick={onNavigate}
      >
        {t("ui.nav.startAnalysis")}
      </Link>
    </>
  );
}

export function Navbar() {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sheetSide = i18n.language === "ar" ? "left" : "right";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:box-glow transition-all duration-500">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-base sm:text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 truncate">
            {t("ui.nav.brand")}
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-2 xl:gap-4">
          <NavLinks />
        </div>

        <div className="flex lg:hidden items-center">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={t("ui.a11y.openMenu")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side={sheetSide}
              className="w-[min(100vw-2rem,320px)] border-white/10 bg-background/95 backdrop-blur-xl p-0"
            >
              <SheetHeader className="border-b border-white/10 px-6 py-5 text-left">
                <SheetTitle className="font-display tracking-wider">
                  {t("ui.nav.menu")}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-2 py-4">
                <NavLinks layout="column" onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
