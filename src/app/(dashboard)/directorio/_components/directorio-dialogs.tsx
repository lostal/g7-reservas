"use client";

import { useDirectorio } from "./directorio-provider";
import { DirectorioActionDialog } from "./directorio-action-dialog";
import { DirectorioDeleteDialog } from "./directorio-delete-dialog";

export function DirectorioDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useDirectorio();

  return (
    <>
      <DirectorioActionDialog
        key="directorio-add"
        open={open === "add"}
        onOpenChange={() => setOpen("add")}
      />

      {currentRow && (
        <>
          <DirectorioActionDialog
            key={`directorio-edit-${currentRow.id}`}
            open={open === "edit"}
            onOpenChange={() => {
              setOpen("edit");
              setTimeout(() => setCurrentRow(null), 500);
            }}
            currentRow={currentRow}
          />

          <DirectorioDeleteDialog
            key={`directorio-delete-${currentRow.id}`}
            open={open === "delete"}
            onOpenChange={() => {
              setOpen("delete");
              setTimeout(() => setCurrentRow(null), 500);
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  );
}
