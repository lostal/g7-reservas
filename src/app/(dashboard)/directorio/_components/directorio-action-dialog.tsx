"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  directorioFormSchema,
  type DirectorioForm,
  type DirectorioUser,
} from "./directorio-schema";

type DirectorioActionDialogProps = {
  currentRow?: DirectorioUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DirectorioActionDialog({
  currentRow,
  open,
  onOpenChange,
}: DirectorioActionDialogProps) {
  const isEdit = !!currentRow;

  const form = useForm<DirectorioForm>({
    resolver: zodResolver(directorioFormSchema),
    defaultValues: isEdit
      ? {
          nombre: currentRow.nombre,
          puesto: currentRow.puesto,
          ubicacion: currentRow.ubicacion,
          correo: currentRow.correo,
          telefono: currentRow.telefono,
        }
      : {
          nombre: "",
          puesto: "",
          ubicacion: "",
          correo: "",
          telefono: "",
        },
  });

  const onSubmit = (_values: DirectorioForm) => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>
            {isEdit ? "Editar usuario" : "Añadir usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos del usuario aquí."
              : "Rellena los datos del nuevo usuario."}{" "}
            Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="directorio-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ana García Martínez"
                      className="col-span-4"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="puesto"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">Puesto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Directora de Operaciones"
                      className="col-span-4"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ubicacion"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">Sede</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Madrid"
                      className="col-span-4"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="correo"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">Correo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="nombre@gruposiete.es"
                      className="col-span-4"
                      autoComplete="off"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">
                    Teléfono
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+34 91 000 00 00"
                      className="col-span-4"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" form="directorio-form">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
