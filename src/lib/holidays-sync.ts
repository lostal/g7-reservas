/**
 * Sync de festivos desde OpenHolidays API
 *
 * Descarga los festivos de la comunidad autónoma de cada sede
 * y los persiste en holiday_calendars + holidays + entity_holiday_calendars.
 *
 * API: https://openholidaysapi.org/PublicHolidays
 *   Parámetros: countryIsoCode=ES, subdivisionCode=ES-MD, validFrom=2025-01-01, validTo=2025-12-31
 */

import { db } from "@/lib/db";
import {
  entities,
  holidayCalendars,
  holidays,
  entityHolidayCalendars,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type OpenHolidayEntry = {
  startDate: string; // "2025-01-01"
  endDate: string;
  name: { language: string; text: string }[];
  nationwide: boolean;
};

async function fetchOpenHolidays(
  subdivisionCode: string,
  year: number
): Promise<OpenHolidayEntry[]> {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const url =
    `https://openholidaysapi.org/PublicHolidays` +
    `?countryIsoCode=ES&subdivisionCode=${subdivisionCode}&validFrom=${from}&validTo=${to}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // next.js fetch cache: no caching, siempre fresco
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `OpenHolidays API error ${res.status} for ${subdivisionCode} ${year}`
    );
  }

  return res.json() as Promise<OpenHolidayEntry[]>;
}

function getHolidayName(entry: OpenHolidayEntry): string {
  const es = entry.name.find((n) => n.language === "ES");
  return es?.text ?? entry.name[0]?.text ?? "Festivo";
}

/**
 * Sincroniza los festivos de una sede para el año actual y el siguiente.
 * Si la sede no tiene comunidad autónoma asignada, no hace nada.
 */
export async function syncHolidaysForEntity(entityId: string): Promise<void> {
  const [entity] = await db
    .select({ autonomousCommunity: entities.autonomousCommunity })
    .from(entities)
    .where(eq(entities.id, entityId))
    .limit(1);

  if (!entity?.autonomousCommunity) return;

  const cc = entity.autonomousCommunity;
  const currentYear = new Date().getFullYear();

  for (const year of [currentYear, currentYear + 1]) {
    const entries = await fetchOpenHolidays(cc, year);

    // Find or create calendar for this region+year
    const calendarName = `Festivos ${cc} ${year}`;
    const existing = await db
      .select({ id: holidayCalendars.id })
      .from(holidayCalendars)
      .where(
        and(eq(holidayCalendars.region, cc), eq(holidayCalendars.year, year))
      )
      .limit(1);

    let calendarId: string;
    if (existing[0]) {
      calendarId = existing[0].id;
      await db
        .update(holidayCalendars)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(holidayCalendars.id, calendarId));
    } else {
      const [inserted] = await db
        .insert(holidayCalendars)
        .values({
          name: calendarName,
          country: "ES",
          region: cc,
          year,
          isActive: true,
        })
        .returning({ id: holidayCalendars.id });
      if (!inserted) continue;
      calendarId = inserted.id;
    }

    // Upsert holidays (unique constraint on calendarId+date exists in schema)
    for (const entry of entries) {
      await db
        .insert(holidays)
        .values({
          calendarId,
          date: entry.startDate,
          name: getHolidayName(entry),
          isOptional: false,
        })
        .onConflictDoUpdate({
          target: [holidays.calendarId, holidays.date],
          set: { name: getHolidayName(entry) },
        });
    }

    // Link entity ↔ calendar
    await db
      .insert(entityHolidayCalendars)
      .values({ entityId, calendarId })
      .onConflictDoNothing();
  }
}

/**
 * Sincroniza festivos para todas las entidades que tienen CCAA asignada.
 */
export async function syncAllHolidays(): Promise<{
  synced: number;
  errors: string[];
}> {
  const allEntities = await db
    .select({
      id: entities.id,
      autonomousCommunity: entities.autonomousCommunity,
    })
    .from(entities)
    .where(eq(entities.isActive, true));

  const withCC = allEntities.filter((e) => !!e.autonomousCommunity);
  const errors: string[] = [];

  for (const entity of withCC) {
    try {
      await syncHolidaysForEntity(entity.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${entity.id}] ${msg}`);
    }
  }

  return { synced: withCC.length - errors.length, errors };
}
