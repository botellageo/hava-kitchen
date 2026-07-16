import { GoogleGenAI } from '@google/genai';

/**
 * Champs extraits d'une étiquette fournisseur par Gemini Vision.
 * Tous les champs métier sont optionnels (l'IA peut ne pas voir ou n'être pas sûre).
 * Seul `produit` est garanti non-null car c'est l'info la plus visible.
 */
export interface OcrLabelResult {
  produit: string;
  fournisseur: string | null;
  lot: string | null;
  qte: string | null;
  /** ISO date YYYY-MM-DD si lisible, sinon null */
  dlc: string | null;
}

const OCR_PROMPT = `You are analyzing a supplier label photo for a French restaurant's HACCP food traceability system.

Extract the following information from the label visible in the image and return ONLY a valid JSON object with these exact keys:
- produit (string): product name in French as printed (e.g. "Entrecôtes parées 250 g")
- fournisseur (string or null): supplier company name if visible (e.g. "Bigard", "Pomona TerreAzur", "Metro")
- lot (string or null): lot/batch number, often labeled "Lot", "Batch" or "N°"
- qte (string or null): quantity with unit (e.g. "4 kg", "12 unités", "500 g")
- dlc (string or null): expiration date in ISO format YYYY-MM-DD. DLC means "Date Limite de Consommation" (use by date). Convert any French date format (DD/MM/YYYY, DD-MM-YYYY) to ISO YYYY-MM-DD.

Rules:
- If a field is not visible or unclear, return null for it (except produit which must be a string, "Inconnu" if absolutely no product name).
- Return ONLY the JSON object, no markdown formatting, no prose, no explanation, no code fences.
- Do not invent or guess data not visible on the label.

Example output:
{"produit":"Tartare de saumon Label Rouge","fournisseur":"Pomona","lot":"L-260514-N","qte":"500 g","dlc":"2026-05-17"}`;

type MediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

/**
 * Appelle Gemini (via Vertex AI) pour extraire les champs d'une étiquette fournisseur.
 *
 * Auth : Application Default Credentials du compte de service de la Cloud Function —
 * aucune clé API. Facturé sur le projet GCP courant (une seule facture Google
 * pour un client stand-alone). Prérequis : API `aiplatform.googleapis.com` activée.
 *
 * @param imageBase64 image encodée base64 (sans préfixe data:)
 * @param mediaType type MIME de l'image
 */
export async function ocrLabelImage(
  imageBase64: string,
  mediaType: MediaType,
): Promise<OcrLabelResult> {
  const project = process.env['GCLOUD_PROJECT'] ?? process.env['GOOGLE_CLOUD_PROJECT'];
  if (!project) {
    throw new Error("GCLOUD_PROJECT introuvable dans l'environnement");
  }
  const client = new GoogleGenAI({ vertexai: true, project, location: 'global' });

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ inlineData: { mimeType: mediaType, data: imageBase64 } }, { text: OCR_PROMPT }],
      },
    ],
    config: {
      temperature: 0,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
      // OCR pur : pas besoin de raisonnement, et le thinking consommerait maxOutputTokens
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  let text = response.text?.trim() ?? '';
  if (!text) {
    throw new Error('Réponse Gemini inattendue (pas de texte)');
  }

  // Robuste : retirer d'éventuels code fences markdown qu'on demande pourtant d'omettre
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini n'a pas retourné un JSON valide");
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Réponse JSON inattendue');
  }
  const obj = parsed as Record<string, unknown>;

  const produit =
    typeof obj.produit === 'string' && obj.produit.trim() ? obj.produit.trim() : 'Inconnu';
  const fournisseur =
    typeof obj.fournisseur === 'string' && obj.fournisseur.trim() ? obj.fournisseur.trim() : null;
  const lot = typeof obj.lot === 'string' && obj.lot.trim() ? obj.lot.trim() : null;
  const qte = typeof obj.qte === 'string' && obj.qte.trim() ? obj.qte.trim() : null;
  const dlc = typeof obj.dlc === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.dlc) ? obj.dlc : null;

  return { produit, fournisseur, lot, qte, dlc };
}
