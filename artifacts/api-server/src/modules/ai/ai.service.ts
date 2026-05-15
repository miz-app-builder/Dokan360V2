/**
 * TASK 12 — AI-Ready Architecture
 *
 * This module prepares the architecture for future AI feature integration.
 * It is NOT yet fully implemented — stubs define the service contract.
 *
 * Planned AI features:
 *  - Sales prediction (7-day, 30-day forecasts)
 *  - Inventory reorder suggestions (when to reorder & how much)
 *  - Bengali AI assistant (natural language shop queries)
 *  - Anomaly detection (unusual sales patterns)
 *  - Smart discount suggestions based on inventory age
 *
 * Implementation timeline: Phase 3 (after core feature stability)
 * Recommended stack: OpenAI GPT-4o or Gemini Pro via Replit AI Integrations
 */

export interface SalesForecast {
  date:            string;
  predictedAmount: number;
  confidence:      number;
}

export interface ReorderSuggestion {
  productId:   number;
  productName: string;
  currentQty:  number;
  suggestedQty: number;
  reason:      string;
}

export interface AiInsight {
  type:    "info" | "warning" | "opportunity";
  titleBn: string;
  bodyBn:  string;
}

/**
 * Stub: Generate sales forecast for next N days.
 */
export async function getSalesForecast(
  _shopId: number,
  _days: number,
): Promise<SalesForecast[]> {
  return [];
}

/**
 * Stub: Generate smart inventory reorder suggestions.
 */
export async function getReorderSuggestions(
  _shopId: number,
): Promise<ReorderSuggestion[]> {
  return [];
}

/**
 * Stub: Generate AI business insights in Bengali.
 */
export async function getBusinessInsights(_shopId: number): Promise<AiInsight[]> {
  return [];
}
