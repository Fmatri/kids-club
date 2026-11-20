"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { exigerAdmin } from "@/lib/session";
import { Programme } from "@/models/Programme";

// Publier ou retirer un programme du site vitrine
export async function basculerPublication(id: string): Promise<{ message?: string }> {
  await exigerAdmin(); // OBLIGATOIRE

  if (!isValidObjectId(id)) return { message: "Programme introuvable." };
  await connectDB();
  const programme = await Programme.findById(id);
  if (!programme) return { message: "Programme introuvable." };

  programme.publieSurLeSite = !programme.publieSurLeSite;
  try {
    await programme.save();
  } catch (e) {
    console.error(e);
    return { message: "Impossible de modifier la publication. Réessayez." };
  }

  revalidatePath("/admin/programmes");
  revalidatePath("/admin");
  return {};
}