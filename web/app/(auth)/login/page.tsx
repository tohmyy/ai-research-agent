import { Suspense } from "react";

import { LoginForm } from "@/components/app-shell/login-form";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
