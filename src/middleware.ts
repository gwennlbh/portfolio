import { defineMiddleware } from "astro:middleware";
import { getEntry } from "astro:content";
import { JSDOM } from "jsdom";

export const onRequest = defineMiddleware(async ({ locals, url }, next) => {
  locals.lang = process.env.LANG === "fr" ? "fr" : "en";
  locals.locale = process.env.LOCALE as
    | `${typeof locals.lang}-${string}`
    | undefined;
  locals.buildCommit = process.env.BUILD_COMMIT;
  const response = await next();
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
        : key

    translatable.removeAttribute("i18n");
    if (translation) {
      translatable.innerHTML = translation.data.msgstr;
    }
  }

  for (const translatable of dom.window.document.querySelectorAll("i18n")) {
    const key = translatable.innerHTML?.trim();
    if (!key) continue;

    const translation =
      locals.lang === "fr"
        ? await getEntry("frenchMessages", key)
        : await getEntry("englishMessages", key);

    translatable.outerHTML = translation?.data.msgstr ?? key;
  }

  return new Response(dom.serialize(), {
    status: 200,
    headers: response.headers,
  });
});
