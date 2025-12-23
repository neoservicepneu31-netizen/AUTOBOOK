
import { GoogleGenAI, Type } from "@google/genai";
import { Car, ManufacturerSpecs, TechnicalSpecs } from "../types";

// Accès sécurisé à la clé API compatible Vite/Browser/Node/Cloud
const getApiKey = () => {
  try {
    // 1. Essai import.meta (Vite/Modern Bundlers)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
    
    // 2. Essai process.env avec vérification stricte (Node/Cloud Build)
    // Le check typeof process est vital pour éviter le crash "ReferenceError: process is not defined"
    if (typeof process !== 'undefined' && process && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("API Key detection skipped in this environment.");
  }
  return '';
};

const API_KEY = getApiKey();

// Helper to compress image before usage/storage
// OPTIMISATION: Réduction à 800px et qualité 0.6 pour économiser le LocalStorage
export const processFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize agressif pour le stockage local (Max 800px)
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
          // Compress to JPEG 60% quality pour maximiser l'espace
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

// Helper to convert file to base64 (Raw, no data prefix) for Gemini API
export const fileToGenerativePart = async (file: File): Promise<string> => {
  if (file.type.startsWith('image/')) {
    // For images, we use the compressed version to save bandwidth/tokens
    const compressedDataUrl = await processFile(file);
    return compressedDataUrl.split(',')[1];
  } else {
    // For PDFs, use original reader
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

// Helper to clean JSON string from Markdown code blocks
const cleanJsonString = (text: string): string => {
  let clean = text.replace(/```json/g, '').replace(/```/g, '');
  return clean.trim();
};

export const analyzeInvoiceImage = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  if (!API_KEY) {
    console.warn("API Key manquante - Mode Simulation");
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      type: 'maintenance',
      title: "Document Analysé (Simulé)",
      date: new Date().toISOString().split('T')[0],
      km: 125000,
      price: 150.00,
      volume: 0,
      specs: { tireDimensions: "205/55 R16", oilViscosity: "5W30" } // Mock specs
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType.startsWith('image') ? 'image/jpeg' : mimeType, data: base64Data } },
          {
            text: `Analyse ce document (Facture entretien ou Ticket carburant). 
            Extrais les informations classiques (Type, Date, Prix, Km).

            IMPORTANT - DÉTECTION TYPE :
            - Si c'est un ticket de caisse d'essence/gasoil -> type = 'fuel'.
            - Si c'est un procès verbal de CONTRÔLE TECHNIQUE (ou mention 'CT', 'Visite Périodique') -> Le titre DOIT être "Contrôle Technique".
            
            SURTOUT, analyse le contenu des lignes de facturation pour trouver des CARACTÉRISTIQUES TECHNIQUES du véhicule si elles apparaissent :
            - Dimensions des pneus (ex: 205/55 R16 91V) -> 'tireDimensions'
            - Viscosité huile moteur (ex: 5W30, 10W40) -> 'oilViscosity'
            - Référence Batterie -> 'batteryRef'
            - Référence Essuie-glaces -> 'wiperRef'
            
            Retourne le tout en JSON valide.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['maintenance', 'fuel'] },
            title: { type: Type.STRING },
            date: { type: Type.STRING },
            km: { type: Type.NUMBER },
            price: { type: Type.NUMBER },
            volume: { type: Type.NUMBER },
            specs: {
              type: Type.OBJECT,
              properties: {
                tireDimensions: { type: Type.STRING, nullable: true },
                oilViscosity: { type: Type.STRING, nullable: true },
                batteryRef: { type: Type.STRING, nullable: true },
                wiperRef: { type: Type.STRING, nullable: true },
              },
              nullable: true
            }
          }
        }
      }
    });

    if (response.text) {
      try {
        return JSON.parse(cleanJsonString(response.text));
      } catch (jsonError) {
        console.error("JSON Parse Error:", jsonError);
        throw new Error("Invalid JSON format from Gemini");
      }
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Retour par défaut en cas d'erreur ou quota
    return { 
      type: 'maintenance',
      title: "Document non lu (Saisie manuelle)", 
      date: new Date().toISOString().split('T')[0], 
      km: 0, 
      price: 0,
      volume: 0
    };
  }
};

// Fonction pour générer les préconisations constructeurs personnalisées
export const getPersonalizedMaintenance = async (car: Car, currentKm: number): Promise<ManufacturerSpecs> => {
  if (!API_KEY) {
    return {
      tirePressure: "AV: 2.4 bar / AR: 2.4 bar",
      oilType: car.specs?.oilViscosity || "5W30 Synthétique", // Utilise la mémoire si dispo
      checkPoints: ["Vérification Niveaux", "Usure Plaquettes", "Pression Pneus"]
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    // Prompt traduit en français pour garantir une réponse en français
    const prompt = `
      Agis comme un mécanicien expert automobile disposant des données constructeurs.
      Véhicule : Immatriculation commençant par ${car.plate.substring(0,2)}, Carburant : ${car.fuelType}.
      Données connues : Huile=${car.specs?.oilViscosity || 'Inconnue'}, Pneus=${car.specs?.tireDimensions || 'Inconnus'}.
      Kilométrage actuel : ${currentKm} km.
      État signalé : Pneus=${car.initialState.tires}, Freins=${car.initialState.brakes}, Carrosserie=${car.initialState.body}.

      Fournis des recommandations de maintenance précises en FRANÇAIS basées sur les standards constructeurs pour ce type de véhicule à ce kilométrage.
      
      1. Pression des pneus recommandée (plage en bar).
      2. Type d'huile recommandé (viscosité).
      3. Liste de 3 points de vigilance (checkPoints) spécifiques à vérifier MAINTENANT vu le kilométrage et l'état déclaré.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tirePressure: { type: Type.STRING, description: "Pression recommandée ex: '2.4 bar'" },
            oilType: { type: Type.STRING, description: "Type huile ex: '5W30'" },
            checkPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste de 3 points de vigilance en Français" }
          }
        }
      }
    });

    if (response.text) {
      try {
        return JSON.parse(cleanJsonString(response.text));
      } catch (e) {
        console.error("JSON Parse Error Specs:", e);
        throw e;
      }
    }
    throw new Error("No specs generated");
  } catch (e) {
    console.warn("Gemini Specs Fallback:", e);
    return {
      tirePressure: "2.5 bar (Standard)",
      oilType: "Voir carnet",
      checkPoints: ["Pression Pneus", "Niveau Huile", "Liquide Frein"]
    };
  }
};
