import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(projectRoot, "node_modules/lucide-static/sprite.svg");
const outputPath = resolve(projectRoot, "assets/icons/lucide.svg");
const iconNames = [
  "house", "coins", "car-front", "calendar-days", "settings", "user",
  "plus", "chevron-right", "trash", "pencil", "eye", "eye-off",
  "laptop", "car", "gamepad-2", "dumbbell", "plane", "utensils",
  "shopping-bag", "wrench", "package", "circle-dollar-sign"
];

const source = await readFile(sourcePath, "utf8");
const symbols = iconNames.map(name => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`<symbol id="${escapedName}"[\\s\\S]*?<\\/symbol>`));
  if (!match) throw new Error(`Lucide icon not found: ${name}`);
  return match[0];
});

const sprite = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generated from lucide-static. ISC License. -->
<svg xmlns="http://www.w3.org/2000/svg"><defs>
${symbols.join("\n")}
</defs></svg>
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, sprite, "utf8");
console.log(`Generated ${iconNames.length} Lucide symbols at ${outputPath}`);
