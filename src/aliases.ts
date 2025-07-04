const IS_ALIAS_TAG = "__is_alias";

/**
 * Create aliased entries for a given entry
 * @param aliasOf the slug of the entry this one is an alias of
 * @returns the aliases array for that aliased entry
 */
export function makeAliasEntries<
  Entry extends { aliases?: string[] | undefined; slug?: string | undefined },
>(entry: Entry) {
  return [
    entry,
    ...(entry.aliases ?? []).map((alias) => ({
      ...entry,
      slug: alias,
      aliases: [IS_ALIAS_TAG, entry.slug],
    })),
  ];
}

export function resolveAliased(entry: {
  aliases?: null | string[];
  slug: string;
}) {
  if (!entry.aliases) return entry.slug;
  if (entry.aliases.includes(IS_ALIAS_TAG) && entry.aliases.length === 2)
    return entry.aliases[1];
  return entry.slug;
}

export function isAliased(entry: { aliases?: null | string[]; slug: string }) {
  return resolveAliased(entry) !== entry.slug;
}
