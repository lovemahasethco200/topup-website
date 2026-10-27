
import mongoose, { Schema } from "mongoose";

const WalletTransactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["deposit", "purchase", "refund", "adjustment"],
      default: "deposit",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentMethod: {
      type: String,
      enum: ["eSewa", "Khalti", "Bank Transfer", "Other", "Wallet"],
      required: true,
    },
    transactionReference: {
      type: String,
      trim: true,
      maxlength: 150,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      required: true,
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

WalletTransactionSchema.index({
  userId: 1,
  createdAt: -1,
});

export default mongoose.models.WalletTransaction ||
  mongoose.model("WalletTransaction", WalletTransactionSchema);
