import twilio from "twilio";

/* ===============================
   ENV HELPERS
=============================== */
const requiredEnv = (key) => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(
      `Missing environment variable: ${key}`
    );
  }

  return value;
};

const maskSid = (sid) => {
  if (!sid) return "unknown";

  return `${sid.slice(0, 6)}****`;
};

/* ===============================
   ENV CONFIG
=============================== */
const TWILIO_SID =
  requiredEnv("TWILIO_SID");

const TWILIO_AUTH_TOKEN =
  requiredEnv("TWILIO_AUTH_TOKEN");

const TWILIO_PHONE_NUMBER =
  process.env.TWILIO_PHONE_NUMBER?.trim() ||
  null;

/* ===============================
   TWILIO SERVICE
=============================== */
class TwilioService {
  static instance = null;

  static initialized = false;

  /* ===============================
     GET CLIENT SINGLETON
  =============================== */
  static getClient() {
    if (!TwilioService.instance) {
      TwilioService.instance = twilio(
        TWILIO_SID,
        TWILIO_AUTH_TOKEN,
        {
          lazyLoading: true,

          // Optional edge optimization
          // edge: "ashburn",
          // region: "us1",

          autoRetry: true,
          maxRetries: 3,
        }
      );

      if (!TwilioService.initialized) {
        console.log(
          `📞 Twilio initialized (${maskSid(TWILIO_SID)})`
        );

        TwilioService.initialized = true;
      }
    }

    return TwilioService.instance;
  }

  /* ===============================
     OPTIONAL HEALTH CHECK
  =============================== */
  static async verifyConnection() {
    try {
      const client =
        TwilioService.getClient();

      await client.api.accounts(
        TWILIO_SID
      ).fetch();

      console.log(
        "✅ Twilio connection verified"
      );

      return true;

    } catch (err) {
      console.error(
        "❌ Twilio verification failed:",
        err.message
      );

      return false;
    }
  }

  /* ===============================
     SMS HELPER
  =============================== */
  static async sendSMS({
    to,
    body,
  }) {
    const client =
      TwilioService.getClient();

    if (!TWILIO_PHONE_NUMBER) {
      throw new Error(
        "Missing TWILIO_PHONE_NUMBER"
      );
    }

    return client.messages.create({
      to,
      body,
      from: TWILIO_PHONE_NUMBER,
    });
  }
}

/* ===============================
   EXPORTS
=============================== */
export const client =
  TwilioService.getClient();

export default TwilioService;