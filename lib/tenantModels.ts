import mongoose, { Connection, Model, Schema } from "mongoose";
import "@/models";

function cloneSchema(sourceSchema: Schema): Schema {
  if (typeof sourceSchema.clone === "function") {
    return sourceSchema.clone() as Schema;
  }
  return new Schema(sourceSchema.obj, sourceSchema.options);
}

export type TenantDocument<T> = Omit<T, "_id"> & mongoose.Document;

export function getTenantModel<T extends object>(
  connection: Connection,
  modelName: string
): Model<TenantDocument<T>> {
  const cached = connection.models[modelName] as Model<TenantDocument<T>> | undefined;
  if (cached) {
    return cached;
  }

  const sourceModel = mongoose.models[modelName];
  if (!sourceModel) {
    throw new Error(
      `Modèle "${modelName}" non enregistré. Vérifiez l'import dans models/index.ts.`
    );
  }

  const sourceSchema = sourceModel.schema as Schema;
  const clonedSchema = cloneSchema(sourceSchema);

  return connection.model(
    modelName,
    clonedSchema
  ) as unknown as Model<TenantDocument<T>>;
}
