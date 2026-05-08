import { getAIInstance } from "./geminiService";
import { AdmissionTimeline } from "../types";

export const getAdmissionTimeline = async (university: string, isPremium: boolean = false): Promise<AdmissionTimeline | null> => {
  try {
    const ai = getAIInstance('tracker');
    const today = new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Today is ${today}. You are predicting the 2026 admission timeline for ${university}, Nigeria.

STEP 1 — SEARCH FOR REAL 2026 DATES:
Search these queries first:
- "${university} Post-UTME 2026 registration date"
- "${university} admission list 2026 released"
- "${university} resumption date 2026"

STEP 2 — IF 2026 DATE NOT FOUND, PREDICT FROM HISTORY:
Search these queries to find past patterns:
- "${university} Post-UTME 2025 date"
- "${university} Post-UTME 2024 date"
- "${university} Post-UTME 2023 date"
- "${university} admission list 2025 release date"

Use the pattern from 2023, 2024, and 2025 to predict the likely 2026 date.
For example: if Post-UTME was July 20 in 2023, July 18 in 2024, July 22 in 2025 — predict around July 19-21, 2026.

STEP 3 — BUILD THE TIMELINE:
For each stage below, provide status and date:

1. JAMB UTME Registration
   - Dates: January 26 – February 28, 2026
   - Status: Completed (this has already passed as of today)

2. JAMB UTME Exam
   - Dates: April 16–25, 2026
   - Status: Completed (this has already passed as of today)

3. Post-UTME Screening
   - Search for real 2026 date first
   - If not found, predict from 2023–2025 history
   - Label as "Confirmed" if real date found, "Predicted" if estimated from history

4. Admission List Release
   - Search if ${university} has released any batch in 2026
   - If not yet released, predict from 2023–2025 pattern
   - Label as "Released", "Not Yet Released", or "Predicted: [date range]"

5. Resumption
   - Search for real 2026 resumption date
   - If not found, predict from history
   - Label accordingly

RULES:
1. Use today (${today}) to set accurate status: Completed, In Progress, or Upcoming
2. NEVER say "Not Yet Announced" — always predict from history if real date not found
3. Always state whether a date is Confirmed or Predicted
4. If ${university} has no history data at all, use the average Nigerian federal/state university pattern` }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    const timeline: AdmissionTimeline = JSON.parse(responseText || '{}');
    console.log("Timeline generated successfully.");
    return timeline;
  } catch (e) {
    console.error("Admission Tracker error (DETAILED):", e);
    return null;
  }
};
