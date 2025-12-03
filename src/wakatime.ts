import { file } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { getSecret } from "astro:env/server";
import { differenceInMonths } from "date-fns";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export async function wakatimeCollection(
  cachepath: string,
  subkey: "languages" | "projects",
) {
  await refreshWakatimeCache(cachepath);

  return defineCollection({
    schema: z.object({
      name: z.string(),
      total_seconds: z.number(),
    }),
    loader: file(cachepath, {
      parser: (text) =>
        JSON.parse(text).data[subkey].map((l) => ({
          id: l.name.toLowerCase(),
          ...l,
        })),
    }),
  });
}

export async function refreshWakatimeCache(cachepath: string) {
  try {
    const cachedResponse = JSON.parse((await readFile(cachepath)).toString());
    // cache is fresh enough
    if (
      differenceInMonths(new Date(), new Date(cachedResponse.writtenAt)) < 2
    ) {
      return cachedResponse;
    }
  } catch {}

  const response = await fetch(
    `https://wakatime.com/api/v1/users/current/stats/all_time`,
    {
      headers: {
        Authorization: `Basic ${getSecret("WAKATIME_API_KEY")}`,
      },
    },
  ).then((response) => response.json());

  await mkdir(path.dirname(cachepath), { recursive: true });
  await writeFile(
    cachepath,
    JSON.stringify({ ...response, writtenAt: new Date().toISOString() }),
  );
}
