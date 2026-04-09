import { handleLogout } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  return handleLogout();
}