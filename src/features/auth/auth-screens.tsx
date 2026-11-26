import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Command,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { getHomeRouteForRole } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { fetchTrustedProfile } from "@/lib/auth-helpers";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Common Brand Header for all Auth Screens
function AuthHeader({ subtitle, badge }: { subtitle: string; badge?: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-2 mb-6">
      <Link
        to="/employee/dashboard"
        className="group inline-flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
      >
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
          <Command className="size-5" />
        </span>
        <div className="text-left">
          <span className="block text-lg font-bold tracking-tight text-foreground leading-tight">
            triageagent
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Ticket Orbit Workbench
          </span>
        </div>
      </Link>
      {badge && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
          <ShieldCheck className="size-3.5" />
          {badge}
        </span>
      )}
      <p className="text-sm text-muted-foreground max-w-sm pt-1">{subtitle}</p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 1. Employee Login Screen (also routes Support and Admin to their workspaces)
// ----------------------------------------------------------------------------
export function EmployeeLoginScreen() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitted, setResetSubmitted] = useState(false);

  const handleDemoFill = () => {
    setEmail("morgan.lee@example.com");
    setPassword("SupportPass2026!");
    setAuthError(null);
    toast.info("Sample credentials loaded into form. Enter real account credentials to sign in.");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !password) {
      const msg = "Please provide both email and password.";
      setAuthError(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        const msg = error?.message || "Invalid email or password.";
        setAuthError(msg);
        toast.error(msg);
        return;
      }

      const profile = await fetchTrustedProfile(data.user.id);
      if (profile.error || !profile.role) {
        await supabase.auth.signOut();
        const msg = profile.error ?? "User profile not found. Access denied.";
        setAuthError(msg);
        toast.error(msg);
        return;
      }

      await refreshProfile();
      const displayName = profile.fullName ?? data.user.email ?? "User";
      toast.success(`Welcome back, ${displayName}!`);
      await navigate({ to: getHomeRouteForRole(profile.role) });
    } catch {
      const msg = "Unable to complete sign-in. Please try again.";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSsoLogin = (provider: string) => {
    toast.info(
      `${provider} Single Sign-On is not configured for this workspace. Please sign in with email and password.`,
    );
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Please enter your account email address.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
    if (error) {
      toast.error(error.message);
      return;
    }
    setResetSubmitted(true);
    toast.success("Password reset instructions sent! Please check your inbox.");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[440px]">
        <AuthHeader
          subtitle="Sign in to your employee account to submit, track, and triage IT support requests."
          badge="Employee Portal"
        />

        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Sign in</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDemoFill}
                className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
              >
                <Sparkles className="size-3.5" />
                Fill Demo
              </Button>
            </div>
            <CardDescription>Enter your workplace email and password to proceed.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {authError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee-email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="employee-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label htmlFor="employee-password">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetSubmitted(false);
                      setForgotModalOpen(true);
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="employee-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember-me"
                  className="text-xs text-muted-foreground cursor-pointer select-none"
                >
                  Keep me signed in on this device
                </label>
              </div>

              <Button type="submit" className="w-full gap-2 mt-2" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or single sign-on</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                type="button"
                className="w-full text-xs"
                onClick={() => handleSsoLogin("Google Workspace")}
                disabled={isLoading}
              >
                Google SSO
              </Button>
              <Button
                variant="outline"
                type="button"
                className="w-full text-xs"
                onClick={() => handleSsoLogin("Microsoft Entra")}
                disabled={isLoading}
              >
                Microsoft SSO
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 border-t border-border bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-muted-foreground">New to Ticket Orbit?</span>
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </div>
            <div className="flex items-center justify-between w-full text-xs pt-1 border-t border-border/50">
              <span className="text-muted-foreground">IT Administrator or Ops?</span>
              <Link to="/admin/login" className="font-semibold text-chart-4 hover:underline">
                Admin Console sign-in →
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secured by Supabase Authentication · Employee &amp; Support Portal
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotModalOpen} onOpenChange={setForgotModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your work email address and we will generate a secure reset link.
            </DialogDescription>
          </DialogHeader>

          {!resetSubmitted ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Work Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="ghost" onClick={() => setForgotModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Send instructions</Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 py-3 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Check className="size-6" />
              </div>
              <div>
                <h4 className="font-semibold text-base">Check your inbox</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  We've simulated sending password reset instructions to{" "}
                  <span className="font-medium text-foreground">{resetEmail}</span>.
                </p>
              </div>
              <DialogFooter>
                <Button className="w-full" onClick={() => setForgotModalOpen(false)}>
                  Back to Sign In
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2. Registration / Sign-up Screen
// ----------------------------------------------------------------------------
export function RegisterScreen() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Password strength calculator
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore = [hasMinLength, hasLetter, hasNumber, hasSpecial].filter(Boolean).length;

  const handleDemoFill = () => {
    setFullName("Alex Rivera");
    setEmail("alex.rivera@company.com");
    setDepartment("Product & Design");
    setPassword("OrbitSecure#2026");
    setConfirmPassword("OrbitSecure#2026");
    setTermsAccepted(true);
    setAuthError(null);
    toast.info("Sample registration data prefilled.");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      const msg = "Please complete all required fields.";
      setAuthError(msg);
      toast.error(msg);
      return;
    }
    if (password !== confirmPassword) {
      const msg = "Passwords do not match.";
      setAuthError(msg);
      toast.error(msg);
      return;
    }
    if (password.length < 8) {
      const msg = "Password must be at least 8 characters.";
      setAuthError(msg);
      toast.error(msg);
      return;
    }
    if (!termsAccepted) {
      const msg = "Please accept the terms of service to continue.";
      setAuthError(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);
    try {
      const trimmedEmail = email.trim();
      const trimmedName = fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
            department,
          },
        },
      });

      if (error || !data.user) {
        const msg = error?.message || "Unable to complete registration.";
        setAuthError(msg);
        toast.error(msg);
        return;
      }

      if (!data.session) {
        toast.success(
          `Account created for ${trimmedName}! Please check your email to confirm your account, then sign in.`,
        );
        await navigate({ to: "/login" });
        return;
      }

      // Check whether a database trigger already created the profiles row to avoid duplicates.
      const existingProfile = await fetchTrustedProfile(data.user.id);
      if (existingProfile.error && existingProfile.error !== "User profile not found.") {
        await supabase.auth.signOut();
        setAuthError(existingProfile.error);
        toast.error(existingProfile.error);
        return;
      }

      if (existingProfile.error === "User profile not found.") {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: trimmedName,
          role: "employee",
        });

        if (insertError) {
          await supabase.auth.signOut();
          const msg = "Account created, but profile setup failed. Please contact support.";
          setAuthError(msg);
          toast.error(msg);
          return;
        }
      }

      const verifiedProfile = await fetchTrustedProfile(data.user.id);
      if (verifiedProfile.error || !verifiedProfile.role) {
        await supabase.auth.signOut();
        const msg = verifiedProfile.error ?? "Unable to verify new profile.";
        setAuthError(msg);
        toast.error(msg);
        return;
      }

      await refreshProfile();
      toast.success(`Account registered for ${trimmedName}!`);
      await navigate({ to: getHomeRouteForRole(verifiedProfile.role) });
    } catch {
      const msg = "Unable to complete registration. Please try again.";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[480px]">
        <AuthHeader
          subtitle="Create your employee profile to open support tickets, view triage resolutions, and track IT requests."
          badge="Employee Registration"
        />

        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Create account</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDemoFill}
                className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
              >
                <Sparkles className="size-3.5" />
                Fill Sample
              </Button>
            </div>
            <CardDescription>Fill in your workplace credentials to get started.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {authError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="reg-fullname">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="reg-fullname"
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="reg-email">Work Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="alex.rivera@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="reg-dept">Department / Team</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger id="reg-dept">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering & DevOps</SelectItem>
                      <SelectItem value="Product & Design">Product & Design</SelectItem>
                      <SelectItem value="Marketing">Growth & Marketing</SelectItem>
                      <SelectItem value="Sales">Sales & Customer Success</SelectItem>
                      <SelectItem value="Finance">Finance & Accounting</SelectItem>
                      <SelectItem value="Human Resources">People & HR</SelectItem>
                      <SelectItem value="Operations">Workplace & Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="reg-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="reg-confirm">Confirm Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="reg-confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 pr-9"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password strength indication */}
              {password && (
                <div className="rounded-md border border-border bg-muted/30 p-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="text-muted-foreground">Password strength</span>
                    <span
                      className={
                        strengthScore <= 1
                          ? "text-destructive font-semibold"
                          : strengthScore <= 3
                            ? "text-chart-4 font-semibold"
                            : "text-primary font-semibold"
                      }
                    >
                      {strengthScore <= 1 ? "Weak" : strengthScore <= 3 ? "Moderate" : "Strong"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div
                      className={`h-1 rounded-full ${
                        strengthScore >= 1 ? "bg-primary" : "bg-muted"
                      }`}
                    />
                    <div
                      className={`h-1 rounded-full ${
                        strengthScore >= 2 ? "bg-primary" : "bg-muted"
                      }`}
                    />
                    <div
                      className={`h-1 rounded-full ${
                        strengthScore >= 3 ? "bg-primary" : "bg-muted"
                      }`}
                    />
                    <div
                      className={`h-1 rounded-full ${
                        strengthScore >= 4 ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-2 pt-1">
                <Checkbox
                  id="reg-terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="reg-terms"
                  className="text-xs text-muted-foreground cursor-pointer select-none leading-relaxed"
                >
                  I agree to the company IT workspace policies and acceptable use guidelines.
                </label>
              </div>

              <Button type="submit" className="w-full gap-2 mt-2" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating account...
                  </span>
                ) : (
                  <>
                    Complete Registration
                    <CheckCircle2 className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 border-t border-border bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-muted-foreground">Already registered?</span>
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in to your account
              </Link>
            </div>
            <div className="flex items-center justify-between w-full text-xs pt-1 border-t border-border/50">
              <span className="text-muted-foreground">Looking for IT administration?</span>
              <Link to="/admin/login" className="font-semibold text-chart-4 hover:underline">
                Admin Console sign-in →
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secured by Supabase Authentication · Employee Registration
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 3. Admin / Support Login Screen
// ----------------------------------------------------------------------------
export function AdminLoginScreen() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [enable2FA, setEnable2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleDemoFill = () => {
    setAdminEmail("casey.morgan@example.com");
    setAdminPassword("SecOps#Master99");
    setTwoFactorCode("847291");
    setEnable2FA(true);
    setAuthError(null);
    toast.info(
      "Sample credentials loaded into form. Enter real admin/support credentials to sign in.",
    );
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!adminEmail.trim() || !adminPassword) {
      const msg = "Please enter administrator or support credentials.";
      setAuthError(msg);
      toast.error(msg);
      return;
    }

    if (enable2FA && twoFactorCode.trim().length < 6) {
      const msg = "Please provide the 6-digit security verification code.";
      setAuthError(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });

      if (error || !data.user) {
        const msg = error?.message || "Invalid administrator credentials.";
        setAuthError(msg);
        toast.error(msg);
        return;
      }

      const profile = await fetchTrustedProfile(data.user.id);
      if (profile.error || !profile.role) {
        await supabase.auth.signOut();
        const msg = profile.error ?? "User profile not found. Access denied.";
        setAuthError(msg);
        toast.error(msg);
        return;
      }

      if (profile.role !== "admin" && profile.role !== "support") {
        await supabase.auth.signOut();
        const msg =
          "Insufficient permissions. Operations console is restricted to support and admin roles.";
        setAuthError(msg);
        toast.error(msg);
        return;
      }

      await refreshProfile();
      const displayName = profile.fullName ?? data.user.email ?? "Operator";
      toast.success(`Security clearances verified. Welcome, ${displayName}!`);
      await navigate({ to: getHomeRouteForRole(profile.role) });
    } catch {
      const msg = "Unable to verify credentials. Please try again.";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[440px]">
        <AuthHeader
          subtitle="Restricted access portal for IT operations, triage queue management, and system administration."
          badge="Operations Console"
        />

        <Card className="border-border shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-chart-4 via-primary to-chart-1" />

          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-md bg-chart-4/15 text-chart-4">
                  <Lock className="size-4" />
                </span>
                <CardTitle className="text-xl font-semibold">Admin Sign In</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDemoFill}
                className="h-8 gap-1.5 text-xs text-chart-4 hover:text-chart-4 border-chart-4/30 hover:bg-chart-4/10"
              >
                <Sparkles className="size-3.5" />
                Fill Admin
              </Button>
            </div>
            <CardDescription>
              Enter privileged credentials to access support queues and escalations.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Restricted Banner */}
            <div className="flex items-center gap-2.5 rounded-md border border-chart-4/30 bg-chart-4/10 p-3 text-xs text-foreground">
              <ShieldAlert className="size-4 shrink-0 text-chart-4" />
              <p>
                Authorized personnel only. All administrative logins and operational changes are
                audited.
              </p>
            </div>

            {authError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Administrator Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@company.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Administrative Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="rounded-md border border-border p-3 space-y-2.5 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="admin-2fa"
                      checked={enable2FA}
                      onCheckedChange={(checked) => setEnable2FA(checked as boolean)}
                    />
                    <label
                      htmlFor="admin-2fa"
                      className="text-xs font-medium cursor-pointer select-none"
                    >
                      Require 2-Factor Authentication (TOTP)
                    </label>
                  </div>
                  {enable2FA && (
                    <span className="text-[10px] uppercase font-bold text-chart-4 tracking-wider">
                      Required
                    </span>
                  )}
                </div>

                {enable2FA && (
                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="admin-totp" className="text-xs text-muted-foreground">
                      6-Digit Security Token / Hardware Key
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="admin-totp"
                        type="text"
                        maxLength={6}
                        placeholder="847291"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                        className="pl-9 font-mono tracking-widest text-center"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gap-2 mt-2 bg-foreground text-background hover:bg-foreground/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Verifying security credentials...
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    Enter Operations Center
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 border-t border-border bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-muted-foreground">Not an administrator?</span>
              <Link
                to="/login"
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="size-3" />
                Employee Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secured by Supabase Authentication · Support &amp; Admin Console
        </p>
      </div>
    </div>
  );
}
