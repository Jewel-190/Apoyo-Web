import { useEffect, useState } from "react";

/**
 * ContentImage — simple fixed-size display for CMS uploads.
 *
 * Just constrains the image (usually a fixed height). Width follows the
 * image’s own aspect ratio so nothing is stretched, cropped, or boxed.
 */
export const IMAGE_SLOTS = {
  logo: "h-14 w-auto max-w-[11rem]",
  logoNavPrimary: "block h-10 w-auto max-h-10 max-w-[10rem] sm:h-11 sm:max-h-11 sm:max-w-[12rem] lg:h-12 lg:max-h-12 lg:max-w-[13rem]",
  logoNavSecondary: "block h-10 w-auto max-h-10 max-w-[10rem] sm:h-11 sm:max-h-11 sm:max-w-[12rem] lg:h-12 lg:max-h-12 lg:max-w-[14rem]",
  logoNavBanner: "block h-8 w-auto max-h-8 max-w-[11rem] sm:h-9 sm:max-h-9 sm:max-w-[14rem] lg:h-10 lg:max-h-10 lg:max-w-[16rem]",
  logoFooter: "h-16 w-auto max-w-[12rem]",
  logoFooterBanner: "h-[2.8rem] w-auto max-w-[14.4rem] sm:h-[3.2rem] sm:max-w-[17.6rem]",
  logoPage: "mx-auto mb-5 h-14 w-auto max-w-[11rem]",
  logoPageLg: "mx-auto mb-5 h-16 w-auto max-w-[12rem]",
  slogan: "mx-auto h-24 w-auto max-h-24 max-w-full sm:h-28 sm:max-h-28 md:h-32 md:max-h-32",
  // Store badges: height-locked so the hit box stays badge-shaped, not a wide forced box.
  badge: "block h-12 w-auto max-w-[11rem] sm:h-14 sm:max-w-[13rem]",
  icon: "h-16 w-16",
  arrow: "h-5 w-5",
  partner: "h-full w-full object-cover",
  thumb: "h-12 w-auto max-w-[6rem] sm:h-14 sm:max-w-[7rem]",
  phone:
    "mx-auto h-[min(58vh,420px)] w-auto max-w-[220px] rounded-3xl sm:h-[min(62vh,500px)] sm:max-w-[250px] md:h-[min(64vh,560px)] md:max-w-[280px] lg:h-[min(66vh,620px)] lg:max-w-[300px]",
  cover: "h-full w-full object-cover",
};

const ALPHA_CUTOFF = 8;

/** Crop fully-transparent padding so the layout box matches visible pixels. */
function trimTransparentPadding(source) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  if (!width || !height) return null;

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(source, 0, 0);

  let imageData;
  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    return null; // tainted canvas (CORS)
  }

  const { data } = imageData;
  let top = 0;
  let bottom = height - 1;
  let left = 0;
  let right = width - 1;

  const rowHasInk = (y) => {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > ALPHA_CUTOFF) return true;
    }
    return false;
  };
  const colHasInk = (x) => {
    for (let y = top; y <= bottom; y += 1) {
      if (data[(y * width + x) * 4 + 3] > ALPHA_CUTOFF) return true;
    }
    return false;
  };

  while (top < bottom && !rowHasInk(top)) top += 1;
  while (bottom > top && !rowHasInk(bottom)) bottom -= 1;
  while (left < right && !colHasInk(left)) left += 1;
  while (right > left && !colHasInk(right)) right -= 1;

  const cropW = right - left + 1;
  const cropH = bottom - top + 1;
  if (cropW <= 0 || cropH <= 0) return null;
  if (cropW === width && cropH === height) return null;

  const out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;
  out.getContext("2d").drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);
  return out.toDataURL("image/png");
}

function useBadgeSrc(src, enabled) {
  const [displaySrc, setDisplaySrc] = useState(src);

  useEffect(() => {
    setDisplaySrc(src);
    if (!enabled || !src) return undefined;

    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const trimmed = trimTransparentPadding(img);
      if (trimmed) setDisplaySrc(trimmed);
    };
    img.onerror = () => {
      if (!cancelled) setDisplaySrc(src);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, enabled]);

  return displaySrc;
}

/**
 * @param {{
 *   src?: string | null,
 *   alt?: string,
 *   slot?: keyof typeof IMAGE_SLOTS,
 *   className?: string,
 *   imgClassName?: string,
 * } & React.ImgHTMLAttributes<HTMLImageElement>} props
 */
export default function ContentImage({
  src,
  alt = "",
  slot = "cover",
  className = "",
  imgClassName = "",
  ...rest
}) {
  const trimBadge = slot === "badge";
  const displaySrc = useBadgeSrc(src, trimBadge);

  if (!src) return null;
  const slotClass = IMAGE_SLOTS[slot] ?? IMAGE_SLOTS.cover;
  const shadow =
    slot === "logoNavPrimary" || slot === "logoNavSecondary" || slot === "logoNavBanner" ? "drop-shadow-sm" : "";

  // Cover/partner fill their parent; everything else keeps aspect ratio via IMAGE_SLOTS.
  const needsCover = slot === "partner" || slot === "cover";
  const objectFit = needsCover ? "object-cover object-center" : "object-contain object-center";

  return (
    <img
      src={displaySrc || src}
      alt={alt}
      className={`${slotClass} ${objectFit} ${shadow} ${imgClassName} ${className}`.trim()}
      loading={rest.loading ?? "lazy"}
      decoding="async"
      {...rest}
    />
  );
}
