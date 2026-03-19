"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Navigate,
  Views,
  type Event as RbcEvent,
  type View,
} from "react-big-calendar";
import { format, startOfWeek as dfStartOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "~/styles/birthday-calendar.css";
import { Button } from "~/components/ui/button";
import { CalendarDays, Cake, Loader2, Plus } from "lucide-react";
import type { Persona } from "~/services/personasService";

/** dateFnsLocalizer pasa el 3.er arg como `{ locale }`, no como string `culture`. */
const localizer = dateFnsLocalizer({
  format: (date: Date, formatString: string, options?: { locale?: typeof es }) =>
    format(date, formatString, {
      ...(options && typeof options === "object" ? options : {}),
      locale: options?.locale ?? es,
    }),
  startOfWeek: (date: Date, options?: { locale?: typeof es }) =>
    dfStartOfWeek(date, {
      weekStartsOn: 1,
      locale: options?.locale ?? es,
    }),
  getDay,
  locales: { es },
});

const MESSAGES = {
  allDay: "Todo el día",
  previous: "Anterior",
  next: "Siguiente",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Cumpleaños",
  noEventsInRange: "No hay cumpleaños en este período.",
  showMore: (total: number) => `+${total} más`,
};

export type BirthdayCalendarEvent = RbcEvent & {
  resource?: Persona;
};

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

function buildBirthdayEvents(personas: Persona[], year: number): BirthdayCalendarEvent[] {
  const out: BirthdayCalendarEvent[] = [];
  for (const p of personas) {
    if (p.cumple_mes == null || p.cumple_dia == null) continue;
    const m = p.cumple_mes;
    const d = p.cumple_dia;
    if (m < 1 || m > 12 || d < 1) continue;
    const max = daysInMonth(year, m);
    if (d > max) continue;
    const start = new Date(year, m - 1, d, 0, 0, 0, 0);
    const end = new Date(year, m - 1, d, 23, 59, 59, 999);
    out.push({
      title: p.nombre,
      start,
      end,
      allDay: true,
      resource: p,
    });
  }
  return out;
}

function normalizeViews(views: unknown): View[] {
  if (Array.isArray(views)) return views as View[];
  if (views && typeof views === "object") return Object.keys(views) as View[];
  return [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA];
}

function BirthdayToolbar(props: {
  label: string;
  onNavigate: (action: string) => void;
  onView: (view: View) => void;
  view: View;
  views: unknown;
}) {
  const { label, onNavigate, onView, view, views } = props;
  const viewList = normalizeViews(views);
  const viewButtons: { key: View; label: string }[] = [
    { key: Views.MONTH, label: "Mes" },
    { key: Views.WEEK, label: "Semana" },
    { key: Views.DAY, label: "Día" },
    { key: Views.AGENDA, label: "Agenda" },
  ].filter((b) => viewList.includes(b.key));

  return (
    <div className="flex flex-col gap-3 mb-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-gray-200 overflow-hidden bg-white shadow-sm">
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-medium text-gray-700 border-r border-gray-200 hover:bg-gray-50"
            onClick={() => onNavigate(Navigate.TODAY)}
          >
            Hoy
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-medium text-gray-700 border-r border-gray-200 hover:bg-gray-50"
            onClick={() => onNavigate(Navigate.PREVIOUS)}
          >
            Anterior
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => onNavigate(Navigate.NEXT)}
          >
            Siguiente
          </button>
        </div>
        <span className="text-base sm:text-lg font-semibold text-gray-800 order-last sm:order-none w-full sm:w-auto text-center sm:text-center flex-1 [text-transform:none]">
          {label}
        </span>
        <div className="inline-flex rounded-md border border-gray-200 overflow-hidden bg-white shadow-sm flex-wrap">
          {viewButtons.map((b) => (
            <button
              key={b.key}
              type="button"
              className={`px-2.5 py-1.5 text-xs font-medium border-r border-gray-200 last:border-r-0 ${
                view === b.key ? "bg-gray-200 text-gray-900 font-semibold" : "text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => onView(b.key)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface BirthdayCalendarProps {
  personas: Persona[];
  loading?: boolean;
  onNuevaPersona?: () => void;
}

export function BirthdayCalendar({ personas, loading, onNuevaPersona }: BirthdayCalendarProps) {
  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState<View>(Views.MONTH);

  const year = date.getFullYear();
  const events = useMemo(() => buildBirthdayEvents(personas, year), [personas, year]);

  const eventPropGetter = useCallback((_event: BirthdayCalendarEvent) => {
    return {
      style: {
        backgroundColor: "#db2777",
        borderColor: "transparent",
      },
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
      </div>
    );
  }

  return (
    <div className="birthday-rbc-root space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary-blue shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900">Calendario de cumpleaños</h3>
        </div>
        {onNuevaPersona && (
          <Button size="sm" className="bg-primary-blue hover:bg-primary-blue/90 shrink-0" onClick={onNuevaPersona}>
            <Plus className="w-4 h-4 mr-1" />
            Personas
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <span className="font-medium text-gray-500 uppercase tracking-wide">Leyenda</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-pink-600 shrink-0" />
          <span>Cumpleaños</span>
        </div>
      </div>

      <div className="min-h-[520px]">
        <Calendar
          localizer={localizer}
          culture="es"
          messages={MESSAGES}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ minHeight: 520 }}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          view={view}
          onView={setView}
          date={date}
          onNavigate={(d: Date) => setDate(d)}
          components={{
            toolbar: BirthdayToolbar,
          }}
          eventPropGetter={eventPropGetter}
        />
      </div>

      {personas.length === 0 && (
        <p className="text-sm text-gray-500 text-center flex items-center justify-center gap-2">
          <Cake className="w-4 h-4 text-pink-400" />
          No hay personas activas con día y mes de cumpleaños registrados.
        </p>
      )}
    </div>
  );
}
