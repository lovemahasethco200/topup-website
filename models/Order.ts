
import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    game: {
      type: String,
      required: true,
      trim: true,
    },
    package: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: String,
      required: true,
      trim: true,
    },
    items: [
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
    },
    packageName: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      min: 1,
    },
    unitPrice: {
      type: Number,
      min: 0,
    },
  },
],
    uid: {
      type: String,
      required: true,
      trim: true,
    },
    nickname: {
      type: String,
      required: true,
      trim: true,
    },
   phone: {
      type: String,
       required: false,
      default: "",
       trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Idempotency key used to prevent duplicate wallet purchases.
    // Existing orders can safely omit this field.
    checkoutRequestId: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    paymentMethod: {
      type: String,
      required: true,
      trim: true,
      default: "eSewa",
    },
    transactionId: {
      type: String,
      default: "",
      trim: true,
    },
    customerNote: {
      type: String,
      default: "",
      trim: true,
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      default: "Pending",
      trim: true,
    },
  },
  { timestamps: true }
);

// A logged-in customer can use a request ID only once.
// Older orders without checkoutRequestId are excluded.
OrderSchema.index(
  { userId: 1, checkoutRequestId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      checkoutRequestId: { $type: "string" },
    },
  }
);

export default mongoose.models.Order ||
  mongoose.model("Order", OrderSchema);
