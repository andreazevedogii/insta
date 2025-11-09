
export interface GeneratedArtwork {
  id: string;
  sourceImage?: string; // The original room or image to be edited
  generatedImage: string; // The AI-generated art
  prompt: string;
  mode: GenerationMode;
  timestamp: number;
}

export type Page = 'home' | 'generate' | 'gallery';

export type GenerationMode = 'fromRoom' | 'edit' | 'fromText';
