app.get("/api/dashboard", async (req, res) => {
  const email = req.headers["x-user-email"];

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (!data) {
    return res.status(403).json({ error: "No access" });
  }

  if (data.plan !== "pro") {
    return res.status(403).json({ error: "Not pro" });
  }

  res.json({ ok: true });
});