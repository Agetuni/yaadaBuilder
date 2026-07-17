import { useEffect, useState } from "react";
import {
  Eye,
  Code2,
  Monitor,
  Tablet,
  Smartphone,
  Download,
  Upload,
  Copy,
  Check,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useT } from "../../i18n";
import { useAuthStore } from "../../store/auth";
import { isCloudEnabled } from "../../lib/supabase";
import { UserProfileMenu } from "../UserProfileMenu";
import {
  fetchPublishedForConversation,
  isValidUuid,
  publishSite,
  publishedSiteUrl,
  unpublishSite,
} from "../../lib/publish-api";
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
  const user = useAuthStore((s) => s.user);
  const cloudEnabled = isCloudEnabled();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [slug, setSlug] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasFiles = Object.keys(files).length > 0;
  const canPublish =
    cloudEnabled &&
    !!user &&
    !!conversationId &&
    isProjectInitialized &&
    hasFiles;
  const shareUrl = slug ? publishedSiteUrl(slug) : null;

  useEffect(() => {
    if (!cloudEnabled || !conversationId) {
      setSlug(null);
      setClientId("");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const site = await fetchPublishedForConversation(conversationId);
        if (cancelled) return;
        if (site) {
          setSlug(site.slug);
          setClientId(site.clientId);
        } else {
          setSlug(null);
          setClientId("");
        }
      } catch {
        if (!cancelled) {
          setSlug(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cloudEnabled, conversationId]);

  const openPublishDialog = () => {
    setError(null);
    setCopied(false);
    setDialogOpen(true);
  };

  const handlePublish = async () => {
    if (!user || !conversationId) {
      setError(t.toolbar.publishSignIn);
      return;
    }
    const trimmed = clientId.trim();
    if (!trimmed) {
      setError(t.toolbar.clientUuidRequired);
      return;
    }
    if (!isValidUuid(trimmed)) {
      setError(t.toolbar.clientUuidInvalid);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const site = await publishSite({
        userId: user.id,
        clientId: trimmed,
        conversationId,
        title: title || "Untitled",
        template,
        files,
      });
      setSlug(site.slug);
      setClientId(site.clientId);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.toolbar.publishFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleUnpublish = async () => {
    if (!conversationId) return;
    setBusy(true);
    setError(null);
    try {
      await unpublishSite(conversationId);
      setSlug(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.toolbar.publishFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t.toolbar.copyFailed);
    }
  };

  return (
    <div className="h-14 border-b bg-background px-4 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-1 p-0.5 rounded-lg border">
        <Button
          variant={viewMode === "preview" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("preview")}
          className="gap-2"
        >
          <Eye size={16} />
          {t.toolbar.preview}
        </Button>
        <Button
          variant={viewMode === "code" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("code")}
          className="gap-2"
        >
          <Code2 size={16} />
          {t.toolbar.code}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {viewMode === "preview" && (
          <div className="flex items-center gap-1 p-0.5 rounded-lg border">
            <Button
              variant={deviceSize === "desktop" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => onDeviceSizeChange("desktop")}
              title={t.toolbar.desktop}
              className="desktop"
            >
              <Monitor size={16} />
            </Button>
            <Button
              variant={deviceSize === "tablet" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => onDeviceSizeChange("tablet")}
              title={t.toolbar.tablet}
              className="tablet"
            >
              <Tablet size={16} />
            </Button>
            <Button
              variant={deviceSize === "mobile" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => onDeviceSizeChange("mobile")}
              title={t.toolbar.mobile}
              className="mobile"
            >
              <Smartphone size={16} />
            </Button>
          </div>
        )}

        {cloudEnabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={openPublishDialog}
            disabled={!canPublish}
            className="gap-2"
            title={
              !user
                ? t.toolbar.publishSignIn
                : !hasFiles || !isProjectInitialized
                  ? t.toolbar.publishNeedProject
                  : slug
                    ? t.toolbar.update
                    : t.toolbar.publish
            }
          >
            <Upload size={16} />
            {slug ? t.toolbar.update : t.toolbar.publish}
          </Button>
        )}

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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {slug ? t.toolbar.updateTitle : t.toolbar.publishTitle}
            </DialogTitle>
            <DialogDescription>
              {t.toolbar.publishDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="client-uuid">{t.toolbar.clientUuid}</Label>
              <Input
                id="client-uuid"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder={t.toolbar.clientUuidPlaceholder}
                disabled={busy}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {shareUrl && (
              <div className="grid gap-2">
                <Label>{t.toolbar.shareUrl}</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => void handleCopy()}
                    title={t.toolbar.copyLink}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {slug && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive gap-2 mr-auto"
                disabled={busy}
                onClick={() => void handleUnpublish()}
              >
                <Trash2 size={16} />
                {t.toolbar.unpublish}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setDialogOpen(false)}
            >
              {t.toolbar.close}
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void handlePublish()}
              className="gap-2"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {slug ? t.toolbar.update : t.toolbar.publish}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
