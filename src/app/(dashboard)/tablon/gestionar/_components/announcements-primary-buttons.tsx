"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnouncements } from "./announcements-provider";

export function AnnouncementsPrimaryButtons() {
  const { setOpen } = useAnnouncements();
  return (
    <Button onClick={() => setOpen("create")} size="sm">
      <Plus className="mr-2 h-4 w-4" />
      Nuevo comunicado
    </Button>
  );
}
