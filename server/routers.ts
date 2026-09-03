import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const weatherLabels: Record<number, string> = {
  0: "Clear skies", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Misty", 48: "Misty", 51: "Light drizzle", 53: "Drizzle", 55: "Drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow",
  75: "Heavy snow", 80: "Rain showers", 81: "Rain showers", 82: "Heavy showers",
  95: "Thunderstorms", 96: "Storms", 99: "Storms",
};

function readMessage(response: Awaited<ReturnType<typeof invokeLLM>>) {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  return Array.isArray(content) ? content.map((part) => typeof part === "string" ? part : "").join("") : "";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  weather: router({
    current: publicProcedure
      .input(z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }))
      .query(async ({ input }) => {
        const params = new URLSearchParams({
          latitude: String(input.lat),
          longitude: String(input.lon),
          current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
          timezone: "auto",
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
        if (!response.ok) throw new Error("Weather service unavailable");
        const payload = await response.json() as {
          current?: { time?: string; temperature_2m?: number; relative_humidity_2m?: number; apparent_temperature?: number; weather_code?: number; wind_speed_10m?: number };
        };
        const current = payload.current;
        if (!current) throw new Error("No current weather returned");
        return {
          time: current.time,
          temperature: current.temperature_2m ?? 0,
          humidity: current.relative_humidity_2m ?? 0,
          apparentTemperature: current.apparent_temperature ?? 0,
          windSpeed: current.wind_speed_10m ?? 0,
          summary: weatherLabels[current.weather_code ?? 0] ?? "Changing skies",
        };
      }),
  }),
  assistant: router({
    ask: publicProcedure
      .input(z.object({ destination: z.string(), country: z.string(), question: z.string().min(2).max(500) }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are Wayfarer, a warm, concise travel guide. Give practical, specific advice about the requested destination. Keep answers under 120 words. Avoid generic travel disclaimers and do not invent live facts." },
            { role: "user", content: `Destination: ${input.destination}, ${input.country}\nQuestion: ${input.question}` },
          ],
        });
        return { answer: readMessage(response) || "I have a quiet moment—try asking that again." };
      }),
    plan: publicProcedure
      .input(z.object({ destination: z.string(), country: z.string(), days: z.number().int().min(3).max(6) }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a thoughtful travel planner. Create a realistic, walkable day-by-day itinerary. Keep each activity sentence vivid but short. Return only JSON matching the schema." },
            { role: "user", content: `Build a ${input.days}-day itinerary for ${input.destination}, ${input.country}. Balance essential landmarks, local texture, food, and breathing room.` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "travel_itinerary",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  days: {
                    type: "array",
                    minItems: input.days,
                    maxItems: input.days,
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "integer" },
                        title: { type: "string" },
                        morning: { type: "string" },
                        afternoon: { type: "string" },
                        evening: { type: "string" },
                      },
                      required: ["day", "title", "morning", "afternoon", "evening"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["days"],
                additionalProperties: false,
              },
            },
          },
        });
        try {
          const parsed = JSON.parse(readMessage(response)) as { days: Array<{ day: number; title: string; morning: string; afternoon: string; evening: string }> };
          return { days: parsed.days.slice(0, input.days) };
        } catch {
          throw new Error("The itinerary response was not readable");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
