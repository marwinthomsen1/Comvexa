import { unavailableResponse } from "@/lib/auth/foundation";
// No body is read, no password is logged, and no session is fabricated.
export function POST() {
  return unavailableResponse();
}
