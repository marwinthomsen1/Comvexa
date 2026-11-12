import { unavailableResponse } from "@/lib/auth/foundation";
// The public local preview never grants access to a cloud account.
export function GET() {
  return unavailableResponse();
}
export function POST() {
  return unavailableResponse();
}
