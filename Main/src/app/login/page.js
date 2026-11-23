import {cloudConfig} from "@/lib/auth/config";
import { AuthForm } from "@/features/auth/auth-form";
export const metadata = { title: "Log in — Comvexa" };
export default function Login() {
  return <AuthForm mode="login" enabled={!!cloudConfig()} />;
}
