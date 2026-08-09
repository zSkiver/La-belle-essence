"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/domain/product";
import {
  AVAILABILITY_LABELS,
  AVAILABILITY_STATUSES,
  BADGES,
  BADGE_LABELS,
  CONCENTRATIONS,
  CONCENTRATION_LABELS,
  FRAGRANCE_FAMILIES,
  FRAGRANCE_FAMILY_LABELS,
  GENDERS,
  GENDER_LABELS,
  type AvailabilityStatus,
} from "@/domain/enums";
import { centsToPriceInput, parsePriceToCents } from "@/domain/format";
import { productInputSchema, type ProductImageInput } from "@/domain/schemas";
import { slugify } from "@/lib/slug";
import { saveProductAction } from "@/app/admin/actions";
import { AdminButton, AdminCard } from "./admin-ui";
import { ProductImageManager } from "./product-image-manager";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

interface VariantDraft {
  key: string;
  id?: string;
  sizeMl: string;
  label: string;
  price: string;
  compareAtPrice: string;
  availabilityStatus: AvailabilityStatus;
}

interface FormDraft {
  name: string;
  slug: string;
  brand: string;
  shortDescription: string;
  description: string;
  gender: string;
  fragranceFamily: string;
  concentration: string;
  occasion: string;
  badge: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: string;
  notesTop: string;
  notesHeart: string;
  notesBase: string;
}

function emptyVariant(): VariantDraft {
  return {
    key: crypto.randomUUID(),
    sizeMl: "",
    label: "",
    price: "",
    compareAtPrice: "",
    availabilityStatus: "disponivel",
  };
}

function draftFromProduct(product: Product | null): FormDraft {
  const notes = (level: "top" | "heart" | "base") =>
    (product?.notes.find((entry) => entry.level === level)?.notes ?? []).join(", ");

  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    brand: product?.brand ?? "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    gender: product?.gender ?? "unissex",
    fragranceFamily: product?.fragranceFamily ?? "",
    concentration: product?.concentration ?? "",
    occasion: product?.occasion ?? "",
    badge: product?.badge ?? "",
    isFeatured: product?.isFeatured ?? false,
    isActive: product?.isActive ?? true,
    sortOrder: String(product?.sortOrder ?? 0),
    notesTop: notes("top"),
    notesHeart: notes("heart"),
    notesBase: notes("base"),
  };
}

function variantsFromProduct(product: Product | null): VariantDraft[] {
  if (!product || product.variants.length === 0) return [emptyVariant()];
  return product.variants.map((variant) => ({
    key: variant.id,
    id: variant.id,
    sizeMl: variant.sizeMl === null ? "" : String(variant.sizeMl),
    label: variant.label ?? "",
    price: centsToPriceInput(variant.priceCents),
    compareAtPrice: centsToPriceInput(variant.compareAtPriceCents),
    availabilityStatus: variant.availabilityStatus,
  }));
}

function parseNotes(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((note) => note.trim())
    .filter((note) => note !== "");
}

