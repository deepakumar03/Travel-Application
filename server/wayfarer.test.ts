import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx: TrpcContext = {
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

describe("weather.current", () => {
  afterEach(() => vi.restoreAllMocks());

  it("normalizes the Open-Meteo response for the travel UI", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      current: {
        time: "2026-09-03T10:00",
        temperature_2m: 23.4,
        relative_humidity_2m: 57,
        apparent_temperature: 24.1,
        weather_code: 1,
        wind_speed_10m: 9.8,
      },
    }), { status: 200 }));

    const result = await appRouter.createCaller(ctx).weather.current({ lat: 38.7223, lon: -9.1393 });

    expect(result).toEqual({
      time: "2026-09-03T10:00",
      temperature: 23.4,
      humidity: 57,
      apparentTemperature: 24.1,
      windSpeed: 9.8,
      summary: "Mainly clear",
    });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("latitude=38.7223"));
  });

  it("surfaces a failed upstream request as a procedure error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 503 }));

    await expect(appRouter.createCaller(ctx).weather.current({ lat: 0, lon: 0 })).rejects.toThrow("Weather service unavailable");
  });
});
