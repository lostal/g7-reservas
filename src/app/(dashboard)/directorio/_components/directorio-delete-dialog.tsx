"use client";

import { AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { type DirectorioUser } from "./directorio-schema";

type DirectorioDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: DirectorioUser;
};

export function DirectorioDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: DirectorioDeleteDialogProps) {
  const handleDelete = () => {
    onOpenChange(false);
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      title={
        <span className="text-destructive">
          <AlertTriangle
            className="stroke-destructive me-1 inline-block"
            size={18}
          />{" "}
          Eliminar usuario
        </span>
      }
      desc={
        <p>
          ¿Seguro que quieres eliminar a{" "}
          <span className="font-bold">{currentRow.nombre}</span>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      }
      confirmText="Eliminar"
      destructive
    />
  );
}
