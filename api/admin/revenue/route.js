import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    /**
     * STEP 1: Fetch only required fields
     */
    const { data, error } = await supabase
      .from("leads")
      .select("price, status");

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Database query failed",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const leads = data ?? [];

    /**
     * STEP 2: Safe aggregation (typed + defensive)
     */
    let revenue = 0;
    let billed = 0;

    for (const lead of leads) {
      const price = Number(lead.price) || 0;
      revenue += price;

      if (lead.status === "assigned") {
        billed++;
      }
    }

    const totalLeads = leads.length;

    /**
     * STEP 3: Derived SaaS metrics (useful for dashboards)
     */
    const avgRevenuePerLead = totalLeads ? revenue / totalLeads : 0;
    const billedRate = totalLeads ? billed / totalLeads : 0;

    /**
     * STEP 4: Response
     */
    return NextResponse.json(
      {
        success: true,
        metrics: {
          revenue,
          leads: totalLeads,
          billed,
          avgRevenuePerLead,
          billedRate,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}