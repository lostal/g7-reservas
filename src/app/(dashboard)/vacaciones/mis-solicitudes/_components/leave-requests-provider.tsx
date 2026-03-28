"use client";

import * as React from "react";
import useDialogState from "@/hooks/use-dialog-state";
import type { LeaveRequestWithDetails } from "@/lib/queries/leave-requests";

type LeaveDialogType = "create" | "edit" | "cancel";

interface LeaveContextType {
  open: LeaveDialogType | null;
  setOpen: (str: LeaveDialogType | null) => void;
  currentRow: LeaveRequestWithDetails | null;
  setCurrentRow: React.Dispatch<
    React.SetStateAction<LeaveRequestWithDetails | null>
  >;
  onRefresh: () => void;
  currentUserId: string;
}

const LeaveContext = React.createContext<LeaveContextType | null>(null);

interface LeaveProviderProps {
  children: React.ReactNode;
  onRefresh: () => void;
  currentUserId: string;
}

export function LeaveRequestsProvider({
  children,
  onRefresh,
  currentUserId,
}: LeaveProviderProps) {
  const [open, setOpen] = useDialogState<LeaveDialogType>(null);
  const [currentRow, setCurrentRow] =
    React.useState<LeaveRequestWithDetails | null>(null);

  return (
    <LeaveContext
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        onRefresh,
        currentUserId,
      }}
    >
      {children}
    </LeaveContext>
  );
}

export function useLeaveRequests() {
  const ctx = React.useContext(LeaveContext);
  if (!ctx) {
    throw new Error(
      "useLeaveRequests debe usarse dentro de <LeaveRequestsProvider>"
    );
  }
  return ctx;
}
