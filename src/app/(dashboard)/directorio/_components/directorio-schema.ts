import { z } from "zod/v4";

export const directorioUserSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  correo: z.string(),
  rol: z.string(),
  puesto: z.string(),
  telefono: z.string(),
  entity_id: z.string().nullable(),
  entity_name: z.string(),
});

export type DirectorioUser = z.infer<typeof directorioUserSchema>;

export const directorioFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  correo: z.string().email("El correo no es válido."),
  puesto: z.string(),
  telefono: z.string(),
  entity_id: z.string(),
});

export type DirectorioForm = z.infer<typeof directorioFormSchema>;
