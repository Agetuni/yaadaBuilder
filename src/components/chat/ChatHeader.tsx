import { PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationStore, DEFAULT_TITLE } from "../../store/conversation";
import { useT } from "../../i18n";

interface ChatHeaderProps {
  isGenerating: boolean;
  onToggleSessionList: () => void;
}

export function ChatHeader({ onToggleSessionList }: ChatHeaderProps) {
  const t = useT();
  const rawTitle = useConversationStore((s) =>
    s.activeId ? (s.conversations[s.activeId]?.title ?? null) : null,
  );
  const title =
    !rawTitle || rawTitle === DEFAULT_TITLE ? t.chat.newApp : rawTitle;

  return (
    <div className="h-14 px-3 border-b bg-background flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSessionList}
          title={t.header.sessions}
          className="h-8 w-8 shrink-0"
        >
          <PanelLeftOpen size={18} />
        </Button>
        <img
          className="h-7 w-7 rounded-md shrink-0"
          src="/logo.png"
          alt=""
        />
        <span className="font-display text-sm font-semibold tracking-tight truncate">
          Yaada <span className="text-primary">Builder</span>
        </span>
      </div>
      <span className="text-sm font-medium truncate px-2 flex-1 text-center">
        {title}
      </span>
      <div className="w-8 shrink-0" aria-hidden />
    </div>
  );
}
