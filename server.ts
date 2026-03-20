import express from "express";
import cors from "cors";
import { Resend } from "resend";
import { createServer as createViteServer } from "vite";
import path from "path";
import process from "process";

async function startServer() {
  console.log("Starting AutoBook Server v1.1...");
  const app = express();
  const PORT = 3000;
  
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.1" });
  });

  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working", timestamp: new Date().toISOString() });
  });

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  // API Route for sending emails
  app.post(["/api/send-email", "/api/send-email/"], async (req, res) => {
    console.log("Incoming POST request to /api/send-email");
    console.log("Body:", JSON.stringify(req.body));
    const { to, subject, html, text } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, message: "Destinataire (to) manquant." });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing in environment variables.");
      return res.status(500).json({ 
        success: false, 
        message: "Le service d'e-mail n'est pas configuré (RESEND_API_KEY manquante)." 
      });
    }

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
      
      // Ensure 'from' follows the required format: 'Name <email@example.com>' or 'email@example.com'
      let from = fromEmail;
      if (fromEmail === "onboarding@resend.dev") {
        from = "onboarding@resend.dev";
      } else if (!fromEmail.includes("<") && fromEmail.includes("@")) {
        from = `AutoBook <${fromEmail}>`;
      } else if (fromEmail.includes("<") && fromEmail.includes(">")) {
        // Already in 'Name <email@example.com>' format
        from = fromEmail;
      }
      
      const { data, error } = await resend.emails.send({
        from: from,
        to: [to],
        subject: subject,
        html: html || `<p>${text}</p>`,
        text: text,
      });

      if (error) {
        console.error("Resend Error Details:", JSON.stringify(error, null, 2));
        
        let userMessage = error.message || "Erreur lors de l'envoi de l'e-mail.";
        
        // Check for common Resend testing restrictions in the whole error object
        const errorString = JSON.stringify(error).toLowerCase();
        if (errorString.includes("testing emails") || errorString.includes("own email address") || errorString.includes("verify a domain")) {
          userMessage = "Mode Test Resend : Vous ne pouvez envoyer des mails qu'à votre propre adresse (neoservicepneu31@gmail.com). Pour envoyer à d'autres clients, vous devez valider votre domaine sur resend.com/domains.";
        } else if (error.name === 'validation_error') {
          userMessage = `Erreur de validation Resend : ${error.message || "Vérifiez les adresses e-mail."}`;
        }
        
        return res.status(400).json({ success: false, message: userMessage, error });
      }

      res.json({ success: true, data });
    } catch (err: any) {
      console.error("Server Error:", err);
      res.status(500).json({ success: false, message: err.message });
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
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Production mode: serving static files from ${distPath}`);
    
    app.use(express.static(distPath));
    
    // Fallback for SPA: serve index.html for any non-API GET request
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.')) {
        console.log(`Fallback: serving index.html for ${req.path}`);
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global Error Handler:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Une erreur interne est survenue sur le serveur.",
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
