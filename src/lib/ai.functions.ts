import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Extracts structured marks from a marksheet image. This is the seam where the
// future AI/MCP academic assistant layer will plug in more server-side tools.
export const extractMarksheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ dataUrl: z.string().startsWith("data:image/").max(12_000_000) }).parse(d))
  .handler(async ({ data }) => {
    const endpoint = process.env["AI_GATEWAY_URL"];
    const key = process.env["AI_GATEWAY_API_KEY"];
    const model = process.env["AI_MODEL"];
    if (!endpoint || !key || !model) {
      throw new Error("Marksheet auto-read is not configured. Please enter marks manually.");
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You read Indian university semester grade sheets / marksheets. Extract every course row exactly. Grades use O, A+, A, B+, B, C, U etc. Return null for anything not visible.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the semester number, SGPA if printed, and all subjects." },
              { type: "image_url", image_url: { url: data.dataUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_marksheet",
              parameters: {
                type: "object",
                properties: {
                  semester_no: { type: ["integer", "null"] },
                  sgpa: { type: ["number", "null"] },
                  subjects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        course_code: { type: ["string", "null"] },
                        course_name: { type: "string" },
                        credits: { type: ["number", "null"] },
                        grade: { type: ["string", "null"] },
                        marks: { type: ["number", "null"] },
                      },
                      required: ["course_name"],
                    },
                  },
                },
                required: ["subjects"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_marksheet" } },
      }),
    });
    if (res.status === 429) throw new Error("Too many requests right now — try again in a minute.");
    if (res.status === 402) throw new Error("AI credits are used up. Please enter marks manually.");
    if (!res.ok) throw new Error("Could not read the marksheet. Please enter marks manually.");
    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No data found in the image.");
    const parsed = JSON.parse(args) as {
      semester_no: number | null;
      sgpa: number | null;
      subjects: { course_code: string | null; course_name: string; credits: number | null; grade: string | null; marks: number | null }[];
    };
    return parsed;
  });
