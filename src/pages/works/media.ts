import type { InferEntrySchema } from "astro:content";

type Block =
  InferEntrySchema<"works">["content"][keyof InferEntrySchema<"works">["content"]]["blocks"][number];

export function imageAttrs({
  distSource,
  thumbnails,
  alt,
  dimensions,
}: Block): {
  src: string;
  srcset: string;
  alt: string;
  height: string;
  width: string;
} {
  return {
    height: dimensions.height.toString(),
    width: dimensions.width.toString(),
    alt: alt,
    src: `https://media.gwen.works/${distSource}`,
    srcset: Object.entries(thumbnails ?? {})
      .map(([size, path]) => `https://media.gwen.works/${path} ${size}w`)
      .join(", "),
  };
}
