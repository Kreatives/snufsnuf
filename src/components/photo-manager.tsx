"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { updateLogoAction, addPhotoAction, removePhotoAction } from "@/lib/provider-actions";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

export function PhotoManager({
  providerId,
  logoUrl,
  photos,
}: {
  providerId: string;
  logoUrl: string | null;
  photos: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  async function upload(file: File): Promise<string | null> {
    const supabase = createClient();
    const path = `${providerId}/${uid()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("salon-media").upload(path, file);
    if (upErr) {
      setError(upErr.message);
      return null;
    }
    return supabase.storage.from("salon-media").getPublicUrl(path).data.publicUrl;
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const url = await upload(file);
    if (url) {
      const fd = new FormData();
      fd.set("url", url);
      await updateLogoAction(fd);
      router.refresh();
    }
    setBusy(false);
  }

  async function onAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const url = await upload(file);
    if (url) {
      const fd = new FormData();
      fd.set("url", url);
      await addPhotoAction(fd);
      router.refresh();
    }
    setBusy(false);
  }

  async function onRemove(url: string) {
    setBusy(true);
    const fd = new FormData();
    fd.set("url", url);
    await removePhotoAction(fd);
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profielfoto */}
      <div className="card p-6 flex items-center gap-5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="size-20 rounded-lg object-cover border border-line" />
        ) : (
          <span className="media-ph size-20 rounded-lg shrink-0" aria-hidden />
        )}
        <div>
          <p className="font-medium mb-1">Profielfoto</p>
          <p className="text-[0.875rem] text-muted mb-3">Je logo of een herkenbare foto.</p>
          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onLogo}
          />
          <button
            type="button"
            className="btn btn-ghost h-9 px-4"
            disabled={busy}
            onClick={() => logoInput.current?.click()}
          >
            {logoUrl ? "Vervangen" : "Uploaden"}
          </button>
        </div>
      </div>

      {/* Salonfoto's */}
      <div className="card p-6">
        <p className="font-medium mb-1">Salonfoto&apos;s</p>
        <p className="text-[0.875rem] text-muted mb-4">Werkfoto&apos;s die baasjes op je profiel zien.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((url) => (
            <div key={url} className="relative aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Salonfoto" className="w-full h-full object-cover rounded-md border border-line" />
              <button
                type="button"
                onClick={() => onRemove(url)}
                disabled={busy}
                className="absolute top-1 right-1 size-7 rounded-md bg-bg/90 border border-line-strong text-[0.75rem] hover:border-ink"
                aria-label="Verwijderen"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            disabled={busy}
            className="aspect-[4/3] rounded-md border border-dashed border-line-strong text-[0.875rem] text-muted hover:border-ink hover:text-ink transition-colors"
          >
            + Foto
          </button>
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAddPhoto}
          />
        </div>
      </div>

      {busy && <p className="text-[0.875rem] text-muted">Bezig met uploaden…</p>}
      {error && <p className="chip chip-alert w-fit">{error}</p>}
    </div>
  );
}
