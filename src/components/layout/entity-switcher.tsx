"use client";

/**
 * EntitySwitcher Component
 *
 * Visible solo para admins. Muestra el contexto de sede activa en la cabecera
 * de la sidebar y un dropdown para cambiar entre sedes.
 * La sede activa se persiste en cookie: active-entity-id (7 días).
 *
 * Diseño idéntico al team-switcher de shadcn-admin.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, PlusCircle } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  setActiveEntityAction,
  initActiveEntityCookie,
} from "./entity-switcher-actions";
import type { Entity } from "@/lib/queries/entities";

interface EntitySwitcherProps {
  entities: Entity[];
  activeEntityId: string | null;
  /** Whether activeEntityId was read from the cookie. False = layout used entities[0] fallback. */
  entityIdPersisted?: boolean;
}

export function EntitySwitcher({
  entities,
  activeEntityId,
  entityIdPersisted = false,
}: EntitySwitcherProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const activeEntity =
    entities.find((e) => e.id === activeEntityId) ?? entities[0] ?? null;

  // Si el layout usó entities[0] como fallback (la cookie no existía),
  // persiste la sede en la cookie silenciosamente para que los Server Actions
  // posteriores lean el entityId correcto en lugar de null.
  useEffect(() => {
    if (!entityIdPersisted && activeEntity) {
      initActiveEntityCookie(activeEntity.id);
    }
    // Solo en el primer render — las dependencias no deben cambiar en condiciones normales
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitch = (entityId: string) => {
    startTransition(async () => {
      await setActiveEntityAction(entityId);
      router.refresh();
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Logo siempre visible — igual que AppTitle */}
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                <Image
                  src="/favicon-512x512.png"
                  alt="GRUPOSIETE"
                  width={32}
                  height={32}
                  className="size-8 rounded-lg"
                />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-bold">GRUPOSIETE</span>
                <span className="text-muted-foreground truncate text-xs">
                  {activeEntity?.name ?? "Todas las sedes"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Sedes
            </DropdownMenuLabel>

            {entities.length === 0 ? (
              <DropdownMenuItem disabled className="gap-2 p-2">
                <span className="text-muted-foreground text-sm">
                  Sin sedes — añade una desde Gestionar sedes
                </span>
              </DropdownMenuItem>
            ) : (
              entities.map((entity, idx) => (
                <DropdownMenuItem
                  key={entity.id}
                  onClick={() => handleSwitch(entity.id)}
                  className="gap-2 p-2"
                >
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-6 items-center justify-center rounded-sm text-xs font-bold">
                    {entity.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <span className="flex-1 truncate">{entity.name}</span>
                  {entity.id === activeEntity?.id && (
                    <Check className="ml-auto size-3.5" />
                  )}
                  {idx < 9 && (
                    <DropdownMenuShortcut>⌘{idx + 1}</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              ))
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" asChild>
              <Link href="/administracion/entidades">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <PlusCircle className="size-4" />
                </div>
                <span className="text-muted-foreground font-medium">
                  Gestionar sedes
                </span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
