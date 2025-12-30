
import { GoogleGenAI, Type } from "@google/genai";
import { Car, ManufacturerSpecs, TechnicalSpecs } from "../types";

export const processFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Si c'est un PDF, on renvoie le résultat brut tel quel
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        resolve(result);
        return;
      }

      // Si c'est une image, on compresse agressivement pour le localStorage (limite ~5Mo)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // On réduit la taille max pour éviter de saturer le localStorage
        const MAX_SIZE = 800; 
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
          // Qualité 0.5 pour maximiser le nombre de documents stockables
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const fileToGenerativePart = async (file: File): Promise<string> => {
  const base64Data = await processFile(file);
  return base64Data.split(',')[1];
};

export const analyzeInvoiceImage = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const finalMime = mimeType.includes('pdf') ? 'application/pdf' : 'image/jpeg';
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: finalMime, 
              data: base64Data 
            } 
          },
          { 
            text: `Analyse cette facture automobile. 
            Extraire strictement au format JSON :
            - type: 'maintenance' ou 'fuel'
            - title: nom du garage/enseigne
            - date: format YYYY-MM-DD
            - km: kilométrage (entier)
            - price: total (décimal)
            - volume: litres (si carburant)
            - specs: { tireDimensions, oilViscosity, batteryRef }
            Renvoie UNIQUEMENT le JSON.`
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

    return JSON.parse(response.text?.trim() || '{}');
  } catch (error) {
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
    return JSON.parse(response.text?.trim() || '{}');
  } catch {
    return { tirePressure: "2.5 bar", oilType: "5W30", checkPoints: ["Niveaux", "Pneus"] };
  }
};
