export type EmbedFn = (text: string) => Promise<Float32Array>;

let embedFn: EmbedFn | null = null;

export async function initEmbedder(): Promise<void> {
  if (embedFn) return;

  // Import dynamique pour eviter de charger le modele au demarrage des tests
  const { pipeline } = await import('@huggingface/transformers');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  embedFn = async (text: string): Promise<Float32Array> => {
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    const data = output.tolist()[0] as number[];
    return new Float32Array(data);
  };
}

export function getEmbedder(): EmbedFn {
  if (!embedFn) {
    throw new Error('Embedder non initialise. Appeler initEmbedder() d\'abord.');
  }
  return embedFn;
}

export function setEmbedder(fn: EmbedFn): void {
  embedFn = fn;
}
