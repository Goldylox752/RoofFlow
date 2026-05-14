import mongoose from "mongoose";

/* ===============================
   LEAD SCHEMA (PRODUCTION SAAS MARKETPLACE)
=============================== */

const LeadSchema = new mongoose.Schema(
  {
    /* ===============================
       MULTI-TENANT OWNERSHIP (CRITICAL)
    =============================== */
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
      required: true,
    },

    source: {
      type: String,
      default: "direct",
      index: true,
    },

    /* ===============================
       CORE LEAD DATA
    =============================== */
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },

    city: { type: String, trim: true, index: true },
    category: { type: String, trim: true, index: true },

    /* ===============================
       MARKETPLACE STATE MACHINE (STRICT)
    =============================== */
    status: {
      type: String,
      enum: [
        "draft",
        "new",
        "available",
        "locked",
        "pending_payment",
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
       VALUE ENGINE
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
       STRIPE LIFECYCLE (REAL MONEY TRACKING)
    =============================== */
    stripe: {
      checkout_session_id: { type: String, index: true },
      payment_intent_id: { type: String, index: true },
      customer_id: { type: String, index: true },

      payment_status: {
        type: String,
        enum: ["unpaid", "pending", "paid", "failed", "refunded"],
        default: "unpaid",
        index: true,
      },

      paid_at: Date,
    },

    /* ===============================
       BUYER / CONTRACTOR RELATIONSHIP
    =============================== */
    buyer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    assigned_contractor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /* ===============================
       LOCK SYSTEM (ANTI DOUBLE BUY - FIXED)
    =============================== */
    lock: {
      owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      status: {
        type: String,
        enum: ["none", "active", "expired"],
        default: "none",
        index: true,
      },

      locked_at: Date,

      expires_at: {
        type: Date,
        index: true,
      },
    },

    /* ===============================
       DEDUPLICATION (ANTI FRAUD / SCRAPING)
    =============================== */
    dedupeKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    /* ===============================
       FUNNEL METRICS (SAAS GROWTH ENGINE)
    =============================== */
    funnel: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      locks: { type: Number, default: 0 },
      checkouts: { type: Number, default: 0 },
      purchases: { type: Number, default: 0 },
    },

    /* ===============================
       AUDIT TRAIL (IMMUTABLE EVENT LOG)
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
            "checkout_started",
            "payment_pending",
            "paid",
            "assigned",
            "completed",
            "rejected",
            "refunded",
          ],
          index: true,
        },

        actor_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        meta: mongoose.Schema.Types.Mixed,

        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    /* ===============================
       SOFT DELETE (SAFETY + COMPLIANCE)
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
   INDEX STRATEGY (PRODUCTION SAFE)
=============================== */
LeadSchema.index({ tenant_id: 1, status: 1, score: -1 });
LeadSchema.index({ city: 1, status: 1, price: -1 });
LeadSchema.index({ category: 1, status: 1 });
LeadSchema.index({ "lock.expires_at": 1 });
LeadSchema.index({ buyer_id: 1, createdAt: -1 });
LeadSchema.index({ assigned_contractor_id: 1 });
LeadSchema.index({ deleted: 1 });
LeadSchema.index({ "stripe.payment_status": 1 });

/* ===============================
   EXPORT SAFE MODEL
=============================== */
export default mongoose.models.Lead ||
  mongoose.model("Lead", LeadSchema);