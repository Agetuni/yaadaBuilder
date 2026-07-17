import { Button } from "@/components/ui/button";
import { useT } from "../../i18n";

interface EmptyStateProps {
  onSelectSuggestion: (text: string) => void;
}

export function EmptyState({ onSelectSuggestion }: EmptyStateProps) {
  const t = useT();
  const suggestions = [
    { icon: "📝", text: t.empty.suggestions.todo },
    { icon: "☁️", text: t.empty.suggestions.weather },
    { icon: "💡", text: t.empty.suggestions.calculator },
  ];

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center py-12 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <img className="w-10 h-10 rounded-lg" src="/logo.png" alt="Yaada Builder" />
      </div>
      <h3 className="relative font-display text-lg font-semibold mb-2">
        {t.empty.title}
      </h3>
      <p className="relative text-sm text-muted-foreground max-w-xs mb-6">
        {t.empty.desc}
      </p>
      <div className="relative space-y-2 w-full max-w-xs">
        {suggestions.map(({ icon, text }) => (
          <Button
            key={text}
            variant="outline"
            className="w-full justify-start h-auto py-2.5 text-left rounded-xl border-border bg-card hover:bg-accent"
            onClick={() => onSelectSuggestion(text)}
          >
            <span className="text-base mr-2">{icon}</span>
            <span className="text-sm">{text}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
