// @ts-check
import { defineConfig } from "astro/config";
import math from "remark-math";
import katex from "rehype-katex";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  site: `https://${process.env.LANG}.gwen.works`,
  markdown: {
    remarkPlugins: [math],
    rehypePlugins: [katex],
  },
});
