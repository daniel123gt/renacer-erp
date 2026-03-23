import { useEffect, useState } from "react";
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
import { Loader2, User, Phone, Calendar, Hash, Mail, KeyRound } from "lucide-react";
import { changePasswordWithCurrent } from "~/services/authService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

const formSchema = z.object({
  full_name: z.string().min(1, "El nombre es obligatorio"),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "La nueva contraseña debe ser distinta a la actual",
    path: ["newPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function MiPerfilPage() {
  const { user, login } = useAuthStore();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [passwordActionLoading, setPasswordActionLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      phone: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
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

  const resetPasswordFlow = () => {
    passwordForm.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setConfirmModalOpen(false);
    setPasswordModalOpen(false);
  };

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

  /** Valida el formulario y abre el modal de confirmación */
  const openConfirmChangePassword = () => {
    void passwordForm.handleSubmit(() => setConfirmModalOpen(true))();
  };

  const executePasswordChange = async () => {
    const values = passwordForm.getValues();
    const email = user?.email;
    if (!email) {
      toast.error("No hay correo en la sesión");
      return;
    }

    setPasswordActionLoading(true);
    try {
      const { data, error } = await changePasswordWithCurrent(
        email,
        values.currentPassword,
        values.newPassword
      );
      if (error) {
        toast.error(
          typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: string }).message)
            : "No se pudo cambiar la contraseña"
        );
        return;
      }
      if (data?.user) {
        login({
          id: data.user.id,
          email: data.user.email ?? user?.email ?? "",
          user_metadata: data.user.user_metadata ?? {},
          created_at: data.user.created_at ?? user?.created_at ?? "",
          updated_at: data.user.updated_at ?? data.user.created_at ?? user?.updated_at ?? "",
        });
      }
      toast.success("Contraseña actualizada correctamente");
      resetPasswordFlow();
    } catch {
      toast.error("Error al cambiar la contraseña");
    } finally {
      setPasswordActionLoading(false);
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

      <Card>
        <CardHeader>
          <CardTitle className="text-primary-blue flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Actualiza tu contraseña de acceso. Se pedirá la contraseña actual y una confirmación
            antes de aplicar el cambio.
          </p>
          <Button
            type="button"
            variant="outline"
            className="border-primary-blue text-primary-blue hover:bg-primary-blue/10"
            onClick={() => {
              passwordForm.reset();
              setPasswordModalOpen(true);
            }}
          >
            <KeyRound className="w-4 h-4 mr-2" />
            Cambiar contraseña
          </Button>
        </CardContent>
      </Card>

      {/* Modal: datos del cambio */}
      <Dialog
        open={passwordModalOpen}
        onOpenChange={(open) => {
          setPasswordModalOpen(open);
          if (!open) {
            setConfirmModalOpen(false);
            passwordForm.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Escribe tu contraseña actual y la nueva contraseña que deseas usar.
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña actual</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nueva contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasswordModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-primary-blue hover:bg-primary-blue/90"
              onClick={openConfirmChangePassword}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: confirmación */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Confirmar cambio?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de actualizar tu contraseña? Tendrás que usar la nueva contraseña la
              próxima vez que inicies sesión.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmModalOpen(false)}
              disabled={passwordActionLoading}
            >
              No, volver
            </Button>
            <Button
              type="button"
              className="bg-primary-blue hover:bg-primary-blue/90"
              onClick={() => void executePasswordChange()}
              disabled={passwordActionLoading}
            >
              {passwordActionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Sí, actualizar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <span>
              Fecha de ingreso:{" "}
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </span>
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
