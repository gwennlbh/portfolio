import { defineMiddleware } from "astro:middleware";
import { loadLocales, runWithLocale } from "wuchale/load-utils/server";
import { locales } from "../i18n/data.js";
import * as main from "../i18n/main.loader.js";

loadLocales(main.key, main.loadIDs, main.loadCatalog, locales);

export const onRequest = defineMiddleware(async ({ locals }, next) => {
  locals.lang = process.env.LANG === "fr" ? "fr" : "en";

  locals.locale = (process.env.LOCALE ||
    "en-US") as `${typeof locals.lang}-${string}`;

  locals.buildCommit =
    // Explicit commit
    process.env.BUILD_COMMIT ||
    // Netlify
    process.env.COMMIT_REF ||
    // Cloudflare Pages
    process.env.CF_PAGES_COMMIT_SHA ||
    // Fallback
    "dev";

  return runWithLocale(locals.lang, next);
});
