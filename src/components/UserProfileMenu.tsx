import type { ReactNode } from "react";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "../store/auth";
import { useT } from "../i18n";

interface UserProfileMenuProps {
  /** Optional custom trigger; defaults to icon-only profile button. */
  trigger?: ReactNode;
}

/** User avatar button with profile menu (sign out). Hidden when not signed in. */
export function UserProfileMenu({ trigger }: UserProfileMenuProps = {}) {
  const t = useT();
  const cloudEnabled = useAuthStore((s) => s.cloudEnabled);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  if (!cloudEnabled || !user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            title={t.header.profile}
            aria-label={t.header.profile}
            className="h-8 w-8 shrink-0"
          >
            <User size={18} />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs text-muted-foreground">{t.header.profile}</p>
          <p className="text-sm font-medium truncate">
            {user.email ?? t.header.profile}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => void signOut()}
        >
          <LogOut size={14} />
          {t.header.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
