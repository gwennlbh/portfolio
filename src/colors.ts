import tinycolor from "tinycolor2";

export function ensureReadable(background: string, foregroundWish: string) {
  const bg = tinycolor(background);
  const fg = tinycolor(foregroundWish);

  if (tinycolor.isReadable(bg, fg)) {
    return fg.toHexString();
  }

  return bg.isLight() ? "#000000" : "#ffffff";
}

export function setCssColors(
  colors:
    | {
        primary: string;
        secondary: string;
        tertiary: string;
      }
    | undefined
    | null,
) {
  colors = {
    primary: colors?.primary || "#000000",
    secondary: colors?.secondary || "#ffffff",
    tertiary: colors?.tertiary || "#f00",
  };

  return colors
    ? `
        --primary: ${ensureReadable(colors.secondary, colors.primary)};
        --secondary: ${colors.secondary};
        --tertiary: ${colors.tertiary};`
    : undefined;
}
