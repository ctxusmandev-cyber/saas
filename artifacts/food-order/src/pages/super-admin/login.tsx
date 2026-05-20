import { useState } from "react";
import { useSuperAdmin } from "@/lib/admin-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function SuperAdminLogin() {
  const { login } = useSuperAdmin();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const success = await login(password);
    if (success) {
      setLocation("/super-admin");
    } else {
      setError("Incorrect super admin password.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-serif font-bold">Super Admin</h1>
            <p className="text-muted-foreground mt-2">Platform management access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">Super Admin Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter super admin password"
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading || !password}>
              {isLoading ? "Verifying..." : "Access Super Admin"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <a href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Back to main site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
