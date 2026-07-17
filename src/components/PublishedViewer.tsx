import { useEffect, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import type { SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "../i18n";
import { fetchPublishedSite, type PublishedSite } from "../lib/publish-api";
import { isCloudEnabled } from "../lib/supabase";

interface PublishedViewerProps {
  slug: string;
}

export function PublishedViewer({ slug }: PublishedViewerProps) {
  const t = useT();
  const isDark = useTheme();
  const [site, setSite] = useState<PublishedSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!isCloudEnabled()) {
        setError(t.published.notFound);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPublishedSite(slug);
        if (cancelled) return;
        if (!data) {
          setSite(null);
          setError(t.published.notFound);
        } else {
          setSite(data);
        }
      } catch (e) {
        if (cancelled) return;
        setSite(null);
        setError(e instanceof Error ? e.message : t.published.notFound);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, t.published.notFound]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{t.published.loading}</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background px-6">
        <p className="text-sm text-muted-foreground">{error ?? t.published.notFound}</p>
        <a
          href="https://yaadalabs.com"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Built by Yaada Labs · +251940556969
        </a>
      </div>
    );
  }

  const sandpackFiles = Object.fromEntries(
    Object.entries(site.files).map(([path, content]) => [
      path.startsWith("/") ? path : `/${path}`,
      { code: content },
    ]),
  );

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <h1 className="truncate text-sm font-medium">{site.title || slug}</h1>
        <a
          href="https://yaadalabs.com"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {t.published.builtWith}
        </a>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        <SandpackProvider
          template={site.template as SandpackPredefinedTemplate}
          theme={isDark ? "dark" : "light"}
          files={sandpackFiles}
          style={{ height: "100%" }}
        >
          <SandpackLayout style={{ height: "100%" }}>
            <SandpackPreview
              showOpenInCodeSandbox={false}
              showRefreshButton
              style={{ height: "100%" }}
            />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}
