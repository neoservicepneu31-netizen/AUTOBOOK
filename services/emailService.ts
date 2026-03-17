/**
 * Service pour l'envoi d'e-mails via le backend Express
 */

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const emailService = {
  /**
   * Envoie un e-mail via l'API du serveur
   */
  send: async ({ to, subject, text, html }: SendEmailParams) => {
    console.log(`Attempting to send email to ${to}...`);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, text, html }),
      });

      const responseText = await response.text();
      console.log(`Server response (${response.status}):`, responseText);

      if (!responseText) {
        throw new Error(`Le serveur a renvoyé une réponse vide (${response.status}).`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse server response as JSON:", responseText);
        throw new Error(`Le serveur a renvoyé une réponse invalide (${response.status}).`);
      }
      
      if (!response.ok) {
        throw new Error(result.message || result.error?.message || `Erreur serveur (${response.status})`);
      }

      return result;
    } catch (error: any) {
      console.error("Email Service Error:", error);
      // Ensure we don't return the cryptic "Unexpected end of JSON input"
      if (error.message && error.message.includes("Unexpected end of JSON input")) {
        throw new Error("Le serveur a interrompu la connexion sans répondre.");
      }
      throw error;
    }
  }
};
