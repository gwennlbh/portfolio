export function resolveAliased(query: string, entries: Array<{ id: string }>) {
  const isAliasOf = (e: (typeof entries)[number]) =>
    "isAliasOf" in e
      ? e.isAliasOf?.toString()
      : "data" in e &&
          e.data &&
          typeof e.data === "object" &&
          "isAliasOf" in e.data
        ? e.data?.isAliasOf?.toString()
        : undefined;

  const entry = entries.find((e) => e.id === query || isAliasOf(e) === query);
  if (query === "library")
    console.log("resolveAliased", {
      query,
      aliasmap: Object.fromEntries(entries.map((e) => [e.id, isAliasOf(e)])),
    });
  return entry ? (isAliasOf(entry) ?? entry?.id) : undefined;
}
