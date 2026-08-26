import Image from "next/image";

const ARTWORK = {
  glyph: "/images/brand/brand-glyph-128.png",
  medallion: "/images/brand/brand-medallion-256.png",
} as const;

export function Logo({
  form = "glyph",
  size = 40,
  alt = "",
}: {
  readonly form?: keyof typeof ARTWORK;
  readonly size?: number;
  readonly alt?: string;
}) {
  return (
    <Image
      src={ARTWORK[form]}
      alt={alt}
      width={size}
      height={size}
      className="block shrink-0 object-contain"
    />
  );
}
