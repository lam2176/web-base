"use client";

import { useRouter } from "next/navigation";
import { useCreateUser } from "@/lib/hooks/use-admin";
import UserForm, { getUserErrorMessage, UserFormValues } from "../user-form";

export default function NewUserPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { mutate: createUser, isPending } = useCreateUser();

  const handleSubmit = (values: UserFormValues) => {
    createUser(values, {
      onSuccess: () => {
        router.push(`/${locale}/admin/users`);
      },
      onError: (error: unknown) => {
        console.error("Failed to create user:", error);
        alert(
          getUserErrorMessage(
            error,
            locale,
            locale === "vi" ? "Không thể tạo người dùng" : "Failed to create user"
          )
        );
      },
    });
  };

  return <UserForm locale={locale} isSubmitting={isPending} onSubmit={handleSubmit} />;
}
