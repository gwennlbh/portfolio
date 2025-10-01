import { defineMiddleware } from "astro:middleware";
import { getEntry, getCollection } from "astro:content";
import { JSDOM } from "jsdom";
import { collections } from "./content.config.ts";

let loggedCollections = false;

export const onRequest = defineMiddleware(async ({ locals, url }, next) => {
  locals.lang = process.env.LANG === "fr" ? "fr" : "en";
  locals.locale = process.env.LOCALE as
    | `${typeof locals.lang}-${string}`
    | undefined;
  locals.buildCommit =
    // Netlify
    process.env.COMMIT_REF ||
    // Cloudflare Pages
    process.env.CF_PAGES_COMMIT_SHA ||
    // Fallback
    "dev";

  const response = await next();

  if (
    ["application/json", "text/plain"].includes(
      response.headers.get("content-type")?.split(";")[0] || "",
    )
  ) {
    return response;
  }

  const dom = new JSDOM(await response.text(), {
    url: url.toString(),
    contentType: response.headers.get("content-type") || "text/html",
  });

  for (const translatable of dom.window.document.querySelectorAll("[i18n]")) {
    const key = translatable.textContent?.trim();
    if (!key) continue;

    const translation =
      locals.lang === "fr"
        ? await getEntry("frenchMessages", key)
        : { data: { msgstr: key } };

    translatable.removeAttribute("i18n");
    if (translation) {
      translatable.innerHTML = translation.data.msgstr;
    }
  }

  for (const translatable of dom.window.document.querySelectorAll("i18n")) {
    const key = translatable.innerHTML?.trim();
    if (!key) continue;

    const translation =
      locals.lang === "fr" ? await getEntry("frenchMessages", key) : undefined;

    translatable.outerHTML = translation?.data.msgstr ?? key;
  }

  return new Response(dom.serialize(), {
    status: 200,
    headers: response.headers,
  });
});
