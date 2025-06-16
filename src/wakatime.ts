import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { file } from "astro/loaders";
import { getSecret } from "astro:env/server";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

export async function wakatimeCollection(cachepath: string) {
  await refreshWakatimeCache(cachepath);

  return defineCollection({
    schema: z.object({
      name: z.string(),
      total_seconds: z.number(),
    }),
    loader: file(cachepath, {
      parser: (text) => JSON.parse(text).data.languages,
    }),
  });
}

export async function refreshWakatimeCache(cachepath: string) {
  try {
    const cachedResponse = JSON.parse((await readFile(cachepath)).toString());
    // cache is fresh enough
    if (Date.now() - new Date(cachedResponse.writtenAt).valueOf() < 12 * 3600) {
      return cachedResponse;
    }
  } catch {}

  const response = fetch(
    `https://wakatime.com/api/v1/users/current/stats/all_time`,
    {
      headers: {
        Authorization: `Basic ${getSecret("WAKATIME_API_KEY")}`,
      },
    }
  ).then((response) => response.json());

  await mkdir(path.dirname(cachepath), { recursive: true });
  await writeFile(
    cachepath,
    JSON.stringify({ ...response, writtenAt: new Date().toISOString() })
  );
}
