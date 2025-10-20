import { test, expect } from "@playwright/test";
import path from "node:path";

type ConfigEntry = `/${string}` | { [name: string]: ConfigEntry };
type Config = Record<string, ConfigEntry>;

/**
 * Map screenshot filename (without extension) to URL.
 * Object values allow making directories for screenshots
 */
const pages: Config = {
  index: "/",
  projects: {
    "gwen.works": "/gwen.works",
    "C.I.G.A.L.E": "/cigale",
    "emoti*ns": "/emoti*ns",
    "The Unconscious' Wanders": "/the-unconscious-wanders",
    HyprLS: "/hyprls",
  },
  blog: {
    lsp: "/blog/making-an-lsp-server-in-go",
  },
};

function runScreenshotTest(screenshotName: string, urlOrFolder: ConfigEntry) {
  if (typeof urlOrFolder === "string") {
    test(screenshotName, async ({ page }) => {
      process.env.PLAYWRIGHT = "1";
      await page.goto(urlOrFolder);
      await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.02 });
    });
  } else {
    for (const [name, entry] of Object.entries(urlOrFolder)) {
      runScreenshotTest(path.join(screenshotName, name), entry);
    }
  }
}

for (const [name, entry] of Object.entries(pages)) {
  runScreenshotTest(name, entry);
}
