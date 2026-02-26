import { z } from "https://esm.sh/zod@3.23.8";
import type { Category, BuildingProfile, AIResponse } from "../types/analysis.types.ts";

export const CategorySchema = z.object({
  name: z.string().min(1).max(100).transform(s => s.trim()),
  icon: z.string().max(50).nullable().optional(),
  current_amount: z.number().min(0).max(100000000),
  previous_amount: z.number().min(0).max(100000000).nullable().optional(),
  status: z.preprocess(
    (val: any) => ["ok", "attention", "info"].includes(String(val)) ? val : "ok",
    z.enum(["ok", "attention", "info"]).default("ok")
  ),
  explanation: z.string().max(1000).nullable().optional().transform(s => s ? s.trim().slice(0, 1000) : s),
  subcategories: z.array(z.object({
    name: z.string().min(1).max(100).transform(s => s.trim()),
    amount: z.preprocess(
      (val: any) => {
        const n = Number(val);
        return isNaN(n) ? 0 : Math.abs(n);
      },
      z.number().min(0).max(100000000)
    ),
    percentage: z.preprocess(
      (val: any) => {
        if (val === null || val === undefined) return null;
        const n = Number(val);
        return isNaN(n) ? null : Math.min(100, Math.max(0, Math.abs(n)));
      },
      z.number().min(0).max(100).nullable().optional()
    ),
    expense_type: z.enum(["ordinaria", "extraordinaria", "fondo_reserva"]).nullable().optional(),
    provider_name: z.string().max(200).nullable().optional(),
    provider_cuit: z.string().max(50).nullable().optional(),
    provider_type: z.string().max(50).nullable().optional(),
    cuit_confirmed: z.boolean().nullable().optional(),
  })).max(300).optional(),
});

export const BuildingProfileSchema = z.object({
  country: z.string().max(100).nullable().optional().transform(s => s ? s.trim() : s),
  province: z.string().max(100).nullable().optional().transform(s => s ? s.trim() : s),
  city: z.string().max(100).nullable().optional().transform(s => s ? s.trim() : s),
  neighborhood: z.string().max(200).nullable().optional().transform(s => s ? s.trim() : s),
  zone: z.enum(["CABA", "GBA Norte", "GBA Oeste", "GBA Sur", "Interior"]).nullable().optional(),
  unit_count_range: z.enum(["1-10", "11-30", "31-50", "51-100", "100+"]).nullable().optional(),
  age_category: z.string().max(50).nullable().optional(),
  has_amenities: z.boolean().nullable().optional(),
  amenities: z.array(z.string().max(100)).max(20).nullable().optional(),
  construction_year: z.number().min(1800).max(2030).nullable().optional(),
});

export const AIResponseSchema = z.object({
  building_name: z.string().min(1).max(200).transform(s => s.trim()),
  period: z.string().min(1).max(100).transform(s => s.trim()),
  period_month: z.number().min(1).max(12).optional(),
  period_year: z.number().min(1900).max(2100).optional(),
  period_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  unit: z.string().max(200).nullable().optional().transform(s => s ? s.trim() : s),
  total_amount: z.number().min(0).max(100000000),
  previous_total: z.number().min(0).max(100000000).nullable().optional(),
  categories: z.array(CategorySchema).min(1).max(50),
  building_profile: BuildingProfileSchema.nullable().optional(),
  building_address: z.string().max(500).nullable().optional(),
  administrator_name: z.string().max(200).nullable().optional(),
  administrator_cuit: z.string().max(50).nullable().optional(),
  administrator_cuit_confirmed: z.boolean().nullable().optional(),
  administrator_contact_phone: z.string().max(100).nullable().optional(),
  administrator_contact_email: z.string().max(100).nullable().optional(),
  administrator_contact_address: z.string().max(500).nullable().optional(),
});

export function validateAIResponse(data: unknown): AIResponse {
  if (typeof data !== "object" || data === null) {
    throw new Error("AI response is not an object");
  }

  const validated = AIResponseSchema.parse(data);

  // Business logic validations
  const totalCategoryAmount = validated.categories.reduce(
    (sum, cat) => sum + cat.current_amount,
    0
  );

  const tolerance = validated.total_amount * 0.05; // 5% tolerance
  if (Math.abs(totalCategoryAmount - validated.total_amount) > tolerance && validated.total_amount > 0) {
    console.warn("Categories total differs from stated total", {
      categoriesSum: totalCategoryAmount,
      statedTotal: validated.total_amount,
      difference: totalCategoryAmount - validated.total_amount,
    });
  }

  // Sanitize string fields
  validated.building_name = sanitizeString(validated.building_name);
  validated.period = sanitizeString(validated.period);
  if (validated.unit) validated.unit = sanitizeString(validated.unit);

  validated.categories = validated.categories.map(cat => ({
    ...cat,
    name: sanitizeString(cat.name),
    explanation: cat.explanation ? sanitizeString(cat.explanation) : cat.explanation,
    subcategories: cat.subcategories?.map(sub => ({
      ...sub,
      name: sanitizeString(sub.name)
    }))
  }));

  if (validated.building_profile) {
    const bp = validated.building_profile;
    if (bp.neighborhood) bp.neighborhood = sanitizeString(bp.neighborhood);
    if (bp.city) bp.city = sanitizeString(bp.city);
    if (bp.province) bp.province = sanitizeString(bp.province);
    if (bp.country) bp.country = sanitizeString(bp.country);
    if (bp.age_category) bp.age_category = sanitizeString(bp.age_category);
    if (bp.amenities) {
      bp.amenities = bp.amenities.map(a => sanitizeString(a));
    }
  }

  return validated;
}

function sanitizeString(str: string): string {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}
