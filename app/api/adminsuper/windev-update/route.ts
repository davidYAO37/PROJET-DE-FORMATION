import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db/mongoConnect";
import { Entreprise } from "@/models/entreprise";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;
  if (user!.type !== "adminsuper") return NextResponse.json({ message: "Accès interdit" }, { status: 403 });

  await db();
  const connectionDb = mongoose.connection.db;
  if (!connectionDb) return NextResponse.json({ message: "Connexion MongoDB indisponible" }, { status: 503 });
  const enterpriseId = req.nextUrl.searchParams.get("entrepriseId");
  if (!enterpriseId || !mongoose.isValidObjectId(enterpriseId)) return NextResponse.json({ message: "Entreprise invalide" }, { status: 400 });
  const job = await connectionDb.collection("windevimportjobs").findOne(
    { entrepriseId: new mongoose.Types.ObjectId(enterpriseId) },
    { sort: { createdAt: -1 }, projection: { logs: 0 } },
  );
  return NextResponse.json({ job });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;
  if (user!.type !== "adminsuper") return NextResponse.json({ message: "Accès interdit" }, { status: 403 });

  const { entrepriseId } = await req.json();
  if (!entrepriseId || !mongoose.isValidObjectId(entrepriseId)) return NextResponse.json({ message: "Entreprise invalide" }, { status: 400 });
  const exportDir = process.env.WINDEV_EXPORT_DIR;
  if (!exportDir || !fs.existsSync(exportDir)) return NextResponse.json({ message: "WINDEV_EXPORT_DIR est absent ou inaccessible sur le serveur" }, { status: 503 });

  await db();
  const connectionDb = mongoose.connection.db;
  if (!connectionDb) return NextResponse.json({ message: "Connexion MongoDB indisponible" }, { status: 503 });
  const entreprise = await Entreprise.findById(entrepriseId).select("NomSociete dbName").lean();
  if (!entreprise?.dbName) return NextResponse.json({ message: "Entreprise ou base introuvable" }, { status: 404 });
  const jobs = connectionDb.collection("windevimportjobs");
  const active = await jobs.findOne({ entrepriseId: new mongoose.Types.ObjectId(entrepriseId), status: { $in: ["pending", "running"] } });
  if (active) return NextResponse.json({ message: "Une mise à jour est déjà en cours", job: active }, { status: 409 });

  const result = await jobs.insertOne({
    entrepriseId: new mongoose.Types.ObjectId(entrepriseId),
    entreprise: entreprise.NomSociete || "",
    dbName: entreprise.dbName,
    status: "pending",
    progress: 0,
    createdAt: new Date(),
    createdBy: new mongoose.Types.ObjectId(user!._id),
  });
  const worker = path.join(process.cwd(), "scripts", "import_windev", "run_update_job.js");
  const child = spawn(process.execPath, [worker, entrepriseId, result.insertedId.toString()], {
    cwd: process.cwd(),
    env: process.env,
    detached: true,
    stdio: "ignore",
  });
  await jobs.updateOne({ _id: result.insertedId }, { $set: { pid: child.pid } });
  child.unref();

  return NextResponse.json({ message: `Mise à jour lancée pour ${entreprise.NomSociete}`, jobId: result.insertedId }, { status: 202 });
}

function killWindowsProcess(pid?: number) {
  if (!pid) return;
  try {
    execSync(`taskkill /F /PID ${pid}`);
  } catch {
    // Le processus est probablement déjà terminé.
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;
  if (user!.type !== "adminsuper") return NextResponse.json({ message: "Accès interdit" }, { status: 403 });

  await db();
  const connectionDb = mongoose.connection.db;
  if (!connectionDb) return NextResponse.json({ message: "Connexion MongoDB indisponible" }, { status: 503 });

  const { searchParams } = req.nextUrl;
  const jobId = searchParams.get("jobId");
  if (!jobId || !mongoose.isValidObjectId(jobId)) return NextResponse.json({ message: "Job invalide" }, { status: 400 });

  const jobs = connectionDb.collection("windevimportjobs");
  const job = await jobs.findOne({ _id: new mongoose.Types.ObjectId(jobId) });
  if (!job) return NextResponse.json({ message: "Job introuvable" }, { status: 404 });
  if (!["pending", "running", "cancelling"].includes(job.status)) {
    return NextResponse.json({ message: "Aucune mise à jour active" }, { status: 409 });
  }

  await jobs.updateOne(
    { _id: new mongoose.Types.ObjectId(jobId) },
    { $set: { status: "cancelled", finishedAt: new Date(), error: "Mise à jour arrêtée par le super-admin", currentStep: "Arrêt demandé" } },
  );
  if (job.childPid) killWindowsProcess(job.childPid);
  if (job.pid) killWindowsProcess(job.pid);

  return NextResponse.json({ message: "Mise à jour arrêtée" }, { status: 200 });
}
