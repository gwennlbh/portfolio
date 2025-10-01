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

  return entry ? (isAliasOf(entry) ?? entry?.id) : undefined;
}
