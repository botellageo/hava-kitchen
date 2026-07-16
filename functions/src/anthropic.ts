import Anthropic from '@anthropic-ai/sdk';

/**
 * Champs extraits d'une étiquette fournisseur par Claude Vision.
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
 * Appelle Claude Vision pour extraire les champs d'une étiquette fournisseur.
 *
 * @param apiKey clé API Anthropic (depuis Firebase secret)
 * @param imageBase64 image encodée base64 (sans préfixe data:)
 * @param mediaType type MIME de l'image
 */
export async function ocrLabelImage(
  apiKey: string,
  imageBase64: string,
  mediaType: MediaType,
): Promise<OcrLabelResult> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          { type: 'text', text: OCR_PROMPT },
        ],
      },
    ],
  });

  const firstBlock = response.content[0];
  if (!firstBlock || firstBlock.type !== 'text') {
    throw new Error('Réponse Claude inattendue (pas de texte)');
  }

  // Robuste : retirer d'éventuels code fences markdown qu'on demande pourtant d'omettre
  let text = firstBlock.text.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Claude n'a pas retourné un JSON valide");
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
