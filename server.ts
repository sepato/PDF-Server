import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("pdfs.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS pdfs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content BLOB NOT NULL,
    greeting TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/pdfs", (req, res) => {
    const pdfs = db.prepare("SELECT id, name, created_at FROM pdfs ORDER BY created_at DESC").all();
    res.json(pdfs);
  });

  app.post("/api/pdfs", (req, res) => {
    const { name, content, greeting } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: "Name and content are required" });
    }

    try {
      // Content is expected to be a base64 string from the frontend
      const buffer = Buffer.from(content, 'base64');
      const info = db.prepare("INSERT INTO pdfs (name, content, greeting) VALUES (?, ?, ?)").run(name, buffer, greeting || "");
      res.json({ id: info.lastInsertRowid, name });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload PDF" });
    }
  });

  app.get("/api/pdfs/:id", (req, res) => {
    const pdf = db.prepare("SELECT * FROM pdfs WHERE id = ?").get(req.params.id) as any;
    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" });
    }
    
    // Convert buffer to base64 for the frontend
    const base64Content = pdf.content.toString('base64');
    res.json({
      id: pdf.id,
      name: pdf.name,
      content: base64Content,
      greeting: pdf.greeting,
      created_at: pdf.created_at
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
