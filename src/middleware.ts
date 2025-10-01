import { defineMiddleware } from "astro:middleware";
import { getEntry, getCollection } from "astro:content";
import { JSDOM } from "jsdom";
import { collections } from "./content.config.ts";

let loggedCollections = false;

export const onRequest = defineMiddleware(
  async ({ locals, url, routePattern }, next) => {
    if (!loggedCollections) {
      const ids: Record<string, string[]> = {};
      for (const name of Object.keys(collections)) {
        ids[name] = [];
        for (const entry of await getCollection(name)) {
          ids[name].push(entry.id);
        }
      }

      console.info("Loaded collections");
      console.info(JSON.stringify(ids, null, 2));

      const emtns = await getEntry("works", "emoti∗ns");
      console.info(JSON.stringify({ "emoti∗ns": emtns }, null, 2));

      loggedCollections = true;
    }

    locals.lang = process.env.LANG === "fr" ? "fr" : "en";
    locals.locale = process.env.LOCALE as
      | `${typeof locals.lang}-${string}`
      | undefined;
    locals.buildCommit = process.env.BUILD_COMMIT;

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
        locals.lang === "fr"
          ? await getEntry("frenchMessages", key)
          : undefined;

      translatable.outerHTML = translation?.data.msgstr ?? key;
    }

    return new Response(dom.serialize(), {
      status: 200,
      headers: response.headers,
    });
  },
);
