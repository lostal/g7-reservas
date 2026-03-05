"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDirectorio } from "./directorio-provider";

export function DirectorioPrimaryButtons() {
  const { setOpen, isAdmin } = useDirectorio();

  if (!isAdmin) return null;

  return (
    <Button className="space-x-1" onClick={() => setOpen("add")}>
      <span>Añadir usuario</span>
      <UserPlus size={18} />
    </Button>
  );
}
