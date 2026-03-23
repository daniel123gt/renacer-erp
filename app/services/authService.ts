import supabase from "~/utils/supabase";

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    console.error("Error en signInWithEmail:", error);
    return { 
      data: null, 
      error: { 
        message: "Error de conexión con el servidor" 
      } 
    };
  }
};

export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Auth session missing") || msg.includes("AuthSessionMissingError")) {
      return { success: true };
    }
    console.error("Error en logout:", error);
    return { success: true };
  }
};

export const getCurrentSessionUser = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { user: null, error };
  return { user: data.session?.user ?? null, error: null };
};

export const setPasswordForInvitedUser = async (
  email: string,
  password: string
) => {
  const { user, error } = await getCurrentSessionUser();
  if (error) return { data: null, error };
  if (!user?.email) {
    return {
      data: null,
      error: { message: "No hay una sesión de invitación activa." },
    };
  }
  if (user.email.toLowerCase() !== email.trim().toLowerCase()) {
    return {
      data: null,
      error: {
        message:
          "El correo no coincide con la invitación. Usa el mismo correo del enlace recibido.",
      },
    };
  }
  const { data, error: updateErr } = await supabase.auth.updateUser({ password });
  return { data, error: updateErr };
};
