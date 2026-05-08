import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as geminiService from "./services/geminiService";
import * as aiService from "./services/aiService";
import * as searchService from "./services/searchService";
import * as admissionTrackerService from "./services/admissionTrackerService";
import { getVertexAIInstance } from "./services/vertexService";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  console.log("Server: Starting initialization...");
  const app = express();
  
  // FIXED: Cloud Run provides the port via process.env.PORT. Fallback to 3000 for local dev.
  const PORT = process.env.PORT || 3000;

  // Initialize Vertex AI if configured (server-side only)
  try {
    console.log("Server: Initializing AI services...");
    const vertexInstance = getVertexAIInstance();
    if (vertexInstance) {
      geminiService.setServerAIInstance(vertexInstance);
      console.log("Vertex AI Service: initialized and registered.");
    } else {
      console.log("Vertex AI Service: Not configured (missing Project ID). Falling back to Gemini API Key.");
    }
  } catch (err) {
    console.error("Vertex AI Service: Failed to initialize:", err);
    console.log("Continuing with Gemini API fallback...");
  }

  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Generic AI Proxy Endpoint
  app.post("/api/ai/generateContent", async (req: any, res: any) => {
    const { params, feature } = req.body;
    try {
      const ai = geminiService.getAIInstance(feature);
      if (!ai) throw new Error("AI Instance not initialized");
      const result = await ai.models.generateContent(params);
      res.json({ text: result.text });
    } catch (error: any) {
      console.error(`Error in generic AI proxy (${feature}):`, error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // AI Proxy Endpoint
  app.post("/api/ai/:action", async (req: any, res: any) => {
    const { action } = req.params;
    const body = req.body;

    try {
      let result;
      switch (action) {
        case 'chat-stream':
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          
          const stream = geminiService.streamGeminiChat(body.message, body.history, body.attachment);
          for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          res.end();
          return;
        
        case 'news':
          result = await geminiService.fetchLiveNews();
          break;
        case 'summarize':
          result = await aiService.summarizeNews(body.content);
          break;
        case 'bio':
          result = await geminiService.getUniversityDetailedInfo(body.name);
          break;
        case 'courses':
          result = await geminiService.getUniversityCourses(body.university);
          break;
        case 'cutoff':
          result = await geminiService.getCourseCutoffInfo(body.university, body.course, body.score, body.oLevels, body.userRole);
          break;
        case 'scoring':
          result = await geminiService.getUniversityScoringSystem(body.university);
          break;
        case 'tracker':
          result = await geminiService.getPostUtmeDates(body.university);
          break;
        case 'strike':
          result = await geminiService.getAsuuStrikeStatus();
          break;
        case 'scholarships':
          result = await geminiService.getScholarships(body.category);
          break;
        case 'jobs':
          result = await geminiService.getJobOpenings(body.field);
          break;
        case 'briefing':
          result = await geminiService.generateMorningBriefing();
          break;
        case 'cbt':
          result = await geminiService.findCBTCenters(body.lat, body.lng);
          break;
        case 'videoScript':
          result = await geminiService.generateNewsVideoScript(body.news);
          break;
        case 'timeline':
          result = await admissionTrackerService.getAdmissionTimeline(body.university, body.isPremium);
          break;
        case 'search':
          result = await searchService.searchWeb(body.query);
          break;
        default:
          return res.status(404).json({ error: "Action not found" });
      }
      res.json(result);
    } catch (error: any) {
      console.error(`Error in AI action ${action}:`, error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // FIXED: Ensure path points to the correct build output folder
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // FIXED: Using "0.0.0.0" is essential for Cloud Run to route traffic to the container
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`\n🚀 CampusAI is live!`);
    console.log(`📡 Listening on port: ${PORT}`);
    console.log(`🛠️ Mode: ${process.env.NODE_ENV || 'production'}\n`);
  });
}

startServer();