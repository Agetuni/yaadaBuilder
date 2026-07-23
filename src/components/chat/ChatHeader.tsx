import { History, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationStore, DEFAULT_TITLE } from "../../store/conversation";
import { useAuthStore } from "../../store/auth";
import { useT } from "../../i18n";
import { PublishControl } from "../code-viewer/PublishControl";
import { UserProfileMenu } from "../UserProfileMenu";
import type { ProjectFiles } from "../../types";

interface ChatHeaderProps {
  isGenerating: boolean;
  onToggleSessionList: () => void;
  showPublish?: boolean;
  conversationId?: string | null;
  title?: string;
  template?: string;
  files?: ProjectFiles;
  isProjectInitialized?: boolean;
}

export function ChatHeader({
  onToggleSessionList,
  showPublish = false,
  conversationId = null,
  title: projectTitle = "",
  template = "",
  files = {},
  isProjectInitialized = false,
}: ChatHeaderProps) {
  const t = useT();
  const cloudEnabled = useAuthStore((s) => s.cloudEnabled);
  const user = useAuthStore((s) => s.user);
  const rawTitle = useConversationStore((s) =>
    s.activeId ? (s.conversations[s.activeId]?.title ?? null) : null,
  );
  const title =
    !rawTitle || rawTitle === DEFAULT_TITLE ? t.chat.newApp : rawTitle;
  const showAccount = cloudEnabled && !!user;

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-1.5 border-b border-border bg-background/95 px-2 backdrop-blur-sm sm:gap-2 sm:px-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onToggleSessionList}
        title={t.header.sessions}
        aria-label={t.header.sessions}
        className="h-9 shrink-0 gap-1.5 px-2 sm:px-2.5"
      >
        <History size={16} />
        <span className="text-sm font-medium">{t.header.sessions}</span>
      </Button>

      <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 md:flex">
        <img
          className="h-7 w-7 shrink-0 rounded-md"
          src="/logo.png"
          alt=""
        />
        <span className="font-display truncate text-sm font-semibold tracking-tight">
          Yaada <span className="text-primary">Builder</span>
        </span>
        <span className="truncate px-2 text-sm font-medium text-muted-foreground">
          {title}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        {showPublish && (
          <PublishControl
            conversationId={conversationId}
            title={projectTitle}
            template={template}
            files={files}
            isProjectInitialized={isProjectInitialized}
            compact
          />
        )}
        {showAccount ? (
          <UserProfileMenu
            trigger={
              <Button
                type="button"
                variant="outline"
                size="sm"
                title={t.header.profile}
                aria-label={t.header.profile}
                className="h-9 shrink-0 gap-1.5 px-2 sm:px-2.5"
              >
                <User size={16} />
                <span className="text-sm font-medium">{t.header.profile}</span>
              </Button>
            }
          />
        ) : null}
      </div>
    </header>
  );
}
