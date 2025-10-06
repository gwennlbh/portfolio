// @ts-check
import mdx from "@astrojs/mdx";
import netlify from "@astrojs/netlify";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import type { InferEntrySchema } from "astro:content";
import { readFileSync } from "node:fs";
import katex from "rehype-katex";
import math from "remark-math";
import YAML from "yaml";

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: !process.env.PLAYWRIGHT,
  },

  integrations: [
    mdx(),
    sitemap({
      changefreq: "weekly",
      // TODO wait until URLPattern lands in bun (and Node)
      // filter: (url) => !new URLPattern("/works/:work", url).test(url)
      filter: (url) => !new URL(url).pathname.startsWith("/works/"),
    }),
  ],

  site: `https://${process.env.LANG}.gwen.works`,

  markdown: {
    remarkPlugins: [math],
    rehypePlugins: [katex],
  },

  adapter: netlify(),
  redirects: Object.fromEntries(
    (
      YAML.parse(
        readFileSync("sites.yaml", "utf8"),
      ) as InferEntrySchema<"sites">[]
    )
      .filter(
        ({ url }) =>
          URL.canParse(url) && new URL(url).protocol.match(/^https?:$/),
      )
      .map(({ name, url }) => [`/to/${name}`, url]),
  ),
});