export function ProductForm({ product }: { product: Product | null }) {
  const router = useRouter();
  const toast = useToast();
  const [isSaving, startSaving] = useTransition();

  const isNew = product === null;
  // Para um produto novo o id é gerado antes do salvamento: assim as imagens já
  // podem ser enviadas para a pasta correta no Storage.
  const [productId] = useState(() => product?.id ?? crypto.randomUUID());

  const [draft, setDraft] = useState<FormDraft>(() => draftFromProduct(product));
  const [variants, setVariants] = useState<VariantDraft[]>(() => variantsFromProduct(product));
  const [images, setImages] = useState<ProductImageInput[]>(() =>
    (product?.images ?? []).map((image, index) => ({
      id: image.id,
      storagePath: image.storagePath,
      publicUrl: image.publicUrl,
      altText: image.altText,
      isCover: image.isCover,
      sortOrder: index,
    })),
  );

  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof FormDraft>(key: K, value: FormDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleNameChange = (value: string) => {
    setDraft((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : slugify(value),
    }));
  };

  const setVariant = (key: string, patch: Partial<VariantDraft>) => {
    setVariants((current) =>
      current.map((variant) => (variant.key === key ? { ...variant, ...patch } : variant)),
    );
  };

  const payload = useMemo(
    () => ({
      name: draft.name,
      slug: draft.slug,
      brand: draft.brand,
      shortDescription: draft.shortDescription,
      description: draft.description,
      gender: draft.gender,
      fragranceFamily: draft.fragranceFamily,
      concentration: draft.concentration,
      occasion: draft.occasion,
      badge: draft.badge,
      isFeatured: draft.isFeatured,
      isActive: draft.isActive,
      sortOrder: Number.parseInt(draft.sortOrder, 10) || 0,
      notes: {
        top: parseNotes(draft.notesTop),
        heart: parseNotes(draft.notesHeart),
        base: parseNotes(draft.notesBase),
      },
      variants: variants.map((variant, index) => ({
        ...(variant.id ? { id: variant.id } : {}),
        sizeMl: variant.sizeMl.trim() === "" ? null : Number.parseInt(variant.sizeMl, 10),
        label: variant.label,
        priceCents: parsePriceToCents(variant.price) ?? 0,
        compareAtPriceCents:
          variant.compareAtPrice.trim() === "" ? null : parsePriceToCents(variant.compareAtPrice),
        availabilityStatus: variant.availabilityStatus,
        sortOrder: index,
      })),
    }),
    [draft, variants],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const parsed = productInputSchema.safeParse(payload);
    if (!parsed.success) {
      const collected: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (!collected[path]) collected[path] = issue.message;
      }
      setErrors(collected);
      setFormError("Confira os campos destacados.");
      return;
    }

    setErrors({});

    startSaving(async () => {
      const result = await saveProductAction({
        id: productId,
        isNew,
        payload,
        images: images.map((image, index) => ({ ...image, sortOrder: index })),
      });

      if (!result.ok) {
        setFormError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(isNew ? "Perfume cadastrado." : "Alterações salvas.");
      router.push("/admin/produtos");
      router.refresh();
    });
  };

  const variantError = (index: number, field: string) =>
    errors[`variants.${index}.${field}`] ?? undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <AdminCard title="Identificação">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome" error={errors.name} required className="sm:col-span-2">
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={draft.name}
                onChange={(event) => handleNameChange(event.target.value)}
              />
            )}
          </Field>

          <Field
            label="Slug"
            error={errors.slug}
            hint="Endereço do produto no link compartilhável."
            required
          >
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={draft.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  set("slug", event.target.value);
                }}
                onBlur={(event) => set("slug", slugify(event.target.value))}
              />
            )}
          </Field>

          <Field label="Marca" error={errors.brand} required>
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={draft.brand}
                onChange={(event) => set("brand", event.target.value)}
              />
            )}
          </Field>

          <Field
            label="Descrição curta"
            error={errors.shortDescription}
            hint="Uma frase, exibida no card e no topo dos detalhes."
            className="sm:col-span-2"
          >
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                maxLength={180}
                value={draft.shortDescription}
                onChange={(event) => set("shortDescription", event.target.value)}
              />
            )}
          </Field>

          <Field label="Descrição completa" error={errors.description} className="sm:col-span-2">
            {({ id, describedBy, invalid }) => (
              <TextArea
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                maxLength={4000}
                value={draft.description}
                onChange={(event) => set("description", event.target.value)}
              />
            )}
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Classificação">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Gênero" error={errors.gender} required>
            {({ id, describedBy, invalid }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={draft.gender}
                onChange={(event) => set("gender", event.target.value)}
              >
                {GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {GENDER_LABELS[gender]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Família olfativa" error={errors.fragranceFamily}>
            {({ id, describedBy, invalid }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={draft.fragranceFamily}
                onChange={(event) => set("fragranceFamily", event.target.value)}
              >
                <option value="">Não informar</option>
                {FRAGRANCE_FAMILIES.map((family) => (
                  <option key={family} value={family}>
                    {FRAGRANCE_FAMILY_LABELS[family]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Concentração" error={errors.concentration}>
            {({ id, describedBy, invalid }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={draft.concentration}
                onChange={(event) => set("concentration", event.target.value)}
              >
                <option value="">Não informar</option>
                {CONCENTRATIONS.map((concentration) => (
                  <option key={concentration} value={concentration}>
                    {CONCENTRATION_LABELS[concentration]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label="Ocasião ou sensação"
            error={errors.occasion}
            hint="Ex.: noite e encontros."
          >
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                maxLength={120}
                value={draft.occasion}
                onChange={(event) => set("occasion", event.target.value)}
              />
            )}
          </Field>

          <Field label="Selo" error={errors.badge}>
            {({ id, describedBy, invalid }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={draft.badge}
                onChange={(event) => set("badge", event.target.value)}
              >
                <option value="">Sem selo</option>
                {BADGES.map((badge) => (
                  <option key={badge} value={badge}>
                    {BADGE_LABELS[badge]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label="Ordem de exibição"
            error={errors.sortOrder}
            hint="Menor aparece primeiro."
          >
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                type="number"
                min={0}
                max={9999}
                value={draft.sortOrder}
                onChange={(event) => set("sortOrder", event.target.value)}
              />
            )}
          </Field>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
          <Checkbox
            label="Ativo"
            description="Produtos inativos não aparecem no site."
            checked={draft.isActive}
            onChange={(event) => set("isActive", event.target.checked)}
          />
          <Checkbox
            label="Destaque"
            description="Aparece na vitrine de destaques da página inicial."
            checked={draft.isFeatured}
            onChange={(event) => set("isFeatured", event.target.checked)}
          />
        </div>
      </AdminCard>

      <AdminCard title="Pirâmide olfativa">
        <div className="grid gap-5 lg:grid-cols-3">
          <Field label="Notas de topo" error={errors["notes.top"]} hint="Separe por vírgula.">
            {({ id, describedBy, invalid }) => (
              <TextArea
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                className="min-h-20"
                value={draft.notesTop}
                onChange={(event) => set("notesTop", event.target.value)}
              />
            )}
          </Field>
          <Field label="Notas de coração" error={errors["notes.heart"]} hint="Separe por vírgula.">
            {({ id, describedBy, invalid }) => (
              <TextArea
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                className="min-h-20"
                value={draft.notesHeart}
                onChange={(event) => set("notesHeart", event.target.value)}
              />
            )}
          </Field>
          <Field label="Notas de fundo" error={errors["notes.base"]} hint="Separe por vírgula.">
            {({ id, describedBy, invalid }) => (
              <TextArea
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                className="min-h-20"
                value={draft.notesBase}
                onChange={(event) => set("notesBase", event.target.value)}
              />
            )}
          </Field>
        </div>
      </AdminCard>

      <AdminCard
        title="Volumes e preços"
        actions={
          <AdminButton
            variant="outline"
            onClick={() => setVariants((current) => [...current, emptyVariant()])}
          >
            Adicionar volume
          </AdminButton>
        }
      >
        {errors.variants ? (
          <p role="alert" className="mb-4 text-sm font-medium text-danger">
            {errors.variants}
          </p>
        ) : null}

        <ul className="flex flex-col gap-5">
          {variants.map((variant, index) => (
            <li key={variant.key} className="border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-ink/55">
                  Volume {index + 1}
                </h3>
                <AdminButton
                  variant="danger"
                  className="px-3 text-xs"
                  disabled={variants.length === 1}
                  onClick={() =>
                    setVariants((current) => current.filter((item) => item.key !== variant.key))
                  }
                >
                  Remover
                </AdminButton>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Volume (ml)" error={variantError(index, "sizeMl")}>
                  {({ id, describedBy, invalid }) => (
                    <TextInput
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      type="number"
                      min={1}
                      max={2000}
                      value={variant.sizeMl}
                      onChange={(event) => setVariant(variant.key, { sizeMl: event.target.value })}
                    />
                  )}
                </Field>

                <Field
                  label="Rótulo"
                  error={variantError(index, "label")}
                  hint="Use quando não houver volume em ml."
                >
                  {({ id, describedBy, invalid }) => (
                    <TextInput
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      maxLength={40}
                      value={variant.label}
                      onChange={(event) => setVariant(variant.key, { label: event.target.value })}
                    />
                  )}
                </Field>

                <Field label="Preço (R$)" error={variantError(index, "priceCents")} required>
                  {({ id, describedBy, invalid }) => (
                    <TextInput
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      inputMode="decimal"
                      placeholder="289,90"
                      value={variant.price}
                      onChange={(event) => setVariant(variant.key, { price: event.target.value })}
                    />
                  )}
                </Field>

                <Field label="Preço anterior (R$)" error={variantError(index, "compareAtPriceCents")}>
                  {({ id, describedBy, invalid }) => (
                    <TextInput
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      inputMode="decimal"
                      value={variant.compareAtPrice}
                      onChange={(event) =>
                        setVariant(variant.key, { compareAtPrice: event.target.value })
                      }
                    />
                  )}
                </Field>

                <Field label="Disponibilidade" error={variantError(index, "availabilityStatus")}>
                  {({ id, describedBy, invalid }) => (
                    <Select
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      value={variant.availabilityStatus}
                      onChange={(event) =>
                        setVariant(variant.key, {
                          availabilityStatus: event.target.value as AvailabilityStatus,
                        })
                      }
                    >
                      {AVAILABILITY_STATUSES.map((availability) => (
                        <option key={availability} value={availability}>
                          {AVAILABILITY_LABELS[availability]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>

              </div>
            </li>
          ))}
        </ul>
      </AdminCard>

      <AdminCard title="Imagens">
        <ProductImageManager productId={productId} images={images} onChange={setImages} />
      </AdminCard>


      {formError ? (
        <p role="alert" className="border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <AdminButton as={Link} href="/admin/produtos" variant="outline">
          Cancelar
        </AdminButton>
        <AdminButton type="submit" disabled={isSaving}>
          {isSaving ? "Salvando…" : isNew ? "Cadastrar perfume" : "Salvar alterações"}
        </AdminButton>
      </div>
    </form>
  );
}
