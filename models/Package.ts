import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema(
  {
    gameSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    gameName: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: "General",
      trim: true,
    },
    price: {
      type: String,
      required: true,
      trim: true,
    },
    bonus: {
      type: String,
      default: "",
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Package ||
  mongoose.model("Package", PackageSchema);
