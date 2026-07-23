import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";
import type { SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";
import { useTheme } from "../../hooks/useTheme";
import type { ProjectFiles } from "../../types";

interface MobilePreviewProps {
  files: ProjectFiles;
  template: string;
  sandpackKey: number;
}

export function MobilePreview({
  files,
  template,
  sandpackKey,
}: MobilePreviewProps) {
  const isDark = useTheme();
  const sandpackFiles = Object.fromEntries(
    Object.entries(files).map(([path, content]) => [
      path.startsWith("/") ? path : `/${path}`,
      { code: content },
    ]),
  );

  return (
    <div className="editor w-full max-w-full shrink-0 overflow-hidden rounded-xl border border-border bg-background">
      <div
        className="relative w-full overflow-hidden"
        style={{
          // Fit small phones/tablets (e.g. Galaxy A11) without shoving the prompt off-screen
          height: "min(52dvh, 420px)",
          minHeight: 220,
        }}
      >
        <SandpackProvider
          key={sandpackKey}
          template={template as SandpackPredefinedTemplate}
          theme={isDark ? "dark" : "light"}
          files={sandpackFiles}
          style={{ height: "100%", width: "100%" }}
        >
          <SandpackPreview
            showNavigator
            showOpenInCodeSandbox={false}
            showRefreshButton
            style={{ height: "100%", width: "100%" }}
          />
        </SandpackProvider>
      </div>
    </div>
  );
}
