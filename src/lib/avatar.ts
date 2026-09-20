import { supabase } from "@/integrations/supabase/client";

/**
 * Avatars live in a private bucket. Profiles store the object path
 * (e.g. "<user-id>/avatar.png"); display code resolves a short-lived signed URL.
 * Legacy rows may still hold a full URL — those are returned as-is.
 */
export async function resolveAvatarUrl(value?: string | null): Promise<string> {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(value, 60 * 60);
  return data?.signedUrl ?? "";
}
