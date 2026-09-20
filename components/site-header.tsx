import Link from "next/link";
import { TEAM_NAME } from "@/lib/kickball/labels";
import { adminLogoutAction } from "@/app/actions/kickball";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function SiteHeader({ admin }: { admin: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-baseline gap-2 font-semibold tracking-tight">
          <span className="text-primary">{TEAM_NAME}</span>
          <span className="text-sm font-medium text-muted-foreground">Kickball</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link className="rounded-md px-3 py-1.5 hover:bg-accent" href="/schedule">
            Schedule
          </Link>
          <Link className="rounded-md px-3 py-1.5 hover:bg-accent" href="/roster">
            Roster
          </Link>
          <Link className="rounded-md px-3 py-1.5 hover:bg-accent" href="/stats">
            Stats
          </Link>
          {admin ? (
            <>
              <Link className="rounded-md px-3 py-1.5 hover:bg-accent" href="/admin">
                Score
              </Link>
              <form action={adminLogoutAction}>
                <Button type="submit" size="sm" variant="ghost">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/login">Admin</Link>
            </Button>
          )}
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
