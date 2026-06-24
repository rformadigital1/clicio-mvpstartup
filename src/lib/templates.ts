import type { PageColors } from "./types"

export type TemplateId = "classic" | "modern" | "natural" | "industrial"

export interface FontPreset {
  id: string
  name: string
  headingFont: string
  bodyFont: string
}

export interface TemplateDefinition {
  id: TemplateId
  name: string
  description: string
  swatches: string[]
  basePalette: PageColors
  fontPresets: FontPreset[]
}

export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  classic: {
    id: "classic",
    name: "Clásico",
    description: "Profesional, de confianza, tradicional",
    swatches: ["#0B2B5C", "#C5A55A", "#8B4513", "#F5F3EE"],
    basePalette: {
      primary: "#0B2B5C",
      secondary: "#C5A55A",
      accent: "#8B4513",
      background: "#F5F3EE",
      cardBg: "#FFFFFF",
      text: "#1A1A1A",
      buttonBg: "#0B2B5C",
      buttonText: "#FFFFFF",
    },
    fontPresets: [
      { id: "elegante", name: "Elegante", headingFont: "Playfair Display, serif", bodyFont: "Inter, sans-serif" },
      { id: "tradicional", name: "Tradicional", headingFont: "Georgia, serif", bodyFont: "Georgia, serif" },
    ],
  },
  modern: {
    id: "modern",
    name: "Moderno",
    description: "Rápido, audaz, aspiracional",
    swatches: ["#0D0D0D", "#E30613", "#F8F8F8", "#1A1A1A"],
    basePalette: {
      primary: "#0D0D0D",
      secondary: "#1A1A1A",
      accent: "#E30613",
      background: "#F8F8F8",
      cardBg: "#FFFFFF",
      text: "#0D0D0D",
      buttonBg: "#0D0D0D",
      buttonText: "#FFFFFF",
    },
    fontPresets: [
      { id: "bold", name: "Bold", headingFont: "Oswald, sans-serif", bodyFont: "Inter, sans-serif" },
      { id: "minimal", name: "Minimal", headingFont: "Inter, sans-serif", bodyFont: "Inter, sans-serif" },
    ],
  },
  natural: {
    id: "natural",
    name: "Natural",
    description: "Cercano, transparente, acogedor",
    swatches: ["#5B7B5E", "#8B6F4C", "#D4A373", "#F9F6F0"],
    basePalette: {
      primary: "#5B7B5E",
      secondary: "#8B6F4C",
      accent: "#D4A373",
      background: "#F9F6F0",
      cardBg: "#FFFFFF",
      text: "#2C2C2C",
      buttonBg: "#5B7B5E",
      buttonText: "#FFFFFF",
    },
    fontPresets: [
      { id: "suave", name: "Suave", headingFont: "Lora, serif", bodyFont: "DM Sans, sans-serif" },
      { id: "limpio", name: "Limpio", headingFont: "DM Sans, sans-serif", bodyFont: "DM Sans, sans-serif" },
    ],
  },
  industrial: {
    id: "industrial",
    name: "Industrial",
    description: "Honesto, directo, sin vueltas",
    swatches: ["#E85D04", "#2D2D2D", "#A8A8A8", "#F0EFED"],
    basePalette: {
      primary: "#E85D04",
      secondary: "#2D2D2D",
      accent: "#A8A8A8",
      background: "#F0EFED",
      cardBg: "#FFFFFF",
      text: "#1C1C1C",
      buttonBg: "#E85D04",
      buttonText: "#FFFFFF",
    },
    fontPresets: [
      { id: "industrial", name: "Industrial", headingFont: "Space Grotesk, sans-serif", bodyFont: "DM Sans, sans-serif" },
      { id: "tecnico", name: "Técnico", headingFont: "Space Grotesk, sans-serif", bodyFont: "JetBrains Mono, monospace" },
    ],
  },
}

export function derivePalette(templateId: TemplateId, primaryColor: string): PageColors {
  const template = TEMPLATES[templateId]
  const base = template.basePalette
  return {
    ...base,
    primary: primaryColor,
    buttonBg: primaryColor,
    buttonText: "#FFFFFF",
  }
}
