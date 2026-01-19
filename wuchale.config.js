// @ts-check
import { adapter as astro } from "@wuchale/astro";
import { defineConfig } from "wuchale";

export default defineConfig({
  locales: ["en", "fr"],
  adapters: {
    main: astro({
      localesDir: "i18n",
    }),
  },
});
