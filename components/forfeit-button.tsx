"use client";

import { useTransition } from "react";
import { forfeitGameAction } from "@/app/actions/kickball";
import { Button } from "@/components/ui/button";

export function ForfeitButton({
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
      variant="outline"
      size={size}
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            "Record an opponent forfeit? SAGB will be credited with a 6–0 win, and any plays from this game will be cleared.",
          )
        ) {
          return;
        }
        startTransition(() => forfeitGameAction(gameId));
      }}
    >
      Opponent forfeit
    </Button>
  );
}
