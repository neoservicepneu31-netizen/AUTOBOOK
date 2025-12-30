
import { GoogleGenAI, Type } from "@google/genai";
import { Car, ManufacturerSpecs, TechnicalSpecs } from "../types";

/**
 * Compresse fortement le fichier pour garantir la visibilité malgré les limites de stockage (5MB)
 */
export const processFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Si c'est un PDF, on le garde tel quel mais on vérifie la taille
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        if (file.size > 2 * 1024 * 1024) {
          alert("Ce PDF est trop lourd (>2Mo). Il risque de ne pas s'afficher correctement après sauvegarde.");
        }
        resolve(result);
        return;
      }

      // Pour les images : Compression forte (Crucial pour Vercel/Mobile)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800; // Taille réduite pour économiser 80% d'espace
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
          // Qualité 0.4 : Divise le poids par 10 tout en restant lisible
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

/**
 * Fonction de secours pour l'affichage (évite les crashs si le base64 est corrompu)
 */
export const safeBase64ToBlobUrl = (base64Data: string): string => {
  try {
    if (!base64Data || !base64Data.startsWith('data:')) return base64Data;
    // On retourne directement la dataURI pour plus de fiabilité sur les petits fichiers
    return base64Data;
  } catch (e) {
    console.error("Erreur de rendu document:", e);
    return "";
  }
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
