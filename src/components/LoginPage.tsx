import { useState, type FormEvent } from "react";
import { useAuthStore } from "../store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const signIn = useAuthStore((s) => s.signIn);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      // error stored in auth store
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-0 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="relative w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <img className="h-7 w-7 rounded-md" src="/logo.png" alt="" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Yaada <span className="text-primary">Builder</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in with the account created for you in TinyHustle. There is no
            self-service signup.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
