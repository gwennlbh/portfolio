import { file } from "astro/loaders"
import type { ZodObject, ZodRawShape } from "astro/zod"
import { defineCollection, reference, z } from "astro:content"
import * as YAML from "yaml"
import { makeAliasEntries } from "./aliases"

const translatedString = z.object({
  en: z.string(),
  fr: z.string(),
})

const nullableDate = z
  .string()
  .nullable()
  .optional()
  .transform((value) => (value ? new Date(value) : null))

export const collections = {
  works: defineCollection({
    loader: file("works.json"),
    schema: z.object({
      id: z.string(),
      builtAt: z.coerce.date(),
      descriptionHash: z.string(),
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
        thumbnail: z.record(z.string()).nullable().default({}),
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
                z.union([z.string().nullable(), z.array(z.string().nullable())])
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
          cssGridAreas: z.string(),
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
            })
          ),
        })
      ),
    }),
  }),
  experiences: yamlDataCollection(
    "experiences.yaml",
    z.object({
      time: z.coerce.string(),
      title: z.string(),
      company: z.object({
        name: z.string(),
        url: z.string().url().optional(),
        description: z.string(),
      }),
      location: z.string(),
      description: z.string(),
      skills: z.array(z.string()).optional(),
    }),
    (exp) => exp.time.toString()
  ),
  education: yamlDataCollection(
    "education.yaml",
    z.object({
      time: z.coerce.string(),
      title: z.string(),
      school: z.object({
        name: z.string(),
        url: z.string().url().optional(),
      }),
      location: z.string(),
      diploma: z.object({
        results: z.union([z.string(), z.record(z.string())]).optional(),
        name: z.string()
      })
    }),
    (exp) => exp.time.toString()
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
    (site) => site.name
  ),
  collections: yamlDataCollection(
    "collections.yaml",
    z.object({
      title: translatedString,
      description: translatedString.optional(),
      includes: z.string(),
      singular: z.string().optional(),
      plural: z.string().optional(),
    })
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
    (tag) => [tag.singular]
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
    })
  ),
}

function yamlDataCollection<
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
>(
  filename: string,
  schema: Schema,
  slugify?: (data: z.infer<Schema>) => string,
  additionalAliases?: (data: z.infer<Schema>) => string[]
) {
  return defineCollection({
    schema,
    loader: file(filename, {
      parser(content) {
        const parsed = YAML.parse(content)
        if (Array.isArray(parsed)) {
          const out = parsed
            .map((data) => {
              const out = { ...data }
              if (slugify) out.slug ??= slugify(data)

              const aliasable = z
                .object({
                  aliases: z.array(z.string()),
                  slug: z.string(),
                })
                .safeParse(out)

              if (aliasable.success || additionalAliases) {
                if (additionalAliases) {
                  out.aliases = [
                    ...(out.aliases ?? []),
                    ...additionalAliases(data),
                  ]
                }
                return makeAliasEntries(out)
              }

              return [out]
            })
            .flat()

          return out
        }

        return parsed
      },
    }),
  })
}
