import type { ImageKind } from "@/lib/records.server";

// Stylised, clearly-labelled stand-ins for a scan image — not real imagery
// and not diagnostic. Grayscale shapes plus a film-grain filter give a
// scan-like look without implying this is an actual patient study.
const LABEL: Record<ImageKind, string> = {
  "ct-chest": "Axial CT, chest",
  "mri-knee": "Sagittal MRI, left knee",
  "mri-spine": "Sagittal MRI, lumbar spine",
};

function Grain({ id }: { id: string }) {
  return (
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0" />
    </filter>
  );
}

function ChestCt() {
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="Illustrative axial CT image of the chest">
      <defs>
        <Grain id="g-chest" />
      </defs>
      <rect width="300" height="300" fill="#0a0a0c" />
      <ellipse cx="150" cy="155" rx="120" ry="95" fill="#201f22" stroke="#4a4950" strokeWidth="2" />
      <ellipse cx="97" cy="150" rx="60" ry="78" fill="#302e33" />
      <ellipse cx="203" cy="150" rx="60" ry="78" fill="#302e33" />
      <circle cx="150" cy="150" r="14" fill="#1a191c" stroke="#55535a" strokeWidth="1.5" />
      <circle cx="70" cy="108" r="6" fill="#e9e6de" stroke="#000" strokeWidth="1" />
      <rect width="300" height="300" fill="#fff" filter="url(#g-chest)" opacity="0.5" />
    </svg>
  );
}

function KneeMri() {
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="Illustrative sagittal MRI image of the knee">
      <defs>
        <Grain id="g-knee" />
      </defs>
      <rect width="300" height="300" fill="#060608" />
      <path d="M60 60 q90 -20 150 20 l10 70 q-80 30 -150 10 z" fill="#2b2a2f" />
      <path d="M40 220 q100 -30 190 -10 l-10 60 q-90 30 -180 10 z" fill="#2b2a2f" />
      <path d="M90 140 l110 -10 l10 40 l-110 15 z" fill="#17161a" stroke="#4a4950" strokeWidth="1.5" />
      <rect width="300" height="300" fill="#fff" filter="url(#g-knee)" opacity="0.45" />
    </svg>
  );
}

function SpineMri() {
  const vertebrae = [60, 95, 130, 165, 200];
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="Illustrative sagittal MRI image of the lumbar spine">
      <defs>
        <Grain id="g-spine" />
      </defs>
      <rect width="300" height="300" fill="#070708" />
      {vertebrae.map((y, i) => (
        <rect key={y} x={120 + i * 2} y={y} width="55" height="26" rx="6" fill="#302e33" stroke="#4a4950" strokeWidth="1" />
      ))}
      {vertebrae.slice(0, -1).map((y, i) => (
        <ellipse key={y} cx={150 + i * 2} cy={y + 30} rx="24" ry="7" fill={i === 2 ? "#17161a" : "#201f22"} />
      ))}
      <path d="M185 125 q20 10 15 24 q-5 10 -20 6" fill="none" stroke="#6b6971" strokeWidth="2" />
      <rect width="300" height="300" fill="#fff" filter="url(#g-spine)" opacity="0.4" />
    </svg>
  );
}

const IMAGES: Record<ImageKind, () => React.ReactNode> = {
  "ct-chest": ChestCt,
  "mri-knee": KneeMri,
  "mri-spine": SpineMri,
};

export function ScanImage({ kind }: { kind: ImageKind }) {
  const Image = IMAGES[kind];
  return (
    <figure className="mt-4">
      <div className="overflow-hidden rounded-sm border-2 border-border bg-black">
        <Image />
      </div>
      <figcaption className="mt-1 text-xs text-muted-foreground">
        {LABEL[kind]} — illustrative example image only, not this patient's actual scan.
      </figcaption>
    </figure>
  );
}
