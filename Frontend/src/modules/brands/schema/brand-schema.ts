import { z } from "zod"

/**
 * Shared by both create and edit — the Premium UI Engineer's spec never
 * exposes `status` as a form field (it's a separate row-action ->
 * AlertDialog), so this schema only ever covers name/logo/description.
 * Empty optional strings are transformed to `undefined` so the API layer
 * never sends `""` to the backend for an untouched optional field.
 */
export const brandFormSchema = z.object({
  name: z.string().trim().min(2, "nameRequired").max(120, "nameTooLong"),
  logo: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https?:\/\/.+/i.test(value), {
      message: "logoInvalid",
    })
    .optional()
    .transform((value) => (value ? value : undefined)),
  description: z
    .string()
    .trim()
    .max(500, "descriptionTooLong")
    .optional()
    .transform((value) => (value ? value : undefined)),
})

export type BrandFormInput = z.input<typeof brandFormSchema>
export type BrandFormOutput = z.output<typeof brandFormSchema>
