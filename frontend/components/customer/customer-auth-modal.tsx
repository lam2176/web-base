"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuthStore } from "@/lib/store/customerAuthStore";
import { customerAuthApi } from "@/lib/api/customerAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AuthMode = "login" | "register" | "verify-otp" | "forgot-password" | "reset-password";

interface CustomerAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: AuthMode;
  onSuccess?: () => void;
}

export function CustomerAuthModal({
  open,
  onOpenChange,
  defaultMode = "login",
  onSuccess,
}: CustomerAuthModalProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const { setAuth } = useCustomerAuthStore();

  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState(""); // For OTP verification

  // Login form
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register form
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phoneNumber: "",
  });

  // OTP form
  const [otpCode, setOtpCode] = useState("");

  // Reset password form
  const [resetData, setResetData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await customerAuthApi.login(loginData);

      // Check if email verification is required
      if ((response as any).requiresVerification) {
        setPendingEmail(loginData.email);
        setMode("verify-otp");

        toast({
          title: t("auth.verificationRequired"),
          description: (response as any).message || t("auth.otpSentToEmail"),
        });

        setLoading(false);
        return;
      }

      setAuth(response.customer, response.accessToken, response.refreshToken);

      toast({
        title: t("auth.loginSuccess"),
        description: t("customer.welcomeBack", { name: response.customer.fullName }),
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("auth.invalidCredentials"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password match
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("auth.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    // Validate password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(registerData.password)) {
      toast({
        title: t("common.error"),
        description: t("auth.passwordRequirements"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await customerAuthApi.register({
        email: registerData.email,
        password: registerData.password,
        fullName: registerData.fullName,
        phoneNumber: registerData.phoneNumber || undefined,
      });

      setPendingEmail(registerData.email);
      setMode("verify-otp");

      toast({
        title: t("auth.registerSuccess"),
        description: response.message,
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await customerAuthApi.verifyOtp({
        email: pendingEmail,
        otp: otpCode,
      });

      setAuth(response.customer, response.accessToken, response.refreshToken);

      toast({
        title: t("auth.otpVerified"),
        description: response.message,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("auth.invalidOtp"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);

    try {
      await customerAuthApi.resendOtp(pendingEmail);
      toast({
        title: t("common.success"),
        description: t("auth.otpSentTo", { email: pendingEmail }),
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await customerAuthApi.forgotPassword(email);
      setPendingEmail(email);
      setMode("reset-password");

      toast({
        title: t("common.success"),
        description: t("auth.otpSentTo", { email }),
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetData.newPassword !== resetData.confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("auth.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await customerAuthApi.resetPassword({
        email: pendingEmail,
        otp: resetData.otp,
        newPassword: resetData.newPassword,
      });

      toast({
        title: t("auth.passwordReset"),
        description: t("auth.loginNow"),
      });

      setMode("login");
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">{t("auth.email")}</Label>
        <Input
          id="login-email"
          type="email"
          value={loginData.email}
          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">{t("auth.password")}</Label>
        <Input
          id="login-password"
          type="password"
          value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          required
        />
      </div>

      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="link"
          className="px-0 text-sm"
          onClick={() => setMode("forgot-password")}
        >
          {t("auth.forgotPassword")}
        </Button>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("auth.login")}
      </Button>

      <div className="text-center text-sm">
        {t("auth.dontHaveAccount")}{" "}
        <Button
          type="button"
          variant="link"
          className="px-1"
          onClick={() => setMode("register")}
        >
          {t("auth.registerNow")}
        </Button>
      </div>
    </form>
  );

  const renderRegisterForm = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-fullName">{t("auth.fullName")}</Label>
        <Input
          id="register-fullName"
          type="text"
          value={registerData.fullName}
          onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">{t("auth.email")}</Label>
        <Input
          id="register-email"
          type="email"
          value={registerData.email}
          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-phone">{t("auth.phoneNumber")}</Label>
        <Input
          id="register-phone"
          type="tel"
          value={registerData.phoneNumber}
          onChange={(e) => setRegisterData({ ...registerData, phoneNumber: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">{t("auth.password")}</Label>
        <Input
          id="register-password"
          type="password"
          value={registerData.password}
          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">{t("auth.passwordRequirements")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirmPassword">{t("auth.confirmPassword")}</Label>
        <Input
          id="register-confirmPassword"
          type="password"
          value={registerData.confirmPassword}
          onChange={(e) =>
            setRegisterData({ ...registerData, confirmPassword: e.target.value })
          }
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("auth.register")}
      </Button>

      <div className="text-center text-sm">
        {t("auth.alreadyHaveAccount")}{" "}
        <Button
          type="button"
          variant="link"
          className="px-1"
          onClick={() => setMode("login")}
        >
          {t("auth.loginNow")}
        </Button>
      </div>
    </form>
  );

  const renderVerifyOtpForm = () => (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          {t("auth.otpSentTo")}: <strong>{pendingEmail}</strong>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp-code">{t("auth.otpCode")}</Label>
        <Input
          id="otp-code"
          type="text"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          maxLength={6}
          placeholder="123456"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("auth.verifyAndContinue")}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          className="text-sm"
          onClick={handleResendOtp}
          disabled={loading}
        >
          {t("auth.resendOtp")}
        </Button>
      </div>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="forgot-email">{t("auth.email")}</Label>
        <Input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("common.continue")}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          className="text-sm"
          onClick={() => setMode("login")}
        >
          {t("auth.loginNow")}
        </Button>
      </div>
    </form>
  );

  const renderResetPasswordForm = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          {t("auth.otpSentTo")}: <strong>{pendingEmail}</strong>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-otp">{t("auth.otpCode")}</Label>
        <Input
          id="reset-otp"
          type="text"
          value={resetData.otp}
          onChange={(e) => setResetData({ ...resetData, otp: e.target.value })}
          maxLength={6}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-newPassword">{t("auth.newPassword")}</Label>
        <Input
          id="reset-newPassword"
          type="password"
          value={resetData.newPassword}
          onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-confirmPassword">{t("auth.confirmPassword")}</Label>
        <Input
          id="reset-confirmPassword"
          type="password"
          value={resetData.confirmPassword}
          onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("auth.resetPassword")}
      </Button>
    </form>
  );

  const getTitleAndDescription = () => {
    switch (mode) {
      case "login":
        return { title: t("auth.login"), description: t("customer.welcomeBackTitle") };
      case "register":
        return { title: t("auth.register"), description: t("auth.registerNow") };
      case "verify-otp":
        return { title: t("auth.verifyOtp"), description: t("auth.otpSentTo") };
      case "forgot-password":
        return { title: t("auth.forgotPassword"), description: "" };
      case "reset-password":
        return { title: t("auth.resetPassword"), description: "" };
    }
  };

  const { title, description } = getTitleAndDescription();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {mode === "login" && renderLoginForm()}
        {mode === "register" && renderRegisterForm()}
        {mode === "verify-otp" && renderVerifyOtpForm()}
        {mode === "forgot-password" && renderForgotPasswordForm()}
        {mode === "reset-password" && renderResetPasswordForm()}
      </DialogContent>
    </Dialog>
  );
}
