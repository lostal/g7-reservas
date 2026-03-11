"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { type DirectorioUser } from "./directorio-schema";
import { deleteUser } from "@/app/(dashboard)/administracion/actions";

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
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteUser({ user_id: currentRow.id });
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`Usuario "${currentRow.nombre}" eliminado correctamente`);
    onOpenChange(false);
    router.refresh();
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      isLoading={isDeleting}
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
