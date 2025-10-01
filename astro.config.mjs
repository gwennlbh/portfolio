// @ts-check
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import katex from "rehype-katex";
import math from "remark-math";

// https://astro.build/config
export default defineConfig({
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
});
