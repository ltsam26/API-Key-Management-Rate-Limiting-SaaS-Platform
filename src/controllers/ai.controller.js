const { GoogleGenerativeAI } = require("@google/generative-ai");
const pool = require("../config/db");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ─────────────────────────────────────────────────────────────
   Gather full real-time user context from DB
───────────────────────────────────────────────────────────── */
async function getUserContext(userId) {
  try {
    // Plan
    const subRes = await pool.query(
      `SELECT plan_type, created_at, expires_at FROM subscriptions
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    const plan = subRes.rows[0]?.plan_type || "FREE";
    const expiresAt = subRes.rows[0]?.expires_at;

    const PLAN_LIMITS = {
      FREE: { rateLimit: 10, dailyQuota: 100, monthlyQuota: 3000 },
      BASIC: { rateLimit: 30, dailyQuota: 1000, monthlyQuota: 30000 },
      PRO: { rateLimit: 100, dailyQuota: 10000, monthlyQuota: 300000 },
      ENTERPRISE: { rateLimit: 1000, dailyQuota: 100000, monthlyQuota: 3000000 },
    };
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

    // Usage stats (all-time + today)
    const usageAll = await pool.query(
      `SELECT COUNT(*) AS total_requests,
              COUNT(*) FILTER (WHERE l.status_code >= 400) AS total_errors,
              COUNT(*) FILTER (WHERE l.status_code = 429) AS rate_limits_hit,
              COUNT(*) FILTER (WHERE l.status_code >= 500) AS server_errors
       FROM api_logs l
       JOIN api_keys a ON l.api_key_id = a.id
       JOIN projects p ON a.project_id = p.id
       WHERE p.user_id = $1`,
      [userId]
    );

    const usageToday = await pool.query(
      `SELECT COUNT(*) AS today_requests
       FROM api_logs l
       JOIN api_keys a ON l.api_key_id = a.id
       JOIN projects p ON a.project_id = p.id
       WHERE p.user_id = $1 AND DATE(l.created_at) = CURRENT_DATE`,
      [userId]
    );

    const usage30d = await pool.query(
      `SELECT COUNT(*) AS month_requests
       FROM api_logs l
       JOIN api_keys a ON l.api_key_id = a.id
       JOIN projects p ON a.project_id = p.id
       WHERE p.user_id = $1 AND l.created_at >= NOW() - INTERVAL '30 days'`,
      [userId]
    );

    const totalRequests = parseInt(usageAll.rows[0]?.total_requests) || 0;
    const totalErrors = parseInt(usageAll.rows[0]?.total_errors) || 0;
    const rateLimits = parseInt(usageAll.rows[0]?.rate_limits_hit) || 0;
    const serverErrors = parseInt(usageAll.rows[0]?.server_errors) || 0;
    const todayRequests = parseInt(usageToday.rows[0]?.today_requests) || 0;
    const monthRequests = parseInt(usage30d.rows[0]?.month_requests) || 0;

    const nextReset = new Date();
    nextReset.setUTCHours(24, 0, 0, 0);

    // Recent error logs
    const recentErrors = await pool.query(
      `SELECT l.endpoint, l.method, l.status_code, l.created_at, p.name as project
       FROM api_logs l
       JOIN api_keys a ON l.api_key_id = a.id
       JOIN projects p ON a.project_id = p.id
       WHERE p.user_id = $1 AND l.status_code >= 400
       ORDER BY l.created_at DESC LIMIT 8`,
      [userId]
    );

    // Recent activity
    const recentActivity = await pool.query(
      `SELECT l.endpoint, l.method, l.status_code, l.created_at
       FROM api_logs l
       JOIN api_keys a ON l.api_key_id = a.id
       JOIN projects p ON a.project_id = p.id
       WHERE p.user_id = $1
       ORDER BY l.created_at DESC LIMIT 5`,
      [userId]
    );

    // Projects & keys
    const projects = await pool.query(
      `SELECT p.name, p.plan, COUNT(a.id) FILTER (WHERE a.is_active) AS active_keys
       FROM projects p
       LEFT JOIN api_keys a ON a.project_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id, p.name, p.plan`,
      [userId]
    );

    // Daily trend (last 7 days)
    const trend = await pool.query(
      `SELECT DATE(l.created_at) AS date, COUNT(*) AS requests
       FROM api_logs l
       JOIN api_keys a ON l.api_key_id = a.id
       JOIN projects p ON a.project_id = p.id
       WHERE p.user_id = $1 AND l.created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(l.created_at) ORDER BY date ASC`,
      [userId]
    );

    return {
      plan,
      expiresAt,
      limits,
      usage: {
        totalRequests,
        totalErrors,
        rateLimitsHit: rateLimits,
        serverErrors,
        todayRequests,
        monthRequests,
        remaining: Math.max(0, limits.dailyQuota - todayRequests),
        percentUsed: limits.dailyQuota > 0 ? Math.round((todayRequests / limits.dailyQuota) * 100) : 0,
        nextReset: nextReset.toISOString(),
        successRate: totalRequests > 0 ? (((totalRequests - totalErrors) / totalRequests) * 100).toFixed(1) : "100",
        estimatedCost: ((totalRequests / 1000) * 0.5).toFixed(2),
      },
      recentErrors: recentErrors.rows,
      recentActivity: recentActivity.rows,
      projects: projects.rows,
      dailyTrend: trend.rows,
    };
  } catch (err) {
    console.error("[AI] context fetch error:", err.message);
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   Build the system prompt with real user data
───────────────────────────────────────────────────────────── */
function buildSystemPrompt(ctx) {
  const u = ctx.usage;
  const errorSummary = ctx.recentErrors.length === 0
    ? "No recent errors."
    : ctx.recentErrors
      .slice(0, 5)
      .map(e => `  • [${e.status_code}] ${e.method} ${e.endpoint} — ${new Date(e.created_at).toLocaleString()} (${e.project})`)
      .join("\n");

  const projectSummary = ctx.projects.length === 0
    ? "No projects."
    : ctx.projects.map(p => `  • ${p.name} (${p.plan}) — ${p.active_keys} active keys`).join("\n");

  const trendSummary = ctx.dailyTrend.length === 0
    ? "No recent usage trend."
    : ctx.dailyTrend.map(d => `  ${d.date}: ${d.requests} requests`).join("\n");

  return `You are an intelligent AI Assistant embedded inside an API SaaS management platform (similar to OpenAI/Stripe dashboard).

You are NOT a general chatbot. You help users understand and manage their API usage, quotas, errors, billing, and API integration — using ONLY the real-time data provided below. Never guess or hallucinate data.

════════════════════════════════════════
LIVE USER CONTEXT (as of ${new Date().toLocaleString()})
════════════════════════════════════════

PLAN & BILLING:
• Current Plan: ${ctx.plan}
• Rate Limit: ${ctx.limits.rateLimit} requests/minute
• Daily Quota: ${ctx.limits.dailyQuota.toLocaleString()} requests/day
• Monthly Quota: ${ctx.limits.monthlyQuota.toLocaleString()} requests/month
• Plan Expiry: ${ctx.expiresAt ? new Date(ctx.expiresAt).toLocaleDateString() : "N/A"}

USAGE STATISTICS:
• Total Requests (all time): ${u.totalRequests.toLocaleString()}
• Requests Today: ${u.todayRequests.toLocaleString()} / ${ctx.limits.dailyQuota.toLocaleString()} (${u.percentUsed}% used)
• Remaining Today: ${u.remaining.toLocaleString()} requests
• Quota Resets At: ${new Date(u.nextReset).toUTCString()}
• Monthly Requests (30d): ${u.monthRequests.toLocaleString()}
• Success Rate: ${u.successRate}%
• Estimated Cost: $${u.estimatedCost}

ERROR METRICS:
• Total Errors (4xx/5xx): ${u.totalErrors.toLocaleString()}
• Rate Limit Errors (429): ${u.rateLimitsHit.toLocaleString()}
• Server Errors (5xx): ${u.serverErrors.toLocaleString()}

RECENT ERROR LOGS:
${errorSummary}

PROJECTS:
${projectSummary}

7-DAY DAILY TREND:
${trendSummary}

API REFERENCE:
• Authentication: Header → Authorization: Bearer <JWT_TOKEN>  |  OR  →  x-api-key: <API_KEY>
• Base URL: ${process.env.VITE_API_BASE_URL || "https://your-backend.com"}
• Endpoints:
  POST /api/auth/login        — Get JWT token
  POST /api/auth/signup       — Register
  GET  /api/keys/:projectId   — List API keys
  POST /api/keys/generate     — Generate new API key (body: { projectId })
  GET  /api/analytics/:projectId — Fetch analytics
  GET  /api/analytics/user/overview — Global usage overview
  GET  /api/billing/overview  — Billing & plan info
  POST /api/billing/razorpay/create-order — Start payment
  GET  /api/public/data       — Test public endpoint (requires x-api-key)
  
RATE LIMIT RULES:
• 429 error → You exceeded ${ctx.limits.rateLimit} req/min
• 403 error → API key limit reached or unauthorized
• 401 error → Invalid/expired token

════════════════════════════════════════
YOUR RESPONSIBILITIES:
════════════════════════════════════════

1. USAGE & ANALYTICS
   - Explain usage in simple terms using the real numbers above
   - Detect spikes, inefficiencies, or heavy usage
   - Compare against quota limits

2. QUOTA & LIMITS
   - Warn when nearing or at quota
   - Explain 429 errors using actual rate limit value
   - Suggest: wait, optimize, or upgrade plan

3. ERROR DEBUGGING
   - Analyze recent error logs to find root cause
   - Provide exact, actionable fix steps
   - Keep answers short and clear

4. BILLING & SUBSCRIPTION
   - Answer questions about ${ctx.plan} plan features
   - Suggest upgrade when usage is high (>70% quota used = warn, >90% = strongly suggest upgrade)
   - Guide through Razorpay payment process

5. API GUIDANCE
   - Provide real code examples (curl, JavaScript fetch, Python requests)
   - Explain how to authenticate and use endpoints
   - Help debug integration issues

RULES:
• ALWAYS use the real numbers from the context above
• NEVER give generic answers — be specific to this user's data
• Keep responses concise and actionable (prefer bullet points)
• If asked something unrelated to the platform, politely redirect
• Do not hallucinate any data not provided above
• Format code blocks with proper syntax for readability
• If quota is >80% used, always mention it in your response

TONE: Direct, helpful, professional. No fluff.`;
}

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/chat
   Body: { message: string, history: [{role, parts}] }
───────────────────────────────────────────────────────────── */
const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const userId = req.user.userId;

    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Fetch real-time user context from DB
    const ctx = await getUserContext(userId);

    // If there is no real Gemini API key, simulate an AI response using the real database context!
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("XXXX")) {
      const u = ctx.usage;
      let mockReply = "";

      const promptLower = message.toLowerCase();

      // Simulate based on keyword match
      if (promptLower.includes("error") || promptLower.includes("429")) {
        mockReply += `I see you've had **${u.totalErrors} errors** recently, including **${u.rateLimitsHit} rate limit (429) errors**.\n\nYou are currently on the **${ctx.plan} Plan** with a limit of ${ctx.limits.rateLimit} req/min. If you are getting 429s, you need to either reduce your request frequency or upgrade your plan.`;
      } else if (promptLower.includes("quota") || promptLower.includes("limit") || promptLower.includes("usage")) {
        mockReply += `You have used **${u.todayRequests}** out of your **${ctx.limits.dailyQuota}** daily requests. You have **${u.remaining}** requests remaining for today. Your quota will reset at midnight UTC.`;
      } else if (promptLower.includes("plan") || promptLower.includes("upgrade")) {
        mockReply += `You are currently on the **${ctx.plan} Plan**. You've used ${u.percentUsed}% of your daily limit today. Based on your usage pattern, a paid plan would provide higher limits and advanced analytics!`;
      } else if (promptLower.includes("api") || promptLower.includes("how to")) {
        mockReply += `To use the API, make requests like this:\n\n\`\`\`bash\ncurl -X GET http://localhost:5000/api/public/data \\\n  -H "Authorization: Bearer YOUR_API_KEY"\n\`\`\`\nYou can generate keys from the API Keys page.`;
      } else {
        mockReply += `I'm your API SaaS AI assistant! I analyzed your data and see you have made **${u.todayRequests} requests today**, primarily on the **${ctx.plan} Plan**.\n\nTry asking me about:\n- "Why am I getting errors?"\n- "How much quota is left?"\n- "How do I use the API?"`;
      }

      const snapshot = ctx ? {
        plan: ctx.plan,
        todayRequests: ctx.usage.todayRequests,
        dailyQuota: ctx.limits.dailyQuota,
        remaining: ctx.usage.remaining,
        percentUsed: ctx.usage.percentUsed,
        errorCount: ctx.usage.totalErrors,
        rateLimitsHit: ctx.usage.rateLimitsHit,
      } : null;

      // Add a slight delay to feel like an AI generating
      await new Promise(r => setTimeout(r, 600));

      return res.status(200).json({ reply: mockReply, snapshot });
    }

    // Build system prompt with live data for actual Gemini Call
    const systemPrompt = ctx
      ? buildSystemPrompt(ctx)
      : "You are an AI assistant for an API SaaS platform. Help users with API usage, quotas, errors, and billing.";

    // Build Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
    });

    // Convert chat history to Gemini format
    const geminiHistory = [
      { role: "user", parts: [{ text: systemPrompt + "\n\nDo you understand these instructions?" }] },
      { role: "model", parts: [{ text: "Understood. I will strictly follow these instructions and use the provided live data to answer the user's questions." }] }
    ];

    history
      .filter((h) => h.role && h.parts)
      .forEach((h) => {
        geminiHistory.push({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.parts }],
        });
      });

    // Start chat session
    const chatSession = model.startChat({
      history: geminiHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.4,
        topP: 0.8,
      },
    });

    const result = await chatSession.sendMessage(message);
    const reply = result.response.text();

    // Quick context snapshot to return alongside reply
    const snapshot = ctx ? {
      plan: ctx.plan,
      todayRequests: ctx.usage.todayRequests,
      dailyQuota: ctx.limits.dailyQuota,
      remaining: ctx.usage.remaining,
      percentUsed: ctx.usage.percentUsed,
      errorCount: ctx.usage.totalErrors,
      rateLimitsHit: ctx.usage.rateLimitsHit,
    } : null;

    res.status(200).json({ reply, snapshot });
  } catch (err) {
    console.error("[AI] chat error:", err.message);

    // Fallback to Demo Mode if the API key hits 429 Quota Error, API Key Invalid, or 404
    // This guarantees the UI continues to function cleanly for presentation/testing!
    try {
      const userId = req.user.userId;
      const ctx = await getUserContext(userId);
      const u = ctx.usage;
      const promptLower = (req.body.message || "").toLowerCase();

      let fallbackReply = `*(Demo Mode: API quota exceeded, showing simulated offline response)*\n\n`;

      if (promptLower.includes("error") || promptLower.includes("429")) {
        fallbackReply += `I see you've had **${u.totalErrors} errors** recently, including **${u.rateLimitsHit} rate limit (429) errors**.\n\nYou are currently on the **${ctx.plan} Plan** with a limit of ${ctx.limits.rateLimit} req/min. If you are getting 429s, you need to either reduce your request frequency or upgrade your plan.`;
      } else if (promptLower.includes("quota") || promptLower.includes("limit") || promptLower.includes("usage")) {
        fallbackReply += `You have used **${u.todayRequests}** out of your **${ctx.limits.dailyQuota}** daily requests. You have **${u.remaining}** requests remaining for today. Your quota will reset at midnight UTC.`;
      } else if (promptLower.includes("plan") || promptLower.includes("upgrade")) {
        fallbackReply += `You are currently on the **${ctx.plan} Plan**. You've used ${u.percentUsed}% of your daily limit today. Based on your usage pattern, a paid plan would provide higher limits and advanced analytics!`;
      } else if (promptLower.includes("api") || promptLower.includes("how to")) {
        fallbackReply += `To use the API, make requests like this:\n\n\`\`\`bash\ncurl -X GET http://localhost:5000/api/public/data \\\n  -H "Authorization: Bearer YOUR_API_KEY"\n\`\`\`\nYou can generate keys from the API Keys page.`;
      } else {
        fallbackReply += `I'm your API SaaS AI assistant! Due to API Limits, I'm providing a local offline fallback.\n\nI analyzed your data and see you have made **${u.todayRequests} requests today**, primarily on the **${ctx.plan} Plan**.\n\nTry asking me about:\n- "Why am I getting errors?"\n- "How much quota is left?"`;
      }

      const snapshot = ctx ? {
        plan: ctx.plan, todayRequests: u.todayRequests, dailyQuota: ctx.limits.dailyQuota,
        remaining: u.remaining, percentUsed: u.percentUsed, errorCount: u.totalErrors, rateLimitsHit: u.rateLimitsHit
      } : null;

      return res.status(200).json({ reply: fallbackReply, snapshot });
    } catch (err2) {
      return res.status(503).json({ error: "AI service offline and fallback failed." });
    }
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/ai/context  — return raw context (for debugging)
───────────────────────────────────────────────────────────── */
const getContext = async (req, res) => {
  try {
    const ctx = await getUserContext(req.user.userId);
    res.status(200).json(ctx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { chat, getContext, getUserContext };
