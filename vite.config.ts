import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

function getBuildVersion(): string {
  const path = join(process.cwd(), "public", "version.json");
  if (!existsSync(path)) return "dev";
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    return data?.version ?? "dev";
  } catch {
    return "dev";
  }
}

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(getBuildVersion()),
  },
});
