/**
 * AppSidebar Component
 *
 * Main sidebar using shadcn/ui Sidebar with data-driven navigation.
 * Filters nav items based on user role.
 * Based on shadcn-admin AppSidebar pattern.
 */

"use client";

import { useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { getSidebarData } from "./data/sidebar-data";
import { AppTitle } from "./app-title";
import { EntitySwitcher } from "./entity-switcher";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";
import type { UserRole } from "@/lib/db/types";
import type { Entity } from "@/lib/queries/entities";

interface AppSidebarProps {
  role: UserRole;
  displayName: string;
  email: string;
  hasParkingSpot?: boolean;
  hasOfficeSpot?: boolean;
  /** Admin-only: list of entities for the switcher. Empty array = no migrations yet. */
  entities?: Entity[];
  activeEntityId?: string | null;
  /** Whether activeEntityId was read from the cookie (true) or used a fallback (false). */
  entityIdPersisted?: boolean;
  /** Non-admin: name of the user's assigned entity/sede. */
  entityName?: string;
  /** List of enabled module keys for the active/assigned entity. */
  enabledModules?: string[];
  /** Unread announcement count — shown as badge on Tablón sidebar item. */
  unreadAnnouncementsCount?: number;
}

export function AppSidebar({
  role,
  displayName,
  email,
  hasParkingSpot = false,
  hasOfficeSpot = false,
  entities,
  activeEntityId,
  entityIdPersisted = false,
  entityName,
  enabledModules,
  unreadAnnouncementsCount = 0,
}: AppSidebarProps) {
  const filteredNavGroups = useMemo(() => {
    const data = getSidebarData({
      hasParkingSpot,
      hasOfficeSpot,
      enabledModules,
      unreadAnnouncementsCount,
    });
    return data.navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => !item.roles || item.roles.includes(role)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [
    role,
    hasParkingSpot,
    hasOfficeSpot,
    enabledModules,
    unreadAnnouncementsCount,
  ]);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        {role === "admin" && entities !== undefined ? (
          <EntitySwitcher
            entities={entities}
            activeEntityId={activeEntityId ?? null}
            entityIdPersisted={entityIdPersisted}
          />
        ) : (
          <AppTitle entityName={entityName} />
        )}
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser displayName={displayName} email={email} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
