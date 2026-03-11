"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  directorioFormSchema,
  type DirectorioForm,
  type DirectorioUser,
} from "./directorio-schema";
import { useDirectorio } from "./directorio-provider";
import { updateDirectorioUser, createDirectorioUser } from "../actions";

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
  const { entities } = useDirectorio();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<DirectorioForm>({
    resolver: zodResolver(directorioFormSchema),
    defaultValues: isEdit
      ? {
          nombre: currentRow.nombre,
          correo: currentRow.correo,
          puesto: currentRow.puesto,
          telefono: currentRow.telefono,
          entity_id: currentRow.entity_id ?? "",
        }
      : {
          nombre: "",
          correo: "",
          puesto: "",
          telefono: "",
          entity_id: "",
        },
  });

  const NONE_SENTINEL = "__none__";

  const onSubmit = (values: DirectorioForm) => {
    startTransition(async () => {
      const entityIdValue =
        values.entity_id && values.entity_id !== NONE_SENTINEL
          ? values.entity_id
          : undefined;

      if (isEdit) {
        const result = await updateDirectorioUser({
          user_id: currentRow.id,
          nombre: values.nombre,
          puesto: values.puesto,
          telefono: values.telefono,
          entity_id: entityIdValue,
        });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Usuario actualizado correctamente");
      } else {
        const result = await createDirectorioUser({
          nombre: values.nombre,
          correo: values.correo,
          puesto: values.puesto,
          telefono: values.telefono,
          entity_id: entityIdValue,
        });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Usuario creado correctamente");
      }

      form.reset();
      onOpenChange(false);
      router.refresh();
    });
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
            {!isEdit && (
              <FormField
                control={form.control}
                name="correo"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">
                      Correo
                    </FormLabel>
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
            )}
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
              name="entity_id"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">Sede</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || NONE_SENTINEL}
                      onValueChange={(v) =>
                        field.onChange(v === NONE_SENTINEL ? "" : v)
                      }
                    >
                      <SelectTrigger className="col-span-4">
                        <SelectValue placeholder="Sin sede" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_SENTINEL}>Sin sede</SelectItem>
                        {entities.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
          <Button type="submit" form="directorio-form" disabled={pending}>
            {pending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
