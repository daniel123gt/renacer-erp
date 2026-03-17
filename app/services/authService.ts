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
