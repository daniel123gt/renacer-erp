import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "~/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuthStore } from "~/store/authStore";
import supabase from "~/utils/supabase";
import { Loader2, User, Phone, Calendar, Hash, Mail } from "lucide-react";

const formSchema = z.object({
  full_name: z.string().min(1, "El nombre es obligatorio"),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function MiPerfilPage() {
  const { user, login } = useAuthStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.user_metadata?.full_name ?? "",
        phone: (user.user_metadata?.phone as string) ?? "",
      });
    }
  }, [user, form.reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const { data: updated, error } = await supabase.auth.updateUser({
        data: {
          full_name: values.full_name.trim(),
          phone: values.phone?.trim() || undefined,
        },
      });

      if (error) {
        toast.error(error.message || "Error al actualizar el perfil");
        return;
      }

      if (updated.user) {
        login({
          id: updated.user.id,
          email: updated.user.email ?? user?.email ?? "",
          user_metadata: updated.user.user_metadata ?? {},
          created_at: updated.user.created_at ?? user?.created_at ?? "",
          updated_at: updated.user.updated_at ?? updated.user.created_at ?? "",
        });
      }

      toast.success("Perfil actualizado correctamente");
    } catch {
      toast.error("Error al actualizar el perfil");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-blue">Datos y configuración</h1>
        <p className="text-gray-600 mt-1">Consulta y actualiza la información de tu cuenta.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary-blue flex items-center gap-2">
            <User className="w-5 h-5" />
            Información del perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nombre completo
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} className="max-w-md" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Teléfono (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. +51 999 999 999" {...field} className="max-w-md" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary-blue hover:bg-primary-blue/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-700 text-base">Datos de la cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-primary-blue" />
            <span>Correo: {user.email ?? "—"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-primary-blue" />
            <span>Fecha de ingreso: {user.created_at ? new Date(user.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : "—"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Hash className="w-4 h-4 text-primary-blue" />
            <span>Código de empleado: {user.id?.slice(-8) || "N/A"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
