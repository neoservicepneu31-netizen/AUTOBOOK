import { GoogleGenAI, Type } from "@google/genai";
import { Car, ManufacturerSpecs, TechnicalSpecs } from "../types";

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
        const MAX_SIZE = 1200; 
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
          resolve(canvas.toDataURL('image/jpeg', 0.8));
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
  // Initialisation directe avec la clé API injectée par Vercel/Vite
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const finalMime = mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg';
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Modèle corrigé pour éviter la 404
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: finalMime, 
              data: base64Data 
            } 
          },
          { 
            text: `Analyse cette facture ou reçu automobile. 
            Extraire les informations suivantes de manière stricte au format JSON :
            - type: 'maintenance' ou 'fuel'
            - title: nom de l'entreprise/garage
            - date: format YYYY-MM-DD
            - km: kilométrage indiqué (entier)
            - price: montant TOTAL à payer (décimal)
            - volume: nombre de litres (si c'est du carburant, sinon null)
            - specs: objet contenant { tireDimensions, oilViscosity, batteryRef } si trouvés sur le document.
            
            IMPORTANT : Renvoie uniquement le code JSON, sans texte avant ou après.`
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

    const result = response.text?.trim();
    if (!result) throw new Error("L'IA a retourné une réponse vide.");
    return JSON.parse(result);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const getPersonalizedMaintenance = async (car: Car, currentKm: number): Promise<ManufacturerSpecs> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    const result = response.text?.trim();
    return JSON.parse(result || '{}');
  } catch {
    return { tirePressure: "2.5 bar", oilType: "5W30", checkPoints: ["Niveaux", "Pneus"] };
  }
};