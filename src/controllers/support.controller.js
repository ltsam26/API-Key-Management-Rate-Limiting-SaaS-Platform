const { Resend } = require("resend");
const pool = require("../config/db");
const { getUserContext } = require("./ai.controller");

// Initialize Resend with API Key
const submitSupportTicket = async (req, res) => {
  const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");
  try {
    const { issueType, message, includeLogs } = req.body;
    const userId = req.user.userId;

    if (!issueType || !message) {
      return res.status(400).json({ message: "Issue type and message are required" });
    }

    // 1. Fetch User Diagnostic Context
    let diagnosticData = null;
    if (includeLogs) {
      diagnosticData = await getUserContext(userId);
    }

    // 2. Fetch User Details
    const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Construct Email Content
    const logsText = diagnosticData ? `
Diagnostic Data:
----------------
Plan: ${diagnosticData.plan}
Daily Usage: ${diagnosticData.usage.todayRequests} / ${diagnosticData.limits.dailyQuota}
Total Errors: ${diagnosticData.usage.totalErrors}
Rate Limits Hit: ${diagnosticData.usage.rateLimitsHit}
Recent Errors: 
${diagnosticData.recentErrors.map(e => ` - [${e.status_code}] ${e.method} ${e.endpoint}`).join('\n')}
    ` : 'No diagnostic logs attached.';

    const emailHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #7c6fcd; border-bottom: 2px solid #7c6fcd; padding-bottom: 10px;">
          New Support Ticket: ${issueType}
        </h2>
        <p><strong>From:</strong> ${user.email} (<a href="mailto:${user.email}">${user.email}</a>)</p>
        <p><strong>User ID:</strong> <code style="background: #f4f4f4; padding: 2px 5px;">${userId}</code></p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 16px;">User Message:</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </div>

        ${diagnosticData ? `
          <div style="background: #fff8f8; border: 1px solid #ffebeb; padding: 15px; border-radius: 8px;">
            <h3 style="margin-top: 0; font-size: 16px; color: #d32f2f;">🛠 Diagnostic Snapshot:</h3>
            <pre style="font-size: 12px; color: #555; overflow-x: auto;">
Plan: ${diagnosticData.plan}
Usage: ${diagnosticData.usage.todayRequests} / ${diagnosticData.limits.dailyQuota} requests today
Errors: ${diagnosticData.usage.totalErrors} total | ${diagnosticData.usage.rateLimitsHit} rate limits hit
            </pre>
            <p style="font-size: 11px; color: #888;">Recent errors automatically attached via SaaS Diagnostic Engine.</p>
          </div>
        ` : ''}

        <p style="font-size: 12px; color: #aaa; margin-top: 30px; border-top: 1px solid #eee; pt-10px;">
          Sent via API Platform Support System
        </p>
      </div>
    `;

    // 4. Send via Resend API
    let emailStatus = "simulated";
    
    // Check if key is valid (resend keys start with re_)
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_") && !process.env.RESEND_API_KEY.includes("mock")) {
      const { data, error } = await resend.emails.send({
        from: 'SaaS Support <onboarding@resend.dev>', // If domain not verified, must use this
        to: process.env.SUPPORT_EMAIL || 'onboarding@resend.dev',
        subject: `[Support Ticket] ${issueType} - ${user.email}`,
        html: emailHtml,
      });

      if (error) {
        throw new Error(error.message);
      }
      emailStatus = "sent";
    } else {
      console.log("=== RESEND SIMULATION (No valid API Key) ===");
      console.log(`To: ${process.env.SUPPORT_EMAIL}`);
      console.log(`Subject: [Support Ticket] ${issueType}`);
      console.log(emailHtml);
      console.log("=============================================");
    }

    res.status(200).json({
      message: "Support ticket submitted successfully!",
      status: emailStatus,
      ticketId: `TIC-${Date.now().toString().slice(-6)}`
    });

  } catch (error) {
    console.error("Resend error:", error);
    res.status(500).json({ 
      message: "Failed to send support ticket", 
      error: error.message,
      stack: error.stack 
    });
  }
};

module.exports = {
  submitSupportTicket,
};
