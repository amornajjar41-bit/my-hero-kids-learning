import { useApp } from "@/contexts/AppContext";
import { tr, type TKey } from "@/constants/i18n";

export function useT() {
  const { profile } = useApp();
  const lang = profile?.language ?? "en";
  return (key: TKey) => tr(key, lang);
}

export function useLang(): "en" | "ar" {
  const { profile } = useApp();
  return profile?.language ?? "en";
}
