
import { GoogleGenAI, Type } from "@google/genai";
import { Car, ManufacturerSpecs, TechnicalSpecs } from "../types";

const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("API Key detection skipped.");
  }
  return '';
};

const API_KEY = getApiKey();

export const processFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        } else {
          reject(new Error("Canvas context error"));
        }
      };
      img.onerror = () => reject(new Error("Image load error"));
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const fileToGenerativePart = async (file: File): Promise<string> => {
  if (file.type.startsWith('image/')) {
    const compressedDataUrl = await processFile(file);
    return compressedDataUrl.split(',')[1];
  } else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};

const cleanJsonString = (text: string): string => {
  let clean = text.replace(/```json/g, '').replace(/```/g, '');
  return clean.trim();
};

export const analyzeInvoiceImage = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  if (!API_KEY) {
    return { type: 'maintenance', title: "Saisie Manuelle (No API Key)", date: new Date().toISOString().split('T')[0], km: 0, price: 0 };
  }
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType.startsWith('image') ? 'image/jpeg' : mimeType, data: base64Data } },
          { text: `Analyse cette facture auto. Extrais: type (fuel/maintenance), titre, date, km, prix, volume. Extrais aussi specs techniques (pneus, huile).` }
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
            specs: { type: Type.OBJECT, properties: { tireDimensions: { type: Type.STRING }, oilViscosity: { type: Type.STRING } }, nullable: true }
          }
        }
      }
    });
    return JSON.parse(cleanJsonString(response.text));
  } catch (error) {
    return { type: 'maintenance', title: "Erreur Analyse", date: new Date().toISOString().split('T')[0], km: 0, price: 0 };
  }
};

export const getPersonalizedMaintenance = async (car: Car, currentKm: number): Promise<ManufacturerSpecs> => {
  if (!API_KEY) {
    return { tirePressure: "2.4 bar", oilType: "5W30", checkPoints: ["Niveau Huile", "Pression Pneus", "Lave-glace"] };
  }
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const prompt = `
      Expert Mécanique NSP. Véhicule: ${car.name}, Moteur: ${car.fuelType}, Km: ${currentKm}.
      Donne 3 points de contrôle de CONFORMITÉ et SÉCURITÉ spécifiques à ce modèle pour le maintenir en parfait état.
      Ajoute une instruction technique courte pour aider l'utilisateur (ex: localisation bouchon, type de liquide).
      Réponds en Français.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
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
    return JSON.parse(cleanJsonString(response.text));
  } catch (e) {
    return { tirePressure: "2.5 bar", oilType: "Standard", checkPoints: ["Pneus", "Huile", "Lave-glace"] };
  }
};
