import { NextResponse } from "next/server";
import { z } from "zod";
import { createLead, getLeads } from "@/services/leads.service";

/* ===============================
   VALIDATION SCHEMA
=============================== */
const createLeadSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  category: z.string().min(1),
  value: z.number().min(0).optional(),
  score: z.number().min(0).max(100).optional(),
});

/* ===============================
   GET LEADS
=============================== */
export async function GET() {
  try {
    const leads = await getLeads();

    return NextResponse.json({
      success: true,
      leads,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

/* ===============================
   CREATE LEAD
=============================== */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = createLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const lead = await createLead(parsed.data);

    return NextResponse.json(
      { success: true, lead },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to create lead" },
      { status: 500 }
    );
  }
}