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
  base64Images: string | string[],
  mimeType: string | string[],
  options: GenerationOptions
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const images = Array.isArray(base64Images) ? base64Images : [base64Images];
  const mimeTypes = Array.isArray(mimeType) ? mimeType : [mimeType];

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
    : "DO NOT add any cast shadows. The products should appear as if they're floating or in a shadowless environment, but still maintain their internal shading and reflections.";

  const surfaceDesc = options.surfaceType === 'solid' 
    ? `a solid ${options.backgroundColor} surface`
    : `a professional ${options.surfaceType} surface`;

  const horizonDesc = options.horizonStyle === 'seamless'
    ? "a seamless infinity transition between surface and background"
    : "a subtle, clean horizon line separating the surface from the background layer";

  const productCount = images.length;
  const productContext = productCount > 1 
    ? `There are ${productCount} products provided. Arrange them together naturally in the scene as a cohesive set.`
    : "There is 1 product provided.";

  const insertionLogic = options.backgroundImage 
    ? `
    INSERTION TASK:
    - ${productContext}
    - Insert the products into the provided background scene (the last image provided).
    
    PERSPECTIVE CORRECTION (CRITICAL):
    - Match camera angle of the background (eye-level, slight front view).
    - Align products' ellipses and rim perspectives perfectly with the countertop plane.
    - Ensure all products follow correct horizontal alignment and relative scale.
    - Correct any tilt or mismatch in geometry to ensure products sit firmly on the surface.
    
    LIGHTING & SHADOW MATCH:
    - LIGHT SOURCE: Upper left (strong natural sunlight).
    - HIGHLIGHTS: Apply consistent highlights on all products' metal handles and glass lids.
    - SHADOW FIX: Create realistic contact shadows directly under each product. Extend soft natural shadows toward the right side (matching the wall shadow direction in the scene).
    - SHADOW QUALITY: Sharp near the objects, becoming softer as they move outward. Remove any floating effect.
    
    COLOR & MATERIAL FIDELITY:
    - PRESERVE: Keep the original colors of all products exactly as provided in the source images.
    - REFLECTIONS: Maintain metallic reflections on handles and natural transparency of glass lids.
    - CONTACT: Add subtle reflections from the countertop surface if appropriate for the material.
    
    STYLE: Minimal, clean, premium, airy composition. No clutter, no extra objects.
    `
    : `
    BACKGROUND PERSPECTIVE SYSTEM:
    - ${productContext}
    - SURFACE (Base Plane): Use ${surfaceDesc}. Texture must be subtle, natural, and non-distracting. Maintain a slight angle perspective for realism.
    - BACKGROUND LAYER (Vertical Plane): Create ${horizonDesc}. Ensure color harmony with the products (no contrast clash).
    - HORIZON CONTROL: Use a ${options.horizonStyle === 'seamless' ? 'seamless infinity background' : 'low horizon line'} for a "hero focus" effect.
    - LIGHT INTERACTION: Ensure soft light falloff across the background with a subtle gradient originating from the ${options.lightDirection}. No hard edges or artificial vignettes.
    - DEPTH SEPARATION: Maintain clear separation between the foreground (products) and the background environment using natural depth of field (subtle blur on the background).
    - NEGATIVE SPACE: Reserve clean, simple areas around the products for potential text/copy. The background in these zones must be low-texture and minimalist.
    `;

  const prompt = `
    TASK: Perform an ultra high-end commercial product photography rendering. This is a professional studio retouch and lighting adjustment for premium EU/US advertising.
    
    STYLE REFERENCE: Premium commercial photography, high-end studio lighting, luxury product finish.
    
    KEY REQUIREMENTS (PRO CAPABILITIES):
    - RENDERING INTENT: Ultra high-end commercial product photography, EU/US advertising style, studio-grade lighting, realistic shadow, premium finish.
    - RETOUCH ONLY: This edit must function as a lighting and retouch adjustment only. Do NOT redesign, regenerate, or alter the products' physical structures.
    - PERSPECTIVE & GEOMETRY LOCK: Preserve original product geometry, proportions, and perspective exactly as in the input images. Do NOT change camera angle, lens distortion, or product structure. No reshaping, no redesign, no symmetry correction.
    - MATERIAL & COLOR FIDELITY: Maintain accurate material properties, original colors, and surface curvature. Do NOT change the products' colors or materials.
    
    ${insertionLogic}
    
    STUDIO RETOUCH: Clean background to ${backgroundDesc}, remove distractions, and enhance clarity.
    - LIGHTING: ${lightDesc}. Use high-end, physically accurate studio lighting with bright midtones.
    - SHADOWS: ${shadowPrompt}
    - Quality: 4K Ultra resolution rendering, ultra-sharp, high detail, high contrast, professional color grading. No AI artifacts.
    - Additional User Instructions: ${options.customPrompt || "None"}
    
    OUTPUT: A single high-quality image of the products arranged in this new studio setting.
  `.trim();

  const parts: any[] = images.map((img, idx) => ({
    inlineData: {
      data: img.split(',')[1],
      mimeType: Array.isArray(mimeTypes) ? mimeTypes[idx] : mimeTypes,
    },
  }));

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
