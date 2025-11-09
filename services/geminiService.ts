
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
  
const getMimeType = (file: File): string => file.type;

export const generateImageFromText = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    throw new Error("No image was generated.");
  } catch (error) {
    console.error("Error generating image from text:", error);
    throw new Error("Failed to generate image. Please try again.");
  }
};


export const editImage = async (imageFile: File, prompt: string): Promise<string> => {
    const base64ImageData = await fileToBase64(imageFile);
    const mimeType = getMimeType(imageFile);
    
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64ImageData,
                  mimeType: mimeType,
                },
              },
              {
                text: prompt,
              },
            ],
          },
          config: {
              responseModalities: [Modality.IMAGE],
          },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No edited image was returned.");
    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit image. Please try again.");
    }
};

export const generateArtForRoom = async (roomImageFile: File, userPrompt: string): Promise<string> => {
  const base64ImageData = await fileToBase64(roomImageFile);
  const mimeType = getMimeType(roomImageFile);
  
  try {
    const roomDescriptionPrompt = `Analyze this image of a room. Describe its style, mood, and primary colors in a short, descriptive prompt suitable for an AI image generator. Focus on art styles that would complement the room. For example: 'A vibrant abstract expressionist painting with bold strokes of blue and gold to contrast the room's neutral palette.'`;

    const descriptionResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ inlineData: { data: base64ImageData, mimeType } }, { text: roomDescriptionPrompt }] },
    });
    
    const styleDescription = descriptionResponse.text;

    const finalPrompt = `Generate a piece of art based on the following style: ${styleDescription}. The user also requested: "${userPrompt}". Combine these ideas into a beautiful, high-resolution digital artwork.`;
    
    return await generateImageFromText(finalPrompt);

  } catch (error) {
    console.error("Error generating art for room:", error);
    throw new Error("Failed to generate art for the room. Please try a different image or prompt.");
  }
};
