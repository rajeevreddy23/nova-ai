import path from "path";
import express from "express";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import app from "./api/index.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

// Initialize Vite in Development Mode or Serve Static Files in Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nova AI premium service listening on port ${PORT}`);
  });
}

startServer();
