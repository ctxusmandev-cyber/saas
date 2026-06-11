import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCustomerAuth } from "@/lib/customer-auth";
import { useLocation, Link } from "wouter";
import { useRestaurantPath } from "@/lib/use-slug";
import { useState } from "react";
import { Eye, EyeOff, UserPlus, Loader2, ShieldCheck } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});
type FormValues = z.infer<typeof schema>;

export default function Signup() {
  const { register } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const rpath = useRestaurantPath();
  const [showPwd, setShowPwd] = useState(false);
  const [serverError, setServerError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    const { error } = await register(values.name, values.email, values.password, values.phone);
    if (error) { setServerError(error); return; }
    setLocation(rpath("/account"));
  };

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4">
              <UserPlus className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-1.5">Create an account</h1>
            <p className="text-muted-foreground">Track orders, reorder easily, and more</p>
          </div>

          <div className="bg-card border rounded-2xl p-8 shadow-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="Ali Hassan" autoComplete="name" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" autoComplete="email" className="h-11 rounded-xl" {...field} />
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
                      <FormLabel>Phone number <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="03xx-xxxxxxx" autoComplete="tel" className="h-11 rounded-xl" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPwd ? "text" : "password"}
                            placeholder="Min. 6 characters"
                            autoComplete="new-password"
                            className="h-11 rounded-xl pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input
                          type={showPwd ? "text" : "password"}
                          placeholder="Repeat your password"
                          autoComplete="new-password"
                          className="h-11 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {serverError && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
                    {serverError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-base font-semibold mt-1"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating account…</>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href={rpath("/login")} className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Your data is secure and never shared
          </p>
        </div>
      </div>
    </Layout>
  );
}
