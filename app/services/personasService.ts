import supabase from "~/utils/supabase";

export interface Persona {
  id: string;
  nombre: string;
  contacto: string | null;
  cumple_dia: number | null;
  cumple_mes: number | null;
  direccion: string | null;
  distrito: string | null;
  bautizado: boolean;
  activo: boolean;
  notas: string | null;
  created_at: string;
}

export interface PersonaInput {
  nombre: string;
  contacto?: string | null;
  cumple_dia?: number | null;
  cumple_mes?: number | null;
  direccion?: string | null;
  distrito?: string | null;
  bautizado?: boolean;
  activo?: boolean;
  notas?: string | null;
}

function mapRow(r: any): Persona {
  return {
    id: r.id,
    nombre: r.nombre,
    contacto: r.contacto ?? null,
    cumple_dia: r.cumple_dia != null ? Number(r.cumple_dia) : null,
    cumple_mes: r.cumple_mes != null ? Number(r.cumple_mes) : null,
    direccion: r.direccion ?? null,
    distrito: r.distrito ?? null,
    bautizado: r.bautizado ?? false,
    activo: r.activo ?? true,
    notas: r.notas ?? null,
    created_at: r.created_at,
  };
}

export const personasService = {
  async list(): Promise<Persona[]> {
    const { data, error } = await supabase
      .from("personas")
      .select("*")
      .order("nombre");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  async listActivos(): Promise<Persona[]> {
    const { data, error } = await supabase
      .from("personas")
      .select("*")
      .eq("activo", true)
      .order("nombre");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  async crear(input: PersonaInput): Promise<Persona> {
    const { data, error } = await supabase
      .from("personas")
      .insert({
        nombre: input.nombre.trim(),
        contacto: input.contacto?.trim() || null,
        cumple_dia: input.cumple_dia ?? null,
        cumple_mes: input.cumple_mes ?? null,
        direccion: input.direccion?.trim() || null,
        distrito: input.distrito?.trim() || null,
        bautizado: input.bautizado ?? false,
        activo: input.activo ?? true,
        notas: input.notas?.trim() || null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async actualizar(id: string, input: Partial<PersonaInput>): Promise<Persona> {
    const updateData: Record<string, any> = {};
    if (input.nombre !== undefined) updateData.nombre = input.nombre.trim();
    if (input.contacto !== undefined) updateData.contacto = input.contacto?.trim() || null;
    if (input.cumple_dia !== undefined) updateData.cumple_dia = input.cumple_dia ?? null;
    if (input.cumple_mes !== undefined) updateData.cumple_mes = input.cumple_mes ?? null;
    if (input.direccion !== undefined) updateData.direccion = input.direccion?.trim() || null;
    if (input.distrito !== undefined) updateData.distrito = input.distrito?.trim() || null;
    if (input.bautizado !== undefined) updateData.bautizado = input.bautizado;
    if (input.activo !== undefined) updateData.activo = input.activo;
    if (input.notas !== undefined) updateData.notas = input.notas?.trim() || null;

    const { data, error } = await supabase
      .from("personas")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from("personas").delete().eq("id", id);
    if (error) throw error;
  },

  async crearRapido(nombre: string): Promise<Persona> {
    return this.crear({ nombre, activo: true });
  },
};
