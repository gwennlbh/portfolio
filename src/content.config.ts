import { file, glob } from "astro/loaders";
import type { ZodObject, ZodRawShape } from "astro/zod";
import { defineCollection, reference, z } from "astro:content";
import * as YAML from "yaml";
import PO from "pofile";
import { makeAliasEntries } from "./aliases";
import { wakatimeCollection } from "./wakatime";
import { readFile } from "node:fs/promises";
import slug from "slug";

const translatedString = z.object({
  en: z.string(),
  fr: z.string(),
});

const nullableDate = z
  .string()
  .nullable()
  .optional()
  .transform((value) => (value ? new Date(value) : null));

const year = z.number().min(2003).max(new Date().getFullYear()).int();

export const collections = {
  frenchMessages: gettextPoMessages("i18n/fr.po"),
  englishMessages: gettextPoMessages("i18n/en.po"),
  wakatime: await wakatimeCollection(".wakatime-cache.json"),
  blogEntries: defineCollection({
    loader: glob({ pattern: "*.md", base: "./blog" }),
    schema: z.object({
      title: z.string(),
      date: z.coerce.date(),
      works: z.array(reference("works")).optional().default([]),
      draft: z.boolean().optional().default(false),
    }),
  }),
  works: defineCollection({
    loader: file("works.json"),
    schema: z.object({
      id: z.string(),
      builtAt: z.coerce.date(),
      descriptionHash: z.string(),
      source: z.string(),
      metadata: z.object({
        aliases: z.array(z.string()).optional().nullable().default([]),
        finished: nullableDate,
        started: nullableDate,
        madeWith: z
          .array(reference("technologies"))
          .optional()
          .nullable()
          .default([]),
        tags: z.array(reference("tags")).optional().nullable().default([]),
        thumbnail: z.string().optional(),
        thumbnailSource: z.string().optional(),
        titleStyle: z.string().optional(),
        colors: z.object({
          primary: z.string(),
          secondary: z.string(),
          tertiary: z.string(),
        }),
        pageBackground: z.string().optional(),
        wip: z.boolean(),
        private: z.boolean(),
        additionalMetadata: z
          .object({
            layout: z
              .array(
                z.union([
                  z.string().nullable(),
                  z.array(z.string().nullable()),
                ]),
              )
              .optional(),
            created: nullableDate,
          })
          .nullable(),
        databaseMetadata: z.object({
          Partial: z.boolean(),
        }),
      }),
      Partial: z.boolean(),
      content: z.record(
        z.object({
          layout: z.array(z.array(z.string())),
          title: z.string(),
          footnotes: z.record(z.string()),
          abbreviations: z.record(z.string()),
          blocks: z.array(
            z.object({
              id: z.string(),
              type: z.enum(["paragraph", "media", "link"]),
              anchor: z.string(),
              index: z.number(),
              alt: z.string(),
              caption: z.string(),
              relativeSource: z.string(),
              distSource: z.string(),
              contentType: z.string(),
              size: z.number(),
              dimensions: z.object({
                width: z.number(),
                height: z.number(),
                aspectRatio: z.number(),
              }),
              online: z.boolean(),
              duration: z.number(),
              hasSound: z.boolean(),
              colors: z.object({
                primary: z.string(),
                secondary: z.string(),
                tertiary: z.string(),
              }),
              thumbnails: z.record(z.string()).nullable().default({}),
              thumbnailsBuiltAt: z.coerce.date().optional(),
              attributes: z.object({
                loop: z.boolean(),
                autoplay: z.boolean(),
                muted: z.boolean(),
                playsinline: z.boolean(),
                controls: z.boolean(),
              }),
              analyzed: z.boolean(),
              hash: z.string(),
              content: z.string(),
              text: z.string(),
              title: z.string(),
              url: z.string(),
            }),
          ),
        }),
      ),
    }),
  }),
  experiences: yamlDataCollection(
    "experiences.yaml",
    z.object({
      time: z.union([year, z.tuple([year, year])]),
      title: z.string(),
      links: z.array(z.string().url()).optional().default([]),
      company: z.object({
        name: z.string(),
        url: z.string().url().optional(),
        description: z.string(),
      }),
      location: z.string(),
      description: z.string(),
      skills: z.array(z.string()).optional(),
    }),
    (exp) => `${exp.company.name}, ${exp.time}`,
  ),
  education: yamlDataCollection(
    "education.yaml",
    z.object({
      time: year,
      title: z.string(),
      school: z.object({
        name: z.string(),
        url: z.string().url().optional(),
      }),
      location: z.string(),
      diploma: z.object({
        results: z
          .object({
            location: z.string().optional(),
            scores: z.record(z.tuple([z.string(), z.string()])),
          })
          .optional(),
        name: z.string(),
      }),
    }),
    (exp) => exp.time.toString(),
  ),
  sites: yamlDataCollection(
    "sites.yaml",
    z.object({
      name: z.string(),
      url: z.string().url(),
      purpose: z.string().optional(),
      username: z.string().optional(),
      slug: z.string(),
    }),
    (site) => site.name,
  ),
  collections: yamlDataCollection(
    "collections.yaml",
    z.object({
      title: translatedString,
      description: translatedString.optional(),
      includes: z.string(),
      singular: z.string().optional(),
      plural: z.string().optional(),
    }),
  ),
  tags: yamlDataCollection(
    "tags.yaml",
    z.object({
      slug: z.string(),
      singular: z.string(),
      plural: z.string(),
      description: z.string().optional(),
      aliases: z.array(z.string()).optional().default([]),
      "learn more at": z.string().url().optional(),
      detect: z
        .object({
          "made with": z.array(reference("technologies")).optional(),
        })
        .optional(),
    }),
    (tag) => tag.plural,
    (tag) => [tag.singular],
  ),
  technologies: yamlDataCollection(
    "technologies.yaml",
    z.object({
      slug: z.string(),
      name: z.string(),
      by: z.string().optional(),
      files: z.array(z.string()).optional(),
      "learn more at": z.string().url().optional(),
      description: z.string().optional(),
      aliases: z.array(z.string()).optional(),
      autodetect: z.array(z.string()).optional(),
    }),
  ),
};

