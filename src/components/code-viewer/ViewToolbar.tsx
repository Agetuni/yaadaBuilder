import {
  Eye,
  Code2,
  Monitor,
  Tablet,
  Smartphone,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useT } from "../../i18n";
import { UserProfileMenu } from "../UserProfileMenu";
import { PublishControl } from "./PublishControl";
import type { ProjectFiles } from "@/types";

export type ViewMode = "preview" | "code";
export type DeviceSize = "desktop" | "tablet" | "mobile";

interface ViewToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  deviceSize: DeviceSize;
  onDeviceSizeChange: (size: DeviceSize) => void;
  files: ProjectFiles;
  conversationId: string | null;
  title: string;
  template: string;
  isProjectInitialized: boolean;
}

async function downloadAsZip(files: ProjectFiles) {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "project.zip");
}

export function ViewToolbar({
  viewMode,
  onViewModeChange,
  deviceSize,
  onDeviceSizeChange,
  files,
  conversationId,
  title,
  template,
  isProjectInitialized,
}: ViewToolbarProps) {
  const t = useT();

  return (
    <div className="h-14 border-b bg-background px-2 sm:px-4 flex items-center gap-2 shrink-0 z-10 min-w-0 overflow-x-auto">
      <div className="flex items-center gap-1 p-0.5 rounded-lg border shrink-0">
        <Button
          variant={viewMode === "preview" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("preview")}
          className="gap-1.5 px-2 sm:px-3"
          title={t.toolbar.preview}
        >
          <Eye size={16} />
          <span className="hidden min-[480px]:inline">{t.toolbar.preview}</span>
        </Button>
        <Button
          variant={viewMode === "code" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("code")}
          className="gap-1.5 px-2 sm:px-3"
          title={t.toolbar.code}
        >
          <Code2 size={16} />
          <span className="hidden min-[480px]:inline">{t.toolbar.code}</span>
        </Button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
        {viewMode === "preview" && (
          <div className="flex items-center gap-1 p-0.5 rounded-lg border shrink-0">
            <Button
              variant={deviceSize === "desktop" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => onDeviceSizeChange("desktop")}
              title={t.toolbar.desktop}
            >
              <Monitor size={16} />
            </Button>
            <Button
              variant={deviceSize === "tablet" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => onDeviceSizeChange("tablet")}
              title={t.toolbar.tablet}
            >
              <Tablet size={16} />
            </Button>
            <Button
              variant={deviceSize === "mobile" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => onDeviceSizeChange("mobile")}
              title={t.toolbar.mobile}
            >
              <Smartphone size={16} />
            </Button>
          </div>
        )}

        <PublishControl
          conversationId={conversationId}
          title={title}
          template={template}
          files={files}
          isProjectInitialized={isProjectInitialized}
        />

        {viewMode === "code" && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => downloadAsZip(files)}
            title={t.toolbar.download}
          >
            <Download size={16} />
          </Button>
        )}

        <UserProfileMenu />
      </div>
    </div>
  );
}
