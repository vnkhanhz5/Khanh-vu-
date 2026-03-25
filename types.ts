export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  BATCH_GENERATING = 'BATCH_GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  NEEDS_KEY = 'NEEDS_KEY',
  NEEDS_AUTH = 'NEEDS_AUTH'
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";
export type LightDirection = "top-left" | "top-right" | "top" | "left" | "right" | "front";

export type SurfaceType = 'matte' | 'wood' | 'stone' | 'ceramic' | 'solid';
export type HorizonStyle = 'seamless' | 'horizon-line';

export interface GenerationOptions {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  backgroundColor: string;
  isTransparent: boolean;
  customPrompt: string;
  lightDirection: LightDirection;
  showShadow: boolean;
  surfaceType: SurfaceType;
  horizonStyle: HorizonStyle;
  backgroundImage?: string;
  backgroundImageMimeType?: string;
}
