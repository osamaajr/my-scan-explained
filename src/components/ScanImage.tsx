import type { ImageKind } from "@/lib/records.server";

const SCANS: Record<ImageKind, { src: string; label: string; alt: string }> = {
  "ct-chest": {
    src: "/scans/chest-ct.webp",
    label: "Axial CT, chest",
    alt: "Illustrative axial chest CT showing both lungs and a small right upper lobe nodule",
  },
  "mri-knee": {
    src: "/scans/left-knee-mri.webp",
    label: "Sagittal MRI, left knee",
    alt: "Illustrative sagittal MRI of a left knee with a posterior medial meniscus tear",
  },
  "mri-spine": {
    src: "/scans/lumbar-spine-mri.webp",
    label: "Sagittal MRI, lumbar spine",
    alt: "Illustrative sagittal lumbar spine MRI with lower lumbar disc degeneration",
  },
};

export function ScanImage({ kind }: { kind: ImageKind }) {
  const scan = SCANS[kind];

  return (
    <figure className="mt-4">
      <div className="overflow-hidden rounded-sm border-2 border-border bg-black">
        <img className="h-[26rem] w-full object-contain sm:h-[34rem]" src={scan.src} alt={scan.alt} />
      </div>
      <figcaption className="mt-1 text-xs text-muted-foreground">
        {scan.label} — AI-generated illustrative image only, not this patient's actual scan or a diagnostic image.
      </figcaption>
    </figure>
  );
}
