"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cancelLeaveRequest } from "../../actions";
import { useLeaveRequests } from "./leave-requests-provider";
import { LeaveRequestForm } from "./leave-request-form";

function CancelLeaveDialog() {
  const { open, setOpen, currentRow, setCurrentRow, onRefresh } =
    useLeaveRequests();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const closeDialog = () => {
    setOpen(null);
    setCurrentRow(null);
  };

  const handleCancel = () => {
    if (!currentRow) return;
    startTransition(async () => {
      const result = await cancelLeaveRequest({ id: currentRow.id });
      if (!result.success) {
        toast.error(result.error ?? "Error al cancelar la solicitud");
        return;
      }
      toast.success("Solicitud cancelada");
      closeDialog();
      onRefresh();
      router.refresh();
    });
  };

  return (
    <AlertDialog
      open={open === "cancel"}
      onOpenChange={(o) => !o && closeDialog()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar solicitud</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Seguro que quieres cancelar esta solicitud? Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Volver</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Cancelar solicitud
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditLeaveDrawer() {
  const { open, setOpen, currentRow, setCurrentRow } = useLeaveRequests();

  const closeDrawer = () => {
    setOpen(null);
    setCurrentRow(null);
  };

  return (
    <LeaveRequestForm
      open={open === "edit"}
      onOpenChange={(v) => !v && closeDrawer()}
      currentRow={currentRow ?? undefined}
    />
  );
}

function CreateLeaveDrawer() {
  const { open, setOpen } = useLeaveRequests();

  return (
    <LeaveRequestForm
      open={open === "create"}
      onOpenChange={(v) => !v && setOpen(null)}
    />
  );
}

export function LeaveRequestsDialogs() {
  return (
    <>
      <CreateLeaveDrawer />
      <EditLeaveDrawer />
      <CancelLeaveDialog />
    </>
  );
}
