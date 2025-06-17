interface Window {
  toggleNav(): void;
}

namespace App {
  interface Locals {
    lang: "fr" | "en";
    locale?: `${Locals["lang"]}-${string}`;
    buildCommit?: string;
  }
}
