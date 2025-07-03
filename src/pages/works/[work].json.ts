import { getCollection, getEntry } from "astro:content";

export async function getStaticPaths() {
  return getCollection(
    "works",
    ({ data: { metadata } }) => !metadata.private,
  ).then((entries) =>
    entries.map((entry) => ({
      params: { work: entry.data.id },
    })),
  );
}

export async function GET({ params: { work } }) {
  const entry = await getEntry("works", work);

  if (!entry) {
    return new Response("Not Found", {
      status: 404,
    });
  }

  return new Response(JSON.stringify(entry.data, null, 2));
}
