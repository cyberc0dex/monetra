import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Keep all installed Lucide symbols available for config-only picker changes.
// The browser references individual symbols; the sprite is precached offline.
await mkdir(resolve(root, "assets/icons"), { recursive: true });
await copyFile(resolve(root, "node_modules/lucide-static/sprite.svg"), resolve(root, "assets/icons/lucide.svg"));
console.log("Copied the complete local Lucide sprite for configurable offline icons.");
