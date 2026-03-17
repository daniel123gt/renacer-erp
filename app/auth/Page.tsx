import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "~/components/ui/form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmail } from "~/services/authService";
import { useLoadingStore } from "~/store/loadingStore";
import { useAuthStore } from "~/store/authStore";
import { useNavigate } from "react-router";
import { getAppName, getLogoPath } from "~/lib/erpBranding";

const formSchema = z.object({
  email: z.string().email({
    message: "Debe ser un email válido",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  }),
});

export default function AuthPage() {
  const { setLoading, isLoading } = useLoadingStore();
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const { email, password } = values;
      const response = await signInWithEmail(email, password);
      
      if (response.error) {
        // Manejo específico de errores de Supabase
        if (response.error.message.includes('Invalid login credentials')) {
          toast.error("Credenciales incorrectas. Verifica tu email y contraseña.");
        } else if (response.error.message.includes('Email not confirmed')) {
          toast.error("Por favor confirma tu email antes de iniciar sesión.");
        } else if (response.error.message.includes('Too many requests')) {
          toast.error("Demasiados intentos. Espera un momento antes de intentar nuevamente.");
        } else {
          toast.error(`Error de autenticación: ${response.error.message}`);
        }
        return;
      }
      
      if (response?.data?.user) {
        login(response.data.user);
        toast.success("¡Bienvenido!");
        navigate("/");
      } else {
        toast.error("Error inesperado. Intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error durante el login:", error);
      toast.error("Error de conexión. Verifica tu internet.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 min-h-dvh">
      <div className="flex-1 flex flex-col gap-8 lg:gap-12 justify-center items-center bg-soft-blue lg:col-span-8 px-4 py-12 sm:px-6 relative z-10">
        <div className="flex flex-col items-center gap-4 lg:hidden">
          <img src="/logo-light-large.png" alt={getAppName()} className="w-20 h-20 rounded-2xl shadow-lg bg-primary-blue p-2" />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl text-center font-bold text-primary-blue uppercase max-w-[400px]">
          {getAppName()} ERP
        </h1>
        <Card className="w-full max-w-[400px] border-0">
          <CardHeader>
            <CardTitle className="text-primary-blue font-bold text-2xl">
              Iniciar Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-6 sm:gap-8"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          className="border-primary-blue/10"
                          type="email"
                          placeholder="tu@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          className="border-primary-blue/10"
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary-blue cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div className="hidden lg:flex lg:col-span-4 bg-primary-blue justify-center items-center p-12">
        <figure className="flex justify-center items-center">
          <img src="/logo-light-large.png" alt={getAppName()} className="w-3/4 max-w-[280px] rounded-3xl" />
        </figure>
      </div>
      <div className="absolute bottom-0 left-0 hidden sm:block">
        <img src="illus/Rectangle1.svg" className="w-[80%]" />
        <img src="illus/Rectangle2.svg" className="absolute bottom-0 w-[80%]" />
      </div>
    </div>
  );
}
