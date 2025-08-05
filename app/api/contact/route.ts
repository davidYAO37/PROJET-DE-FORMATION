// API route pour l'envoi d'email via Nodemailer
// Cette route reçoit les données du formulaire et envoie un email
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Remplacez ces valeurs par vos informations SMTP réelles
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  // Récupération des données du formulaire
  const { nom, email, message } = await req.json();

  try {
    // Envoi de l'email
    await transporter.sendMail({
      from: `EasyMedical <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // L'email du destinataire (ex: admin)
      subject: `Nouveau message de contact de ${nom}`,
      text: `Nom: ${nom}\nEmail: ${email}\nMessage: ${message}`,
      replyTo: email,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de l\'envoi de l\'email.' }, { status: 500 });
  }
}
