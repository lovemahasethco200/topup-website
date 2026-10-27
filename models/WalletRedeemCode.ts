
import mongoose, { Schema } from "mongoose";

const WalletRedeemCodeSchema = new Schema(
  {
    // Store only the normalized SHA-256 hash, not the redeem code itself.
    codeHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Redeem amount must be a whole number.",
      },
    },

    status: {
      type: String,
      enum: ["Active", "Disabled", "Redeemed"],
      default: "Active",
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    redeemedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    redeemedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: String,
      default: "admin",
      maxlength: 100,
    },

    adminNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

WalletRedeemCodeSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.WalletRedeemCode ||
  mongoose.model("WalletRedeemCode", WalletRedeemCodeSchema);
