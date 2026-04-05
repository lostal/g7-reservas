"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, ChevronUp, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/tiptap-editor";
import { markAnnouncementRead } from "../actions";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";

interface AnnouncementWithRead extends AnnouncementWithAuthor {
  isRead: boolean;
}

interface AnnouncementsFeedProps {
  announcements: AnnouncementWithRead[];
}

export function AnnouncementsFeed({ announcements }: AnnouncementsFeedProps) {
  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Megaphone className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground text-sm">
          No hay comunicados publicados.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {announcements.map((announcement) => (
        <AnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
}

function AnnouncementCard({
  announcement,
}: {
  announcement: AnnouncementWithRead;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isRead, setIsRead] = useState(announcement.isRead);
  const [, startTransition] = useTransition();

  const toggle = () => {
    if (!expanded && !isRead) {
      setIsRead(true);
      startTransition(async () => {
        await markAnnouncementRead({ announcement_id: announcement.id });
      });
    }
    setExpanded((prev) => !prev);
  };

  const isGlobal = announcement.entityId === null;
  const isExpired =
    announcement.expiresAt && announcement.expiresAt < new Date();

  return (
    <Card className={cn("transition-all", !isRead && "border-primary/40")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            {!isRead && (
              <span className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full" />
            )}
            <div>
              <p
                className={cn(
                  "text-base leading-snug",
                  !isRead && "font-semibold"
                )}
              >
                {announcement.title}
              </p>
              <p className="text-muted-foreground text-xs">
                {announcement.authorName} ·{" "}
                {formatDistanceToNow(new Date(announcement.publishedAt!), {
                  addSuffix: true,
                  locale: es,
                })}
                {isGlobal && (
                  <span className="ml-2 rounded-full border px-1.5 py-0.5 text-[10px]">
                    Global
                  </span>
                )}
                {isExpired && (
                  <span className="text-muted-foreground ml-2 text-[10px]">
                    · Expirado
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={toggle}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="border-t pt-3">
            <TiptapEditor content={announcement.body} editable={false} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