function yamlDataCollection<
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>,
>(
  filename: string,
  schema: Schema,
  slugify?: (data: z.infer<Schema>) => string,
  additionalAliases?: (data: z.infer<Schema>) => string[],
) {
  return defineCollection({
    schema,
    loader: {
      name: "YAML Loader",
      async load({ renderMarkdown, store, generateDigest, watcher }) {
        const raw = await readFile(filename);
        const parsed: Array<z.infer<Schema>> | Record<string, z.infer<Schema>> =
          YAML.parse(raw.toString());

        watcher?.add(filename);

        if (Array.isArray(parsed)) {
          const entries = parsed
            .map((data) => {
              const out: z.infer<Schema> & {
                slug?: string;
                aliases?: string[];
              } = { ...data };

              if (slugify) out.slug ??= slugify(data);

              const aliasable = z
                .object({
                  aliases: z.array(z.string()),
                  slug: z.string(),
                })
                .safeParse(out);

              if (aliasable.success || additionalAliases) {
                out.aliases ??= [];
                if (additionalAliases) {
                  out.aliases = [...out.aliases, ...additionalAliases(data)];
                }
                return makeAliasEntries(out);
              }

              return [out];
            })
            .flat();

          store.clear();
          for (const entry of entries) {
            store.set({
              id: entry.slug ?? slug(entry.title),
              data: entry,
              digest: generateDigest(JSON.stringify(entry)),
              rendered: await renderMarkdown(
                "description" in entry
                  ? typeof entry.description === "string"
                    ? entry.description
                    : entry.description[process.env.LANG === "fr" ? "fr" : "en"]
                  : "",
              ),
            });
          }
        } else {
          store.clear();
          for (const [key, data] of Object.entries(parsed)) {
            store.set({
              id: key,
              data: data as z.infer<Schema>,
              digest: generateDigest(JSON.stringify(data)),
              rendered: await renderMarkdown(
                "description" in data
                  ? typeof data.description === "string"
                    ? data.description
                    : data.description[process.env.LANG === "fr" ? "fr" : "en"]
                  : "",
              ),
            });
          }
        }
      },
    },
  });
}

function gettextPoMessages(filename: string) {
  return defineCollection({
    schema: z.object({
      msgid: z.string(),
      msgstr: z.string(),
      msgctxt: z.string().optional(),
    }),
    loader: file(filename, {
      parser(text) {
        return PO.parse(text).items.map((item) => ({
          id: item.msgid,
          ...item,
          msgstr: item.msgstr[0],
          msgctxt: item.msgctxt || undefined,
        }));
      },
    }),
  });
}
