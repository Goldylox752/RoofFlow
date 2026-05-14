import mongoose from "mongoose";

/* ===============================
   LEAD SCHEMA (SAAS MARKETPLACE CORE)
=============================== */

const LeadSchema = new mongoose.Schema(
  {
    /* ===============================
       CORE IDENTITY
    =============================== */
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },

    city: { type: String, trim: true, index: true },
    category: { type: String, trim: true, index: true },

    /* ===============================
       OWNERSHIP (MULTI-TENANT CORE)
    =============================== */
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },

    source: {
      type: String,
      default: "direct",
      index: true,
    },

    /* ===============================
       LIFECYCLE STATE MACHINE (CLEANED)
    =============================== */
    status: {
      type: String,
      enum: [
        "new",
        "available",
        "locked",
        "reserved",
        "sold",
        "assigned",
        "completed",
        "failed",
        "rejected",
      ],
      default: "new",
      index: true,
    },

    /* ===============================
       MARKET VALUE ENGINE
    =============================== */
    score: {
      type: Number,
      default: 50,
      min: 1,
      max: 100,
      index: true,
    },

    price: {
      type: Number,
      default: 0,
      index: true,
    },

    currency: {
      type: String,
      default: "usd",
    },

    /* ===============================
       STRIPE (FULL PAYMENT LIFECYCLE)
    =============================== */
    stripe: {
      payment_intent: { type: String, index: true },
      checkout_session: { type: String, index: true },
      customer_id: { type: String, index: true },
      paid: { type: Boolean, default: false, index: true },
      paid_at: Date,
    },

    /* ===============================
       BUYER / CONTRACTOR MODEL
    =============================== */
    buyer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    assigned_contractor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    /* ===============================
       ADVANCED LOCK SYSTEM (ANTI DOUBLE SELL)
    =============================== */
    lock: {
      owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
        default: null,
      },

      status: {
        type: String,
        enum: ["none", "active", "expired"],
        default: "none",
      },

      locked_at: Date,

      expires_at: {
        type: Date,
        index: true,
      },
    },

    /* ===============================
       DEDUPLICATION (ANTI SPAM / SCRAPING)
    =============================== */
    dedupeKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    /* ===============================
       FUNNEL ANALYTICS (SAAS GROWTH)
    =============================== */
    funnel: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      locks: { type: Number, default: 0 },
      purchases: { type: Number, default: 0 },
    },

    /* ===============================
       EVENT STREAM (APPEND ONLY LOG)
    =============================== */
    events: [
      {
        type: {
          type: String,
          enum: [
            "created",
            "viewed",
            "clicked",
            "locked",
            "unlocked",
            "reserved",
            "purchased",
            "paid",
            "assigned",
            "completed",
            "rejected",
          ],
        },

        actor_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        price: Number,
        meta: mongoose.Schema.Types.Mixed,

        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    /* ===============================
       SOFT DELETE (SAFETY + AUDIT)
    =============================== */
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

/* ===============================
   INDEXES (PRODUCTION OPTIMIZED)
=============================== */
LeadSchema.index({ city: 1, status: 1, score: -1 });
LeadSchema.index({ category: 1, status: 1, price: -1 });
LeadSchema.index({ tenant_id: 1, status: 1 });
LeadSchema.index({ "lock.expires_at": 1 });
LeadSchema.index({ buyer_id: 1, createdAt: -1 });
LeadSchema.index({ assigned_contractor_id: 1 });
LeadSchema.index({ deleted: 1 });

/* ===============================
   EXPORT MODEL (SAFE FOR NEXTJS / NODE)
=============================== */
export default mongoose.models.Lead ||
  mongoose.model("Lead", LeadSchema);