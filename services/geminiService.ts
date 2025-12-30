
import { GoogleGenAI, Type } from "@google/genai";
import { Car, ManufacturerSpecs, TechnicalSpecs } from "../types";

// Utilitaire pour compresser l'image uniquement si c'est une image
export const processFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1600; 
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const fileToGenerativePart = async (file: File): Promise<string> => {
  const base64Data = await processFile(file);
  return base64Data.split(',')[1];
};

export const analyzeInvoiceImage = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  // Initialisation strictement conforme aux instructions
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg', 
              data: base64Data 
            } 
          },
          { 
            text: "Analyse cette facture automobile. Extrais : type ('maintenance' ou 'fuel'), title (garage), date (YYYY-MM-DD), km (entier), price (decimal), volume (si fuel), specs (objet: tireDimensions, oilViscosity, batteryRef). Retourne un JSON pur." 
          }
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

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
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
          },
          required: ["tirePressure", "oilType", "checkPoints"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch {
    return { tirePressure: "2.5 bar", oilType: "5W30", checkPoints: ["Niveaux", "Pneus"] };
  }
};
