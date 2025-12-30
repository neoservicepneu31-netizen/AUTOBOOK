
import { GoogleGenAI, Type } from "@google/genai";
import { Car, ManufacturerSpecs, TechnicalSpecs } from "../types";

// Utilitaire pour compresser et convertir l'image en base64 de haute qualité
export const processFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Optimisation pour l'OCR (Gemini aime les images larges mais pas trop lourdes)
        const MAX_SIZE = 2000; 
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = width * (MAX_SIZE / height);
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } else {
          reject(new Error("Erreur de rendu canvas"));
        }
      };
      img.onerror = () => reject(new Error("Erreur de chargement de l'image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    reader.readAsDataURL(file);
  });
};

export const fileToGenerativePart = async (file: File): Promise<string> => {
  if (file.type.startsWith('image/')) {
    const compressedDataUrl = await processFile(file);
    return compressedDataUrl.split(',')[1];
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Analyse IA multimodale optimisée pour documents automobiles
export const analyzeInvoiceImage = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  // CRITICAL: New instance for each call with the latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: mimeType.startsWith('image') ? 'image/jpeg' : mimeType, 
              data: base64Data 
            } 
          },
          { 
            text: "Tu es un assistant expert en gestion de flotte automobile. Analyse ce document (facture, reçu, ticket de caisse). Extrais les données au format JSON strict avec les clés : type ('maintenance' ou 'fuel'), title (nom du garage ou enseigne), date (YYYY-MM-DD), km (nombre entier), price (nombre décimal), volume (nombre de litres si carburant), specs (objet avec: tireDimensions, oilViscosity, batteryRef si détectés)." 
          }
        ]
      },
      config: {
        systemInstruction: "Tu es un expert en lecture de documents de garage. Tu extrais uniquement les données financières et techniques réelles. Si une donnée est illisible, laisse-la vide ou à 0 pour les nombres.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            title: { type: Type.STRING },
            date: { type: Type.STRING },
            km: { type: Type.NUMBER },
            price: { type: Type.NUMBER },
            volume: { type: Type.NUMBER },
            specs: { 
              type: Type.OBJECT, 
              properties: { 
                tireDimensions: { type: Type.STRING }, 
                oilViscosity: { type: Type.STRING }, 
                batteryRef: { type: Type.STRING } 
              } 
            }
          },
          required: ["type", "title", "date", "km", "price"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Réponse vide de l'IA");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Scan Error:", error);
    throw error;
  }
};

export const getPersonalizedMaintenance = async (car: Car, currentKm: number): Promise<ManufacturerSpecs> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Génère les préconisations d'entretien JSON pour un véhicule ${car.name} (${car.fuelType}) à ${currentKm} km.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tirePressure: { type: Type.STRING },
            oilType: { type: Type.STRING },
            checkPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return response.text ? JSON.parse(response.text) : { tirePressure: "2.5 bar", oilType: "5W30", checkPoints: ["Vidange", "Pneus"] };
  } catch {
    return { tirePressure: "2.5 bar", oilType: "5W30", checkPoints: ["Vidange", "Pneus"] };
  }
};
