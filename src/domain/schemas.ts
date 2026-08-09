import { z } from "zod";
import {
  AVAILABILITY_STATUSES,
  BADGES,
  CONCENTRATIONS,
  FRAGRANCE_FAMILIES,
  GENDERS,
} from "./enums";

/** Aceita string vazia como "não informado" — os formulários enviam "". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .default(null);

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.enum(values), z.literal("")])
    .transform((value) => (value === "" ? null : (value as T[number])))
    .nullable()
    .default(null);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const variantInputSchema = z
  .object({
    id: z.uuid().optional(),
    sizeMl: z
      .number()
      .int("Informe o volume em números inteiros.")
      .positive("O volume precisa ser maior que zero.")
      .max(2000, "Volume acima do esperado.")
      .nullable()
      .default(null),
    label: optionalText(40),
    priceCents: z
      .number()
      .int()
      .positive("Informe um preço maior que zero.")
      .max(100_000_00, "Preço acima do limite permitido."),
    compareAtPriceCents: z.number().int().positive().max(100_000_00).nullable().default(null),
    availabilityStatus: z.enum(AVAILABILITY_STATUSES),
    sortOrder: z.number().int().min(0).default(0),
  })
  .refine((variant) => variant.sizeMl !== null || variant.label !== null, {
    message: "Informe o volume em ml ou um rótulo para a variante.",
    path: ["sizeMl"],
  })
  .refine(
    (variant) =>
      variant.compareAtPriceCents === null || variant.compareAtPriceCents > variant.priceCents,
    {
      message: "O preço anterior precisa ser maior que o preço atual.",
      path: ["compareAtPriceCents"],
    },
  );

export type VariantInput = z.infer<typeof variantInputSchema>;

const notesSchema = z
  .array(z.string().trim().min(1).max(60))
  .max(20, "Máximo de 20 notas por nível.")
  .default([]);

export const productImageInputSchema = z.object({
  id: z.uuid().optional(),
  storagePath: z.string().trim().min(1).max(300),
  publicUrl: z.url().max(1000),
  altText: optionalText(160),
  isCover: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export type ProductImageInput = z.infer<typeof productImageInputSchema>;

export const productInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do perfume.")
    .max(120, "Use no máximo 120 caracteres."),
  slug: z
    .string()
    .trim()
    .min(2, "Informe o slug.")
    .max(80, "Use no máximo 80 caracteres.")
    .regex(SLUG_PATTERN, "Use apenas letras minúsculas, números e hífens."),
  brand: z.string().trim().min(1, "Informe a marca.").max(80, "Use no máximo 80 caracteres."),
  shortDescription: optionalText(180),
  description: optionalText(4000),
  gender: z.enum(GENDERS, { message: "Selecione o gênero." }),
  fragranceFamily: optionalEnum(FRAGRANCE_FAMILIES),
  concentration: optionalEnum(CONCENTRATIONS),
  occasion: optionalText(120),
  badge: optionalEnum(BADGES),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  notes: z
    .object({
      top: notesSchema,
      heart: notesSchema,
      base: notesSchema,
    })
    .default({ top: [], heart: [], base: [] }),
  variants: z
    .array(variantInputSchema)
    .min(1, "Cadastre ao menos uma variante de volume.")
    .max(12, "Máximo de 12 variantes por produto."),
});

export type ProductInput = z.input<typeof productInputSchema>;
export type ProductPayload = z.output<typeof productInputSchema>;

/* -------------------------------------------------------------------------- */
/* Destaques e ofertas por tempo                                              */
/* -------------------------------------------------------------------------- */

const optionalInstant = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .refine((value) => value === null || !Number.isNaN(new Date(value).getTime()), {
    message: "Data inválida.",
  });

export const offerWindowSchema = z
  .object({
    id: z.uuid(),
    isFeatured: z.boolean().optional(),
    offerStartsAt: optionalInstant,
    offerEndsAt: optionalInstant,
  })
  .refine(
    (value) =>
      value.offerStartsAt === null ||
      value.offerEndsAt === null ||
      new Date(value.offerEndsAt).getTime() > new Date(value.offerStartsAt).getTime(),
    {
      message: "O fim da oferta precisa ser depois do início.",
      path: ["offerEndsAt"],
    },
  );

export type OfferWindowInput = z.infer<typeof offerWindowSchema>;

export const credentialsSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

export const passwordRecoverySchema = z.object({
  email: z.email("Informe um e-mail válido."),
});

/* -------------------------------------------------------------------------- */
/* Upload de imagens                                                          */
/* -------------------------------------------------------------------------- */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

export const imageUploadSchema = z.object({
  size: z.number().max(MAX_IMAGE_BYTES, "A imagem precisa ter no máximo 5 MB."),
  type: z.enum(ACCEPTED_IMAGE_TYPES, {
    message: "Formato não suportado. Envie JPEG, PNG, WebP ou AVIF.",
  }),
});

export function validateImageFile(file: { size: number; type: string }) {
  return imageUploadSchema.safeParse({ size: file.size, type: file.type });
}

/* -------------------------------------------------------------------------- */
/* Registro de cliques de WhatsApp                                            */
/* -------------------------------------------------------------------------- */

export const whatsappClickSchema = z.object({
  productId: z.uuid().nullish(),
  variantId: z.uuid().nullish(),
  storeUnit: z.enum(["buriti", "centro"]),
  source: z.string().trim().max(40),
  utmSource: z.string().trim().max(120).nullish(),
  utmMedium: z.string().trim().max(120).nullish(),
  utmCampaign: z.string().trim().max(120).nullish(),
  referrer: z.string().trim().max(500).nullish(),
});

export type WhatsappClickInput = z.infer<typeof whatsappClickSchema>;
