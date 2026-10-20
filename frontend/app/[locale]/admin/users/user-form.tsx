"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/lib/types/api";

export interface UserFormValues {
  email: string;
  password: string;
  role: "admin" | "staff";
}

interface UserFormProps {
  locale: string;
  user?: User;
  isSubmitting: boolean;
  onSubmit: (values: UserFormValues) => void;
}

// Backend messages are English; translate the known ones for the admin UI
const ERROR_MESSAGES_VI: Record<string, string> = {
  "Email already exists": "Email đã tồn tại",
  "User not found": "Không tìm thấy người dùng",
  "You cannot change your own role": "Bạn không thể tự đổi vai trò của chính mình",
  "You cannot delete your own account": "Bạn không thể xóa tài khoản của chính mình",
  "At least one admin account is required": "Phải còn ít nhất một tài khoản quản trị viên",
};

export function getUserErrorMessage(error: unknown, locale: string, fallback: string) {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  if (!message) return fallback;
  return locale === "vi" ? ERROR_MESSAGES_VI[message] ?? message : message;
}

export default function UserForm({ locale, user, isSubmitting, onSubmit }: UserFormProps) {
  const router = useRouter();
  const isEdit = !!user;
  const vi = locale === "vi";

  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"admin" | "staff">(user?.role ?? "staff");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password && password.length < 6) {
      setError(vi ? "Mật khẩu phải có ít nhất 6 ký tự" : "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError(vi ? "Mật khẩu xác nhận không khớp" : "Passwords do not match");
      return;
    }

    onSubmit({ email: email.trim(), password, role });
  };

  const title = isEdit
    ? vi ? "Sửa người dùng" : "Edit User"
    : vi ? "Thêm người dùng" : "Add User";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/${locale}/admin/users`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600">
            {isEdit
              ? user.email
              : vi ? "Tạo tài khoản admin hoặc staff mới" : "Create a new admin or staff account"}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{vi ? "Thông tin tài khoản" : "Account Information"}</CardTitle>
          <CardDescription>
            {isEdit
              ? vi ? "Để trống mật khẩu nếu không muốn đổi" : "Leave password empty to keep the current one"
              : vi ? "Mật khẩu tối thiểu 6 ký tự" : "Password must be at least 6 characters"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{vi ? "Vai trò" : "Role"}</Label>
              <Select value={role} onValueChange={(value) => setRole(value as "admin" | "staff")}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">{vi ? "Nhân viên" : "Staff"}</SelectItem>
                  <SelectItem value="admin">{vi ? "Quản trị viên" : "Administrator"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">
                  {isEdit ? (vi ? "Mật khẩu mới" : "New Password") : vi ? "Mật khẩu" : "Password"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required={!isEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {vi ? "Xác nhận mật khẩu" : "Confirm Password"}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required={!isEdit || !!password}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <CardFooter className="flex justify-end gap-3 px-0">
              <Button type="button" variant="outline" asChild>
                <Link href={`/${locale}/admin/users`}>{vi ? "Hủy" : "Cancel"}</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (vi ? "Đang lưu..." : "Saving...") : vi ? "Lưu" : "Save"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
