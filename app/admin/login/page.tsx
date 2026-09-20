import { redirect } from "next/navigation";
import { adminLoginAction } from "@/app/actions/kickball";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAdmin } from "@/lib/admin";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Scoring, lineups, and roster edits are PIN-protected. In local development the PIN is{" "}
          <code className="rounded bg-muted px-1">sagb</code> unless you set{" "}
          <code className="rounded bg-muted px-1">ADMIN_PIN</code>.
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <form action={adminLoginAction} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="pin">PIN</Label>
          <Input id="pin" name="pin" type="password" autoFocus required />
        </div>
        <Button className="w-full" type="submit">
          Sign in
        </Button>
      </form>
    </div>
  );
}
