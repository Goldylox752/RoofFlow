<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>RoofFlow - Success</title>

  <style>
    :root {
      --bg: #0b1220;
      --card: #111827;
      --text: #e5e7eb;
      --muted: #94a3b8;
      --accent: #22c55e;
      --accent-hover: #16a34a;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }

    .card {
      width: 100%;
      max-width: 520px;
      background: var(--card);
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }

    .badge {
      display: inline-block;
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(34, 197, 94, 0.1);
      color: var(--accent);
      margin-bottom: 16px;
    }

    h1 {
      margin: 0 0 10px;
      font-size: 28px;
      color: var(--accent);
    }

    p {
      margin: 10px 0;
      color: var(--muted);
      line-height: 1.6;
      font-size: 15px;
    }

    .icon {
      font-size: 42px;
      margin-bottom: 10px;
    }

    .cta {
      display: inline-block;
      margin-top: 22px;
      padding: 12px 18px;
      border-radius: 10px;
      background: var(--accent);
      color: #000;
      font-weight: 700;
      text-decoration: none;
      transition: 0.2s ease;
    }

    .cta:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
    }

    .footer {
      margin-top: 18px;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>

<body>

  <div class="card">

    <div class="badge">Payment Confirmed</div>

    <div class="icon">🎉</div>

    <h1>You're All Set</h1>

    <p>
      Welcome to RoofFlow.<br/>
      Your payment was successful and your system is now being activated.
    </p>

    <p>
      You’ll receive login details and onboarding instructions via email shortly.
      Everything is being configured automatically.
    </p>

    <a class="cta" href="/dashboard">Go to Dashboard</a>

    <div class="footer">
      If you don’t see your email within 5 minutes, check spam or contact support.
    </div>

  </div>

</body>
</html>