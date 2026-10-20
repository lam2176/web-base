"use client";

import { useRouter } from "next/navigation";
import { useAdminUser, useUpdateUser } from "@/lib/hooks/use-admin";
import { UpdateUserDto } from "@/lib/types/api";
import UserForm, { getUserErrorMessage, UserFormValues } from "../../user-form";

export default function EditUserPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const userId = Number(id);
  const router = useRouter();
  const { data: user, isLoading } = useAdminUser(userId);
  const { mutate: updateUser, isPending } = useUpdateUser();

  const handleSubmit = ({ email, password, role }: UserFormValues) => {
    // Only send the password when the admin typed a new one
    const data: UpdateUserDto = { email, role };
    if (password) data.password = password;

    updateUser(
      { id: userId, data },
      {
        onSuccess: () => {
          router.push(`/${locale}/admin/users`);
        },
        onError: (error: unknown) => {
          console.error("Failed to update user:", error);
          alert(
            getUserErrorMessage(
              error,
              locale,
              locale === "vi" ? "Không thể cập nhật người dùng" : "Failed to update user"
            )
          );
        },
      }
    );
  };

  if (Number.isNaN(userId)) {
    return <p className="text-sm text-red-500">Invalid user ID</p>;
  }

  if (isLoading || !user) {
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
    <UserForm locale={locale} user={user} isSubmitting={isPending} onSubmit={handleSubmit} />
  );
}
