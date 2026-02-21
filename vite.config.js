import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // 環境変数が未設定でもクラッシュしないようにフォールバック
    "import.meta.env.VITE_ANTHROPIC_KEY": JSON.stringify(process.env.VITE_ANTHROPIC_KEY || ""),
  },
});