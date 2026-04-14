import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  return (
    <Suspense>
      <LoginFormWrapper searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginFormWrapper({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm initialError={params?.error} />;
}
