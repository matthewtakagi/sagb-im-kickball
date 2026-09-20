"use client";

import { useTransition } from "react";
import { finalizeGameAction } from "@/app/actions/kickball";
import { Button } from "@/components/ui/button";

export function EndGameButton({
  gameId,
  size = "sm",
}: {
  gameId: string;
  size?: "sm" | "default";
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      disabled={pending}
      onClick={() => {
        if (!confirm("End this game now? The current score will be recorded as final.")) return;
        startTransition(() => finalizeGameAction(gameId));
      }}
    >
      End game
    </Button>
  );
}
