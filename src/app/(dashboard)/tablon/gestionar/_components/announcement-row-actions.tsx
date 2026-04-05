"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Row } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { publishAnnouncement } from "../../actions";
import { useAnnouncements } from "./announcements-provider";
import { getAnnouncementStatus } from "./announcements-columns";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";

interface AnnouncementRowActionsProps {
  row: Row<AnnouncementWithAuthor>;
  currentUserId: string;
  currentUserRole: string;
}

export function AnnouncementRowActions({
  row,
  currentUserId,
  currentUserRole,
}: AnnouncementRowActionsProps) {
  const { setOpen, setCurrentRow } = useAnnouncements();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const announcement = row.original;
  const canEdit =
    announcement.createdBy === currentUserId || currentUserRole === "admin";
  const isDraft = getAnnouncementStatus(announcement) === "draft";

  const handlePublish = () => {
    startTransition(async () => {
      const result = await publishAnnouncement({ id: announcement.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Comunicado publicado");
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={pending}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(announcement);
              setOpen("edit");
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        )}
        {canEdit && isDraft && (
          <DropdownMenuItem onClick={handlePublish}>
            <Send className="mr-2 h-4 w-4" />
            Publicar
          </DropdownMenuItem>
        )}
        {canEdit && <DropdownMenuSeparator />}
        {canEdit && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setCurrentRow(announcement);
              setOpen("delete");
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
