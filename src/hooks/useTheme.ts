import { useEffect, useSyncExternalStore } from "react";
import { useSettingsStore } from "../store/settings";

function subscribeToDarkClass(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getIsDark() {
  return document.documentElement.classList.contains("dark");
}

/** Apply theme class and return resolved isDark boolean. Light is the default. */
export function useTheme() {
  const theme = useSettingsStore((s) => s.system.theme);

  useEffect(() => {
    const root = document.documentElement;
    // Only explicit "dark" enables dark mode; "system" and unset → light
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return useSyncExternalStore(subscribeToDarkClass, getIsDark, () => false);
}
