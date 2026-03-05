import { z } from "zod";

export const directorioUserSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  puesto: z.string(),
  ubicacion: z.string(),
  correo: z.string(),
  telefono: z.string(),
});

export type DirectorioUser = z.infer<typeof directorioUserSchema>;

export const directorioFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  puesto: z.string().min(1, "El puesto es obligatorio."),
  ubicacion: z.string().min(1, "La ubicación es obligatoria."),
  correo: z.string().email("El correo no es válido."),
  telefono: z.string().min(9, "El teléfono debe tener al menos 9 dígitos."),
});

export type DirectorioForm = z.infer<typeof directorioFormSchema>;
