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
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, text, html }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || result.error?.message || "Erreur lors de l'envoi de l'e-mail");
      }

      return result;
    } catch (error: any) {
      console.error("Email Service Error:", error);
      throw error;
    }
  }
};
