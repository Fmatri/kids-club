import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

// Adresse de test : http://localhost:3000/api/health
export async function GET() {
  try {
    await connectDB();
    const result = await mongoose.connection.db?.admin().ping();

    return Response.json({
      ok: true,
      mongo: result?.ok === 1 ? "connecté" : "réponse inattendue",
    });
  } catch (error) {
    console.error("Erreur de connexion MongoDB :", error);
    return Response.json(
      { ok: false, mongo: "erreur de connexion" },
      { status: 500 },
    );
  }
}
