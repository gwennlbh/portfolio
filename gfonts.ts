import { download, constructURL } from "google-fonts-helper";

import path from "node:path";
const here = import.meta.dirname;

const url = constructURL({
  display: "swap",
  families: {
    "Martian Mono": {
      wght: "200..800",
      ital: "200..800",
    },
    Manrope: {
      wght: "200..800",
    },
  },
})
  .toString()
  // See https://github.com/datalogix/google-fonts-helper/issues/79
  .replace(":ital@1", ":ital@0;1");

console.info("Downloading", url);

await download(url, {
  outputDir: path.join(here, "public"),
  fontsDir: "fonts",
  stylePath: "fonts/import.css",
  fontsPath: `${process.env.BASE_PATH ?? ""}/fonts`,
}).execute();
