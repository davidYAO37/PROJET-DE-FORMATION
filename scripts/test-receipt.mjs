import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { LicenceOrder } from '../models/licenceOrder';
import { generateReceiptPdf } from '../lib/pdfGenerator';

const MONGO_URI = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(MONGO_URI, { dbName: 'bd_esaymed' });
  const order = await LicenceOrder.findOne({ status: 'validated' }).sort({ createdAt: -1 });
  if (!order) {
    console.log('Aucune commande validée trouvée');
    process.exit(1);
  }
  if (!order.paidAt) {
    order.paidAt = new Date();
    await order.save();
  }
  const url = await generateReceiptPdf(order);
  await LicenceOrder.findByIdAndUpdate(order._id, { paymentReceiptUrl: url });
  console.log('Reçu généré:', url);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
