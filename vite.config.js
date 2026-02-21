import { defineConfig } from “vite”;
import react from “@vitejs/plugin-react”;

export default defineConfig({
plugins: [react()],
define: {
“window.**ANTHROPIC_KEY**”: JSON.stringify(process.env.VITE_ANTHROPIC_KEY || “”),
},
});