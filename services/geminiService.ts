
import { GoogleGenAI, Type } from "@google/genai";
import { Car, ManufacturerSpecs, TechnicalSpecs } from "../types";

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export const processFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Si c'est un PDF, on renvoie le base64 tel quel
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        resolve(result);
        return;
      }

      // Si c'est une image, on la redimensionne pour alléger le transfert Cloud/IA
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1200; // Augmenté pour une meilleure lecture IA sur mobile
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
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          // On réduit la qualité JPEG pour optimiser la bande passante sans perdre de lisibilité
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(result);
        }
      };
      img.onerror = () => {
        console.error("Image loading failed");
        resolve(result);
      };
      img.src = result;
    };
    
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      reject(err);
    };
    reader.readAsDataURL(file);
  });
};

export const base64ToBlob = (base64Data: string, contentType: string = ''): Blob => {
  const sliceSize = 512;
  const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const byteCharacters = atob(base64.trim());
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

export const safeBase64ToBlobUrl = (base64Data: string): string => {
  if (!base64Data) return "";
  if (base64Data.startsWith('http') || base64Data.startsWith('blob:')) return base64Data;
  
  try {
    const isPDF = base64Data.includes('application/pdf') || (base64Data.length > 20 && base64Data.substring(0, 30).includes('JVBER'));
    const mimeType = isPDF ? 'application/pdf' : 'image/jpeg';
    const blob = base64ToBlob(base64Data, mimeType);
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Blob conversion error", e);
    return base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
  }
};

export const base64ToRealBlobUrl = (base64: string, mimeType: string = 'application/pdf'): string => {
  return safeBase64ToBlobUrl(base64); // Unify implementation
};

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
          { text: `Extraire précisément en JSON strict : 
          { 
            "type": "maintenance" | "fuel", 
            "title": "Nom du garage ou type d'intervention", 
            "date": "YYYY-MM-DD", 
            "km": entier, 
            "price": total décimal, 
            "specs": { 
              "tireDimensions": "ex: 205/55 R16 91V", 
              "oilViscosity": "ex: 5W30",
              "oilQuantity": "ex: 4.5L", 
              "batteryRef": "ex: L3 70Ah 720A",
              "filterRefs": ["liste des refs filtres trouvées ex: Purflux LS932"],
              "mechanicalParts": ["liste des pièces ex: Disques freins Brembo"]
            } 
          }` }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text?.trim() || '{}');
  } catch (error: any) {
    if (error?.status === 429 && retryCount < 3) {
        await wait(2000 * (retryCount + 1));
        return analyzeInvoiceImage(base64Data, mimeType, retryCount + 1);
    }
    throw error;
  }
};

export const getPersonalizedMaintenance = async (car: Car, currentKm: number): Promise<ManufacturerSpecs> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Tu es un ingénieur expert pour ${car.name}. 
    Donne les spécifications techniques officielles en JSON strict :
    {
      "tirePressureFront": "valeur en bar",
      "tirePressureRear": "valeur en bar",
      "oilType": "viscosité exacte",
      "maintenanceIntervalKm": intervalle en km (entier),
      "timingBeltIntervalKm": intervalle courroie en km (si applicable),
      "coolantType": "type de liquide",
      "checkPoints": ["point 1", "point 2"]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text?.trim() || '{}');
  } catch {
    return { 
      tirePressureFront: "2.3 bar", 
      tirePressureRear: "2.1 bar", 
      oilType: "5W30", 
      maintenanceIntervalKm: 20000, 
      coolantType: "Universel",
      checkPoints: ["Niveaux", "Freins", "Pneus"] 
    };
  }
};
