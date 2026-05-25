<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>Sanche Solutions | Byron Sanche — Full Stack Developer & AI Automation</title>

<meta name="description" content="Byron Sanche builds high-performance websites, AI lead systems, CRM automations, REST APIs, cloud deployments, and networking infrastructure for modern businesses. Based in Edmonton, Alberta, Canada." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://sanchesolutions.com/" />

<!-- OPEN GRAPH -->
<meta property="og:type" content="website" />
<meta property="og:title" content="Sanche Solutions | AI Automation & Web Development" />
<meta property="og:description" content="AI systems, automation, and full stack development." />

<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">

<style>
/* =========================
   BASE
========================= */
*{margin:0;padding:0;box-sizing:border-box;}
:root{
  --bg:#04060f;
  --surface:#080d1a;
  --surface2:#0c1422;
  --border:rgba(255,255,255,.06);
  --text:#eef2ff;
  --muted:#94a3b8;
  --accent:#63b3ed;
  --accent2:#7c6af7;
}

body{
  background:var(--bg);
  color:var(--text);
  font-family:'DM Sans',sans-serif;
  overflow-x:hidden;
}

/* =========================
   BOT FAB
========================= */
.ai-fab{
  position:fixed;
  bottom:24px;
  right:24px;
  width:58px;
  height:58px;
  border-radius:50%;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:22px;
  cursor:pointer;
  z-index:99999;
  box-shadow:0 10px 30px rgba(0,0,0,.4);
}

/* =========================
   BOT PANEL
========================= */
.ai-panel{
  position:fixed;
  bottom:92px;
  right:24px;
  width:360px;
  height:480px;
  background:linear-gradient(160deg,var(--surface),var(--surface2));
  border:1px solid var(--border);
  border-radius:18px;
  display:none;
  flex-direction:column;
  z-index:99999;
  overflow:hidden;
}

.ai-header{
  padding:14px;
  display:flex;
  justify-content:space-between;
  border-bottom:1px solid var(--border);
}

.ai-title{
  font-family:'Syne',sans-serif;
  font-weight:700;
  font-size:14px;
}

.ai-sub{
  font-size:11px;
  color:var(--muted);
}

#ai-close{cursor:pointer;color:var(--muted);}

.ai-messages{
  flex:1;
  padding:14px;
  overflow-y:auto;
  font-size:13px;
}

.ai-msg{
  margin-bottom:10px;
  padding:10px 12px;
  border-radius:10px;
  white-space:pre-wrap;
  max-width:85%;
}

.ai-user{
  background:rgba(255,255,255,.05);
  margin-left:auto;
  border:1px solid var(--border);
}

.ai-bot{
  background:rgba(99,179,237,.08);
  border:1px solid rgba(99,179,237,.2);
}

.ai-input{
  display:flex;
  border-top:1px solid var(--border);
}

.ai-input input{
  flex:1;
  padding:12px;
  background:transparent;
  border:none;
  color:white;
  outline:none;
}

.ai-input button{
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  border:none;
  padding:0 16px;
  cursor:pointer;
  font-weight:600;
}

/* =========================
   YOUR ORIGINAL STYLES (SHORTENED KEEP PLACEHOLDER)
========================= */
/* (KEEP YOUR FULL ORIGINAL CSS HERE — NOT REMOVED) */

</style>
</head>

<body>

<!-- =========================
   YOUR FULL ORIGINAL PAGE CONTENT
   (UNCHANGED - HERO, PROJECTS, ETC)
========================= -->

<!-- NAV / HERO / PROJECTS / SKILLS / CTA -->
<!-- KEEP ALL YOUR EXISTING HTML EXACTLY AS IS -->

<!-- =========================
   AI BOT UI
========================= -->

<div class="ai-fab" id="ai-fab">💬</div>

<div class="ai-panel" id="ai-panel">
  <div class="ai-header">
    <div>
      <div class="ai-title">Sanche AI Assistant</div>
      <div class="ai-sub">Get quotes instantly</div>
    </div>
    <div id="ai-close">✕</div>
  </div>

  <div class="ai-messages" id="ai-messages"></div>

  <div class="ai-input">
    <input id="ai-input" placeholder="Tell me about your project..." />
    <button id="ai-send">Send</button>
  </div>
</div>

<!-- =========================
   BOT SCRIPT
========================= -->
<script>
const fab = document.getElementById("ai-fab");
const panel = document.getElementById("ai-panel");
const closeBtn = document.getElementById("ai-close");

const input = document.getElementById("ai-input");
const sendBtn = document.getElementById("ai-send");
const messages = document.getElementById("ai-messages");

function addMsg(text, type){
  const div = document.createElement("div");
  div.className = "ai-msg " + type;
  div.innerText = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

fab.onclick = () => {
  panel.style.display = "flex";

  if(messages.childElementCount === 0){
    addMsg(
`Hey 👋 I’m your AI assistant for Sanche Solutions.

I help with:
• Websites
• AI automation
• CRM systems
• Lead generation

What are you looking to build?`,
      "ai-bot"
    );
  }
};

closeBtn.onclick = () => {
  panel.style.display = "none";
};

async function send(){
  const text = input.value.trim();
  if(!text) return;

  addMsg(text,"ai-user");
  input.value="";

  try{
    const res = await fetch("/api/bot",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ message:text })
    });

    const data = await res.json();
    addMsg(data.reply,"ai-bot");

  }catch(e){
    addMsg("Error — try WhatsApp instead.","ai-bot");
  }
}

sendBtn.onclick = send;

input.addEventListener("keydown",(e)=>{
  if(e.key==="Enter") send();
});
</script>

</body>
</html>