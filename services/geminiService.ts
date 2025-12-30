
import { GoogleGenAI, Type } from "@google/genai";
import { Car, ManufacturerSpecs, TechnicalSpecs } from "../types";

// Utilitaire pour compresser et convertir l'image en base64
export const processFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1600; 
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
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          reject(new Error("Erreur de rendu"));
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const fileToGenerativePart = async (file: File): Promise<string> => {
  if (file.type.startsWith('image/')) {
    const compressedDataUrl = await processFile(file);
    return compressedDataUrl.split(',')[1];
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
};

// Analyse d'un document automobile (Facture ou reçu carburant)
export const analyzeInvoiceImage = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  // On instancie l'IA au moment de l'appel avec la clé d'environnement
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType.startsWith('image') ? 'image/jpeg' : mimeType, data: base64Data } },
          { text: "Tu es un expert automobile. Analyse ce document (facture de garage, ticket carburant, reçu d'entretien). Extrais précisément les informations en JSON strict avec les clés suivantes : type (valeur: 'fuel' ou 'maintenance'), title (nom du garage ou de l'enseigne), date (format YYYY-MM-DD), km (kilométrage numérique), price (montant total TTC numérique), volume (nombre de litres si carburant), specs (objet avec tireDimensions, oilViscosity, batteryRef si visibles)." }
        ]
      },
      config: {
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
    return text ? JSON.parse(text) : null;
  } catch (error: any) {
    console.error("Erreur Scan IA:", error);
    throw error;
  }
};

export const getPersonalizedMaintenance = async (car: Car, currentKm: number): Promise<ManufacturerSpecs> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Génère les préconisations d'entretien pour un véhicule ${car.name} (${car.fuelType}) à ${currentKm} km. Réponds en JSON.`,
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
    const text = response.text;
    return text ? JSON.parse(text) : { tirePressure: "2.5 bar", oilType: "5W30", checkPoints: ["Vidange", "Pneus"] };
  } catch {
    return { tirePressure: "2.5 bar", oilType: "5W30", checkPoints: ["Vidange", "Pneus"] };
  }
};
