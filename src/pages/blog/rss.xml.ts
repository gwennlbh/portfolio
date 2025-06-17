import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET({ site }) {
  const entries = await getCollection("blogEntries", ({ data }) => !data.draft);
  return rss({
    site,
    title: "gwenn le bihan's blog",
    description: "articles about web dev, art, and more random stuff",
    stylesheet: "/pretty-feed-v3.xsl",
    customData: `<language>en-us</language>`,
    items: entries.map(({ id, data: { title, date }, rendered }) => ({
      title,
      pubDate: date,
      description: rendered?.html,
      link: `/blog/${id}`,
    })),
  });
}
