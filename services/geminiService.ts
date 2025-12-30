
import { GoogleGenAI, Type } from "@google/genai";
import { Car, ManufacturerSpecs, TechnicalSpecs } from "../types";

// Fonction utilitaire pour attendre (Backoff)
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export const processFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Taille réduite pour économiser la bande passante sur 10 000 users
        const MAX_SIZE = 700; 
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
          resolve(canvas.toDataURL('image/jpeg', 0.4));
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

export const safeBase64ToBlobUrl = (base64Data: string): string => {
  if (!base64Data) return "";
  if (base64Data.startsWith('data:')) return base64Data;
  const isPDF = base64Data.length > 100 && base64Data.substring(0, 10).includes('JVBER');
  const prefix = isPDF ? 'data:application/pdf;base64,' : 'data:image/jpeg;base64,';
  return `${prefix}${base64Data}`;
};

// Analyse avec gestion de la file d'attente (Retry si serveur surchargé)
export const analyzeInvoiceImage = async (base64Data: string, mimeType: string = 'image/jpeg', retryCount = 0): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const finalMime = mimeType.includes('pdf') ? 'application/pdf' : 'image/jpeg';
  const pureBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: finalMime, data: pureBase64 } },
          { text: `Extraire en JSON strict: { type, title, date (YYYY-MM-DD), km (entier), price (total), specs: { tireDimensions, oilViscosity, batteryRef } }` }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text?.trim() || '{}');
  } catch (error: any) {
    // Si quota dépassé (429) et qu'on a fait moins de 3 essais
    if (error?.status === 429 && retryCount < 3) {
        await wait(2000 * (retryCount + 1)); // Attendre de plus en plus longtemps
        return analyzeInvoiceImage(base64Data, mimeType, retryCount + 1);
    }
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const getPersonalizedMaintenance = async (car: Car, currentKm: number): Promise<ManufacturerSpecs> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Génère préconisations JSON pour ${car.name} (${car.fuelType}) à ${currentKm} km: { tirePressure, oilType, checkPoints: [] }`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text?.trim() || '{}');
  } catch {
    return { tirePressure: "2.5 bar", oilType: "5W30", checkPoints: ["Niveaux", "Pneus"] };
  }
};
