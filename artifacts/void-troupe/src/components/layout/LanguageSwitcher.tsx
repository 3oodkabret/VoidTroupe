import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

const LANGUAGE_OPTIONS = ["en", "ar", "tr"] as const;

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 border border-white/10 text-xs text-white/90">
      <Languages className="w-4 h-4 text-primary" />
      <span className="hidden sm:inline">{t("ui.nav.language")}</span>
      <select
        value={i18n.language}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
        className="bg-transparent outline-none cursor-pointer text-xs"
      >
        {LANGUAGE_OPTIONS.map((lang) => (
          <option key={lang} value={lang} className="bg-black text-white">
            {t(`ui.languageNames.${lang}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
