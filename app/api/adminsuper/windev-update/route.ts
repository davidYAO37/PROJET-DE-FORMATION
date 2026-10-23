import { execSync, spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db/mongoConnect";
import { Entreprise } from "@/models/entreprise";

export const runtime = "nodejs";

function isProcessAlive(pid?: number): boolean {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function markInterrupted(jobs: mongoose.mongo.Collection, jobId: mongoose.Types.ObjectId) {
  return jobs.updateOne(
    { _id: jobId },
    { $set: { status: "failed", finishedAt: new Date(), error: "Processus de mise à jour interrompu (serveur redémarré ou arrêté)" } },
  );
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;
  if (user!.type !== "adminsuper") return NextResponse.json({ message: "Accès interdit" }, { status: 403 });

  await db();
  const connectionDb = mongoose.connection.db;
  if (!connectionDb) return NextResponse.json({ message: "Connexion MongoDB indisponible" }, { status: 503 });
  const enterpriseId = req.nextUrl.searchParams.get("entrepriseId");
  if (!enterpriseId || !mongoose.isValidObjectId(enterpriseId)) return NextResponse.json({ message: "Entreprise invalide" }, { status: 400 });
  const jobs = connectionDb.collection("windevimportjobs");
  const job = await jobs.findOne(
    { entrepriseId: new mongoose.Types.ObjectId(enterpriseId) },
    { sort: { createdAt: -1 }, projection: { logs: 0 } },
  );
  if (job && ["pending", "running"].includes(job.status) && job.pid && !isProcessAlive(job.pid)) {
    await markInterrupted(jobs, job._id);
    job.status = "failed";
    job.error = "Processus de mise à jour interrompu (serveur redémarré ou arrêté)";
  }
  return NextResponse.json({ job });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;
  if (user!.type !== "adminsuper") return NextResponse.json({ message: "Accès interdit" }, { status: 403 });

  let entrepriseId = "";
  let uploaded: File[] = [];
  if ((req.headers.get("content-type") || "").includes("multipart/form-data")) {
    const form = await req.formData();
    entrepriseId = String(form.get("entrepriseId") || "");
    uploaded = form.getAll("files").filter((f): f is File => f instanceof File && /\.(xlsx|xls|csv)$/i.test(f.name));
  } else {
    entrepriseId = (await req.json())?.entrepriseId || "";
  }
  if (!entrepriseId || !mongoose.isValidObjectId(entrepriseId)) return NextResponse.json({ message: "Entreprise invalide" }, { status: 400 });

  await db();
  const connectionDb = mongoose.connection.db;
  if (!connectionDb) return NextResponse.json({ message: "Connexion MongoDB indisponible" }, { status: 503 });
  const entreprise = await Entreprise.findById(entrepriseId).select("NomSociete dbName").lean();
  if (!entreprise?.dbName) return NextResponse.json({ message: "Entreprise ou base introuvable" }, { status: 404 });
  const jobs = connectionDb.collection("windevimportjobs");
  const active = await jobs.findOne({ entrepriseId: new mongoose.Types.ObjectId(entrepriseId), status: { $in: ["pending", "running"] } });
  if (active) {
    const recentlyCreated = Date.now() - new Date(active.createdAt).getTime() < 120_000;
    if (active.pid ? isProcessAlive(active.pid) : recentlyCreated) {
      return NextResponse.json({ message: "Une mise à jour est déjà en cours", job: active }, { status: 409 });
    }
    await markInterrupted(jobs, active._id);
  }

  let exportDir = process.env.WINDEV_EXPORT_DIR;
  let isUploadDir = false;
  if (uploaded.length) {
    exportDir = path.join(/*turbopackIgnore: true*/ os.tmpdir(), `windev-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    fs.mkdirSync(/*turbopackIgnore: true*/ exportDir, { recursive: true });
    try {
      for (const file of uploaded) {
        fs.writeFileSync(path.join(/*turbopackIgnore: true*/ exportDir, path.basename(file.name)), Buffer.from(await file.arrayBuffer()));
      }
    } catch {
      fs.rmSync(/*turbopackIgnore: true*/ exportDir, { recursive: true, force: true });
      return NextResponse.json({ message: "Impossible d'enregistrer les fichiers envoyés" }, { status: 500 });
    }
    isUploadDir = true;
  }
  if (!exportDir || !fs.existsSync(/*turbopackIgnore: true*/ exportDir)) return NextResponse.json({ message: "Sélectionnez le dossier d'export WinDev ou configurez WINDEV_EXPORT_DIR sur le serveur" }, { status: 503 });

  try {
    const result = await jobs.insertOne({
      entrepriseId: new mongoose.Types.ObjectId(entrepriseId),
      entreprise: entreprise.NomSociete || "",
      dbName: entreprise.dbName,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
      createdBy: new mongoose.Types.ObjectId(user!._id),
      exportDir,
      isUploadDir,
    });
    const worker = path.join(process.cwd(), "scripts", "import_windev", "run_update_job.js");
    const child = spawn(process.execPath, [worker, entrepriseId, result.insertedId.toString()], {
      env: { ...process.env, WINDEV_EXPORT_DIR: exportDir, WINDEV_CLEANUP_DIR: isUploadDir ? "1" : "" },
      detached: true,
      stdio: "ignore",
    });
    await jobs.updateOne({ _id: result.insertedId }, { $set: { pid: child.pid } });
    child.unref();

    return NextResponse.json({ message: `Mise à jour lancée pour ${entreprise.NomSociete}`, jobId: result.insertedId }, { status: 202 });
  } catch (err) {
    if (isUploadDir && exportDir) fs.rmSync(/*turbopackIgnore: true*/ exportDir, { recursive: true, force: true });
    throw err;
  }
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
  if (job.isUploadDir && typeof job.exportDir === "string") {
    try { fs.rmSync(/*turbopackIgnore: true*/ job.exportDir, { recursive: true, force: true }); } catch {}
  }

  return NextResponse.json({ message: "Mise à jour arrêtée" }, { status: 200 });
}
