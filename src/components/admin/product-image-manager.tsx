"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { ProductImageInput } from "@/domain/schemas";
import { ACCEPTED_IMAGE_TYPES, validateImageFile } from "@/domain/schemas";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/supabase/env";
import { AdminButton, EmptyBlock } from "./admin-ui";
import { TextInput } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const MAX_IMAGES = 12;

function extensionFor(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return "jpg";
  }
}

/**
 * Envio e organização das fotos do produto.
 *
 * O arquivo vai direto do navegador para o Supabase Storage, autenticado pela
 * sessão do administrador — o servidor não intermedia o binário. As linhas em
 * `product_images` só são gravadas quando o produto é salvo.
 */
export function ProductImageManager({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: ProductImageInput[];
  onChange: (images: ProductImageInput[]) => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const supabase = getBrowserSupabase();
    if (!supabase) {
      toast.error("Supabase não configurado.");
      return;
    }

    const files = Array.from(fileList);
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Máximo de ${MAX_IMAGES} imagens por produto.`);
      return;
    }

    setUploading(true);
    const uploaded: ProductImageInput[] = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.success) {
        toast.error(`${file.name}: ${validation.error.issues[0]?.message ?? "arquivo inválido"}`);
        continue;
      }

      // Nome único: evita colisão e impede que um upload sobrescreva outro.
      const path = `${productId}/${crypto.randomUUID()}.${extensionFor(file.type)}`;

      const { error } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });

      if (error) {
        toast.error(`Falha ao enviar ${file.name}.`);
        continue;
      }

      const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);

      uploaded.push({
        storagePath: path,
        publicUrl: data.publicUrl,
        altText: null,
        isCover: false,
        sortOrder: 0,
      });
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (uploaded.length === 0) return;

    const next = [...images, ...uploaded].map((image, index) => ({ ...image, sortOrder: index }));
    // A primeira imagem enviada vira a capa automaticamente.
    if (!next.some((image) => image.isCover) && next[0]) next[0].isCover = true;

    onChange(next);
    toast.success(
      uploaded.length === 1 ? "Imagem enviada." : `${uploaded.length} imagens enviadas.`,
    );
  };

  const update = (index: number, patch: Partial<ProductImageInput>) => {
    onChange(images.map((image, i) => (i === index ? { ...image, ...patch } : image)));
  };

  const setCover = (index: number) => {
    onChange(images.map((image, i) => ({ ...image, isCover: i === index })));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const current = next[index];
    const swapped = next[target];
    if (!current || !swapped) return;
    next[index] = swapped;
    next[target] = current;
    onChange(next.map((image, i) => ({ ...image, sortOrder: i })));
  };

  const remove = async (index: number) => {
    const image = images[index];
    if (!image) return;

    // Imagem ainda não persistida: o arquivo já está no Storage e ficaria órfão,
    // então é removido de imediato. As persistidas são limpas ao salvar.
    if (!image.id) {
      const supabase = getBrowserSupabase();
      await supabase?.storage.from(PRODUCT_IMAGE_BUCKET).remove([image.storagePath]);
    }

    const next = images
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, sortOrder: i }));

    if (!next.some((item) => item.isCover) && next[0]) next[0].isCover = true;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          id="product-images-input"
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          multiple
          onChange={(event) => void handleFiles(event.target.files)}
          className="sr-only"
        />
        <AdminButton
          as="label"
          htmlFor="product-images-input"
          variant="outline"
          aria-disabled={uploading}
        >
          {uploading ? "Enviando…" : "Adicionar imagens"}
        </AdminButton>
        <p className="text-xs text-ink/55">
          JPEG, PNG, WebP ou AVIF · até 5 MB cada · máximo {MAX_IMAGES}
        </p>
      </div>

      {images.length === 0 ? (
        <EmptyBlock
          title="Nenhuma imagem"
          description="Sem foto, o catálogo exibe um marcador tipográfico com a inicial do perfume."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <li
              key={image.storagePath}
              className={cn(
                "flex gap-4 border p-3",
                image.isCover ? "border-bronze" : "border-line",
              )}
            >
              <div className="relative size-24 shrink-0 overflow-hidden bg-ink/5">
                <Image
                  src={image.publicUrl}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-ink/55">
                    Texto alternativo
                  </span>
                  <TextInput
                    value={image.altText ?? ""}
                    placeholder="Descreva a imagem"
                    maxLength={160}
                    onChange={(event) =>
                      update(index, { altText: event.target.value === "" ? null : event.target.value })
                    }
                  />
                </label>

                <div className="flex flex-wrap gap-1">
                  <AdminButton
                    variant="ghost"
                    className="px-2 text-xs"
                    onClick={() => setCover(index)}
                    disabled={image.isCover}
                  >
                    {image.isCover ? "Capa" : "Definir capa"}
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    className="px-2 text-xs"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Mover imagem ${index + 1} para antes`}
                  >
                    ↑
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    className="px-2 text-xs"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label={`Mover imagem ${index + 1} para depois`}
                  >
                    ↓
                  </AdminButton>
                  <AdminButton
                    variant="danger"
                    className="px-2 text-xs"
                    onClick={() => void remove(index)}
                  >
                    Remover
                  </AdminButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
