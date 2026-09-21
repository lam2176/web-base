"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Shield, User } from "lucide-react";
import { useAdminUsers, useDeleteUser } from "@/lib/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User as UserType } from "@/lib/types/api";

export default function AdminUsersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  const { data: users = [], isLoading: loading } = useAdminUsers();
  const { mutate: deleteUser } = useDeleteUser();

  const handleDelete = () => {
    if (!userToDelete) return;

    deleteUser(userToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      },
      onError: (error: unknown) => {
        console.error("Failed to delete user:", error);
        alert(
          locale === "vi" ? "Không thể xóa người dùng" : "Failed to delete user"
        );
      },
    });
  };

  const getRoleLabel = (role: string) => {
    if (locale === "vi") {
      return role === "admin" ? "Quản trị viên" : "Nhân viên";
    }
    return role === "admin" ? "Administrator" : "Staff";
  };

  const getRoleBadgeColor = (role: string) => {
    return role === "admin"
      ? "bg-purple-100 text-purple-800"
      : "bg-blue-100 text-blue-800";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">
            {locale === "vi" ? "Đang tải..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === "vi" ? "Quản lý Người Dùng" : "Users Management"}
          </h1>
          <p className="text-sm text-gray-600">
            {locale === "vi"
              ? "Quản lý tài khoản admin và staff"
              : "Manage admin and staff accounts"}
          </p>
        </div>
        <Link href={`/${locale}/admin/users/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {locale === "vi" ? "Thêm người dùng" : "Add User"}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={
              locale === "vi" ? "Tìm kiếm email..." : "Search email..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {locale === "vi" ? "Người dùng" : "User"}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {locale === "vi" ? "Email" : "Email"}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {locale === "vi" ? "Vai trò" : "Role"}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {locale === "vi" ? "Ngày tạo" : "Created At"}
                </th>
                <th className="p-4 text-right text-sm font-medium text-gray-600">
                  {locale === "vi" ? "Thao tác" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    {locale === "vi"
                      ? "Không có người dùng nào"
                      : "No users found"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                          {user.role === "admin" ? (
                            <Shield className="h-5 w-5 text-gray-600" />
                          ) : (
                            <User className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.email.split("@")[0]}
                          </p>
                          <p className="text-sm text-gray-500">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/${locale}/admin/users/${user.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === "vi" ? "Xác nhận xóa" : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === "vi"
                ? `Bạn có chắc chắn muốn xóa người dùng "${userToDelete?.email}"? Hành động này không thể hoàn tác.`
                : `Are you sure you want to delete user "${userToDelete?.email}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {locale === "vi" ? "Hủy" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {locale === "vi" ? "Xóa" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
