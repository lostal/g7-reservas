import { z } from "zod/v4";

export const entidadSchema = z.object({
  id: z.string(),
  name: z.string(),
  short_code: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
});
export type Entidad = z.infer<typeof entidadSchema>;

export const entidadFormSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  short_code: z.string().min(2, "Mínimo 2 caracteres").max(10),
  is_active: z.boolean(),
});
export type EntidadForm = z.infer<typeof entidadFormSchema>;
