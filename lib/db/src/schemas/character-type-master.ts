import { Schema, model, type Document } from "mongoose";

export interface ICharacterTypeMaster
  extends Document {
  typeId: string;
  name: string;
  effect: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const characterTypeMasterSchema =
  new Schema<ICharacterTypeMaster>(
    {
      typeId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^[a-z0-9-]+$/,
      },

      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      effect: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000,
      },

      order: {
        type: Number,
        required: true,
        default: 0,
      },

      active: {
        type: Boolean,
        required: true,
        default: true,
      },
    },
    {
      timestamps: true,
    },
  );

characterTypeMasterSchema.index({
  order: 1,
  name: 1,
});

characterTypeMasterSchema.index({
  active: 1,
});

export const CharacterTypeMaster =
  model<ICharacterTypeMaster>(
    "CharacterTypeMaster",
    characterTypeMasterSchema,
  );