import { AuthForm } from "@/features/auth/auth-form";
export const metadata = { title: "Login preview — Comvexa" };
export default function Login() {
  return <AuthForm mode="login" />;
}
