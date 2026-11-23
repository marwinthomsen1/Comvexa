import {cloudConfig} from "@/lib/auth/config";
import { AuthForm } from "@/features/auth/auth-form";
export const metadata = { title: "Create an account — Comvexa" };
export default function Register() {
  return <AuthForm mode="register" enabled={!!cloudConfig()} />;
}
