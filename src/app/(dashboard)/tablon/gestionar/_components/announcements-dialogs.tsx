"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TiptapEditor } from "@/components/tiptap-editor";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../actions";
import { useAnnouncements } from "./announcements-provider";

// ─── Create Dialog ─────────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(1, "Título requerido").max(200),
  body: z.string().min(1, "El contenido no puede estar vacío"),
  publish: z.boolean().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

function CreateAnnouncementDialog() {
  const { open, setOpen, setCurrentRow } = useAnnouncements();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { title: "", body: "", publish: false },
  });

  const closeDialog = () => {
    setOpen(null);
    setCurrentRow(null);
    form.reset();
  };

  const onSubmit = (values: CreateForm) => {
    startTransition(async () => {
      const result = await createAnnouncement({
        title: values.title,
        body: values.body,
        publish: values.publish,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        values.publish
          ? "Comunicado publicado correctamente"
          : "Borrador guardado"
      );
      closeDialog();
      router.refresh();
    });
  };

  return (
    <Dialog open={open === "create"} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo comunicado</DialogTitle>
          <DialogDescription>
            Crea un nuevo comunicado para la sede. Puedes guardarlo como
            borrador o publicarlo directamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título del comunicado..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido</FormLabel>
                  <FormControl>
                    <TiptapEditor
                      content={field.value}
                      onChange={field.onChange}
                      placeholder="Escribe el contenido del comunicado..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="publish"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer font-normal">
                    Publicar ahora
                  </FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ───────────────────────────────────────────────────────────────

const editSchema = z.object({
  title: z.string().min(1, "Título requerido").max(200),
  body: z.string().min(1, "El contenido no puede estar vacío"),
  publish: z.boolean().optional(),
});
type EditForm = z.infer<typeof editSchema>;

function EditAnnouncementDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useAnnouncements();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: currentRow
      ? { title: currentRow.title, body: currentRow.body, publish: false }
      : { title: "", body: "", publish: false },
  });

  if (!currentRow) return null;

  const closeDialog = () => {
    setOpen(null);
    setCurrentRow(null);
  };

  const onSubmit = (values: EditForm) => {
    startTransition(async () => {
      const result = await updateAnnouncement({
        id: currentRow.id,
        title: values.title,
        body: values.body,
        publish: values.publish,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Comunicado actualizado");
      closeDialog();
      router.refresh();
    });
  };

  const isDraft = !currentRow.publishedAt;

  return (
    <Dialog open={open === "edit"} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar comunicado</DialogTitle>
          <DialogDescription>
            Modifica el contenido del comunicado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido</FormLabel>
                  <FormControl>
                    <TiptapEditor
                      key={currentRow.id}
                      content={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isDraft && (
              <FormField
                control={form.control}
                name="publish"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">
                      Publicar al guardar
                    </FormLabel>
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Dialog ─────────────────────────────────────────────────────────────

function DeleteAnnouncementDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useAnnouncements();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!currentRow) return null;

  const closeDialog = () => {
    setOpen(null);
    setCurrentRow(null);
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAnnouncement({ id: currentRow.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Comunicado eliminado");
      closeDialog();
      router.refresh();
    });
  };

  return (
    <Dialog open={open === "delete"} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar comunicado</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar{" "}
            <span className="font-medium">
              &ldquo;{currentRow.title}&rdquo;
            </span>
            ? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={closeDialog} disabled={pending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Composite export ──────────────────────────────────────────────────────────

export function AnnouncementsDialogs() {
  return (
    <>
      <CreateAnnouncementDialog />
      <EditAnnouncementDialog />
      <DeleteAnnouncementDialog />
    </>
  );
}
