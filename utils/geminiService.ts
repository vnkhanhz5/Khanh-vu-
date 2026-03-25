import { GoogleGenAI } from "@google/genai";

export interface GenerationOptions {
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  imageSize: "1K" | "2K" | "4K";
  backgroundColor: string;
  isTransparent: boolean;
  customPrompt: string;
  lightDirection: string;
  showShadow: boolean;
  surfaceType: string;
  horizonStyle: string;
  backgroundImage?: string;
  backgroundImageMimeType?: string;
}

export async function transformProductImage(
  base64Image: string,
  mimeType: string,
  options: GenerationOptions
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const backgroundDesc = options.isTransparent 
    ? "on a transparent background (PNG style)" 
    : `on a clean, solid ${options.backgroundColor} background`;

  const lightShadowMap: Record<string, string> = {
    "top-left": "Light coming from the top-left",
    "top-right": "Light coming from the top-right",
    "top": "Light coming from directly above",
    "left": "Light coming from the left side",
    "right": "Light coming from the right side",
    "front": "Light coming from the front"
  };

  const lightDesc = lightShadowMap[options.lightDirection] || lightShadowMap["top-left"];
  
  const shadowPrompt = options.showShadow 
    ? `Add a "Premium European Cookware Studio Shadow":
       - DIFFUSED SPREAD: Create a soft, wide, natural diffused shadow that spreads slightly wider around the product base, similar to high-end European cookware brands.
       - OCCLUSION GRADIENT: The shadow should be darker near the base (subtle occlusion) and fade smoothly outward with very soft, feathered edges.
       - COLOR & TONE: Maintain a light grey tone for the shadow, avoiding pure black.
       - FIDELITY: Ensure the shadow is realistic and physically accurate based on the light source (${options.lightDirection}).
       - FORBID: No dramatic or hard shadows. Do not darken the overall background. Maintain a clean premium white studio aesthetic.`
    : "DO NOT add any cast shadows. The product should appear as if it's floating or in a shadowless environment, but still maintain its internal shading and reflections.";

  const surfaceDesc = options.surfaceType === 'solid' 
    ? `a solid ${options.backgroundColor} surface`
    : `a professional ${options.surfaceType} surface`;

  const horizonDesc = options.horizonStyle === 'seamless'
    ? "a seamless infinity transition between surface and background"
    : "a subtle, clean horizon line separating the surface from the background layer";

  const insertionLogic = options.backgroundImage 
    ? `
    INSERTION TASK:
    - Insert the product (from the first image) into the provided background scene (the second image).
    - PLACEMENT: Align correct perspective with the background. Realistic scale and position. Product must sit naturally on the surface (no floating).
    - LIGHTING: Strong, clean, high-contrast lighting (crisp, clear, commercial look). Light direction must match the background scene.
    - COLOR: Match scene white balance while keeping product color accurate.
    - STYLE: Minimal, clean, premium, airy composition. No clutter, no extra objects.
    `
    : `
    BACKGROUND PERSPECTIVE SYSTEM:
    - SURFACE (Base Plane): Use ${surfaceDesc}. Texture must be subtle, natural, and non-distracting. Maintain a slight angle perspective for realism.
    - BACKGROUND LAYER (Vertical Plane): Create ${horizonDesc}. Ensure color harmony with the product (no contrast clash).
    - HORIZON CONTROL: Use a ${options.horizonStyle === 'seamless' ? 'seamless infinity background' : 'low horizon line'} for a "hero focus" effect.
    - LIGHT INTERACTION: Ensure soft light falloff across the background with a subtle gradient originating from the ${options.lightDirection}. No hard edges or artificial vignettes.
    - DEPTH SEPARATION: Maintain clear separation between the foreground (product) and the background environment using natural depth of field (subtle blur on the background).
    - NEGATIVE SPACE: Reserve clean, simple areas around the product for potential text/copy. The background in these zones must be low-texture and minimalist.
    `;

  const prompt = `
    TASK: Perform an ultra high-end commercial product photography rendering. This is a professional studio retouch and lighting adjustment for premium EU/US advertising.
    
    STYLE REFERENCE: Premium commercial photography, high-end studio lighting, luxury product finish.
    
    KEY REQUIREMENTS (PRO CAPABILITIES):
    - RENDERING INTENT: Ultra high-end commercial product photography, EU/US advertising style, studio-grade lighting, realistic shadow, premium finish.
    - RETOUCH ONLY: This edit must function as a lighting and retouch adjustment only. Do NOT redesign, regenerate, or alter the product's physical structure.
    - PERSPECTIVE & GEOMETRY LOCK: Preserve original product geometry, proportions, and perspective exactly as in the input image. Do NOT change camera angle, lens distortion, or product structure. No reshaping, no redesign, no symmetry correction.
    - MATERIAL & COLOR FIDELITY: Maintain accurate material properties, original colors, and surface curvature. Do NOT change the product's color or material.
    
    ${insertionLogic}
    
    STUDIO RETOUCH: Clean background to ${backgroundDesc}, remove distractions, and enhance clarity.
    - LIGHTING: ${lightDesc}. Use high-end, physically accurate studio lighting with bright midtones.
    - SHADOWS: ${shadowPrompt}
    - Quality: 4K Ultra resolution rendering, ultra-sharp, high detail, high contrast, professional color grading. No AI artifacts.
    - Additional User Instructions: ${options.customPrompt || "None"}
    
    OUTPUT: A single high-quality image of the product in this new studio setting.
  `.trim();

  const parts: any[] = [
    {
      inlineData: {
        data: base64Image.split(',')[1],
        mimeType: mimeType,
      },
    },
  ];

  if (options.backgroundImage && options.backgroundImageMimeType) {
    parts.push({
      inlineData: {
        data: options.backgroundImage.split(',')[1],
        mimeType: options.backgroundImageMimeType,
      },
    });
  }

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: parts,
    },
    config: {
      imageConfig: {
        aspectRatio: options.aspectRatio,
        imageSize: options.imageSize,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image was generated by the model.");
}
