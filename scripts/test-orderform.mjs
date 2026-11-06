import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { LicenceOrder } from '../models/licenceOrder';
import { generateOrderFormPdf } from '../lib/pdfGenerator';

const MONGO_URI = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(MONGO_URI, { dbName: 'bd_esaymed' });
  const order = await LicenceOrder.findOne({ status: 'validated' }).sort({ createdAt: -1 });
  if (!order) {
    console.log('Aucune commande validée trouvée');
    process.exit(1);
  }
  const url = await generateOrderFormPdf(order);
  await LicenceOrder.findByIdAndUpdate(order._id, { orderFormUrl: url });
  console.log('Bon de commande généré:', url);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
