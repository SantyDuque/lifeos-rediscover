import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/lifeos/app-shell";
import { AuthGate } from "@/components/lifeos/auth-gate";
import { ErrorState, LoadingRows, Panel, PanelHeader } from "@/components/lifeos/states";
import { useTheme } from "@/components/lifeos/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sessionQuery, useSignOut, useUpdateProfile } from "@/lib/queries";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LifeOS" },
      {
        name: "description",
        content: "Profile, appearance, week start and review reminders for your LifeOS workspace.",
      },
      { property: "og:title", content: "Settings — LifeOS" },
      {
        property: "og:description",
        content: "Tune the appearance, schedule and reminders of your personal operating system.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AuthGate>
      <AppShell title="Settings" subtitle="Small preferences, applied everywhere">
        <SettingsBody />
      </AppShell>
    </AuthGate>
  );
}

function SettingsBody() {
  const session = useQuery(sessionQuery);
  const updateProfile = useUpdateProfile();
  const signOut = useSignOut();
  const { theme, setTheme } = useTheme();

  if (session.isPending) return <LoadingRows rows={5} />;
  if (session.isError) return <ErrorState error={session.error} onRetry={() => session.refetch()} />;
  if (session.data.status !== "signed-in") return null;

  const profile = session.data.profile;
  const save = (patch: Parameters<typeof updateProfile.mutate>[0]) =>
    updateProfile.mutate(patch, { onSuccess: () => toast.success("Preferences saved") });

  return (
    <div className="grid max-w-3xl gap-6">
      <Panel>
        <PanelHeader title="Profile" hint="Visible only to you" />
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            save({ name: String(data.get("name")), email: String(data.get("email")) });
          }}
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={profile.name} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={profile.email} className="mt-2" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel>
        <PanelHeader title="Appearance" hint="LifeOS is designed dark first" />
        <div className="space-y-4">
          <SettingRow
            label="Dark mode"
            hint="Light mode keeps the same palette at higher luminance."
          >
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(v) => {
                setTheme(v ? "dark" : "light");
                save({ theme: v ? "dark" : "light" });
              }}
              aria-label="Dark mode"
            />
          </SettingRow>
          <SettingRow label="Reduce motion" hint="Disables chart and transition animation.">
            <Switch
              checked={profile.reducedMotion}
              onCheckedChange={(v) => save({ reducedMotion: v })}
              aria-label="Reduce motion"
            />
          </SettingRow>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Schedule" hint="Affects weekly rollups and the review" />
        <div className="space-y-4">
          <SettingRow label="Week starts on">
            <Select
              value={String(profile.weekStartsOn)}
              onValueChange={(v) => save({ weekStartsOn: Number(v) as 0 | 1 })}
            >
              <SelectTrigger className="w-36" aria-label="Week starts on">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="0">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Daily review reminder">
            <Input
              type="time"
              defaultValue={profile.dailyReviewTime}
              onBlur={(e) => save({ dailyReviewTime: e.target.value })}
              className="w-36"
              aria-label="Daily review time"
            />
          </SettingRow>
          <SettingRow label="Timezone" hint="Taken from your account.">
            <span className="num text-sm text-muted-foreground">{profile.timezone}</span>
          </SettingRow>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Session" />
        <Button variant="outline" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
          {signOut.isPending ? "Signing out…" : "Sign out"}
        </Button>
      </Panel>
    </div>
  );
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
