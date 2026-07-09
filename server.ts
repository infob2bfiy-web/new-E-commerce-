import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse incoming JSON payloads
app.use(express.json());

// API: Send email notification on new customer order
app.post("/api/notify-order", async (req, res) => {
  try {
    const { order, adminEmail } = req.body;

    if (!order) {
      return res.status(400).json({ success: false, error: "Order data is required" });
    }

    // --- WHATSAPP NOTIFICATION ENGINE ---
    // Target admin phone number is "01615469679"
    const rawAdminPhone = "01615469679";
    const cleanDigits = rawAdminPhone.replace(/[^0-9]/g, "");
    let waFormattedNumber = cleanDigits;
    if (cleanDigits.startsWith("01")) {
      waFormattedNumber = "88" + cleanDigits;
    } else if (cleanDigits.startsWith("1")) {
      waFormattedNumber = "880" + cleanDigits;
    }

    const waApiKey = process.env.CALLMEBOT_API_KEY; // Free key requested from CallMeBot
    const waMessage = `🔔 নতুন অর্ডার এসেছে!\n\n🔹 অর্ডার আইডি: ${order.orderId}\n🔹 কাস্টমার: ${order.customerName}\n🔹 মোবাইল: ${order.customerPhone}\n🔹 ঠিকানা: ${order.address}, ${order.area}, ${order.district}\n\n💵 মোট বিল: ৳${order.totalPrice}\n\nদয়া করে এডমিন প্যানেলে লগইন করে অর্ডারটি কনফার্ম করুন।`;

    if (waApiKey) {
      const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(waFormattedNumber)}&text=${encodeURIComponent(waMessage)}&apikey=${encodeURIComponent(waApiKey)}`;
      fetch(waUrl)
        .then(waRes => waRes.text())
        .then(body => console.log(`[WhatsApp Notifier] CallMeBot API response: ${body}`))
        .catch(err => console.error("[WhatsApp Notifier] CallMeBot request failed:", err));
    } else {
      console.log(`==================== WHATSAPP NOTIFICATION SIMULATED ====================
To WhatsApp: +${waFormattedNumber}
Message:
${waMessage}
----------------------------------------------------------------------
Note: To make this live, set the CALLMEBOT_API_KEY secret in your server environment.
======================================================================`);
    }

    const targetEmail = adminEmail || process.env.SMTP_USER || "info.b2bfiy@gmail.com";
    
    console.log(`[Order Notifier] Attempting to send order notification for ID ${order.orderId} to: ${targetEmail}`);

    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Build elegant HTML email template
    const itemsHtml = (order.items || [])
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">
            <div style="font-weight: bold; color: #333;">${item.name}</div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center; font-weight: bold;">${item.qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: bold; color: #16a34a;">৳${item.discountPrice || item.price}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: bold; color: #16a34a;">৳${(item.discountPrice || item.price) * item.qty}</td>
        </tr>
      `
      )
      .join("");

    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background-color: #ffffff;">
        <div style="background-color: #10b981; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">🌿 নতুন অর্ডার নোটিফিকেশন</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Green Grocery - Order Received Notification</p>
        </div>
        
        <div style="padding: 24px; text-align: left;">
          <div style="background-color: #f8fafc; border-left: 4px solid #f97316; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 16px; font-weight: 700;">অর্ডার আইডি: <span style="font-family: monospace; color: #f97316;">${order.orderId}</span></h3>
            <p style="margin: 0; font-size: 13px; color: #64748b;">তারিখ: ${order.date || new Date().toLocaleDateString('bn-BD')}</p>
          </div>

          <h4 style="margin: 0 0 12px 0; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">গ্রাহকের তথ্য (Customer Details)</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 120px;">নাম:</td>
              <td style="padding: 6px 0; color: #334155; font-weight: bold;">${order.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">মোবাইল নম্বর:</td>
              <td style="padding: 6px 0; color: #334155; font-weight: bold;">${order.customerPhone}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">ইমেইল:</td>
              <td style="padding: 6px 0; color: #334155;">${order.customerEmail || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">ঠিকানা:</td>
              <td style="padding: 6px 0; color: #334155; line-height: 1.4;">${order.address}, ${order.area}, ${order.district}, ${order.division}</td>
            </tr>
            ${order.note ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">অর্ডার নোট:</td>
              <td style="padding: 6px 0; color: #e11d48; font-style: italic;">${order.note}</td>
            </tr>
            ` : ""}
          </table>

          <h4 style="margin: 0 0 12px 0; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">অর্ডার আইটেম (Ordered Items)</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <thead>
              <tr style="background-color: #f8fafc; color: #475569;">
                <th style="padding: 10px; text-align: left; font-weight: bold;">পণ্য</th>
                <th style="padding: 10px; text-align: center; font-weight: bold; width: 50px;">পরিমাণ</th>
                <th style="padding: 10px; text-align: right; font-weight: bold; width: 80px;">একক মূল্য</th>
                <th style="padding: 10px; text-align: right; font-weight: bold; width: 100px;">মোট মূল্য</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-top: 16px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">উপমোট (Subtotal):</td>
                <td style="padding: 6px 0; text-align: right; color: #334155; font-weight: 700;">৳${order.subtotal}</td>
              </tr>
              ${order.discount > 0 ? `
              <tr>
                <td style="padding: 6px 0; color: #e11d48;">কুপন ডিসকাউন্ট (Discount):</td>
                <td style="padding: 6px 0; text-align: right; color: #e11d48; font-weight: 700;">-৳${order.discount}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 6px 0; color: #64748b;">ডেলিভারি চার্জ (Delivery):</td>
                <td style="padding: 6px 0; text-align: right; color: #334155; font-weight: 700;">৳${order.deliveryFee}</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 12px 0 0 0; color: #1e293b; font-size: 15px; font-weight: 800;">সর্বমোট বিল (Total Payable):</td>
                <td style="padding: 12px 0 0 0; text-align: right; color: #10b981; font-size: 18px; font-weight: 900;">৳${order.totalPrice}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b;">
          <p style="margin: 0 0 4px 0;">This is an automated order notification from your Green Grocery application.</p>
          <p style="margin: 0;">Please log in to your <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin/index.html" style="color: #10b981; text-decoration: none; font-weight: bold;">Admin Panel</a> to manage this order.</p>
        </div>
      </div>
    `;

    // If SMTP secrets are configured, send real email. Otherwise fallback to clean console logger.
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"Green Grocery Order System" <${smtpUser}>`,
        to: targetEmail,
        subject: `🔔 নতুন অর্ডার নোটিফিকেশন [${order.orderId}] - ৳${order.totalPrice}`,
        html: emailHtml,
      });

      console.log(`[Order Notifier] Real email sent successfully to ${targetEmail}`);
      return res.json({ success: true, method: "smtp", message: `Notification sent to ${targetEmail} via SMTP successfully.` });
    } else {
      console.warn("[Order Notifier WARNING] SMTP credentials not set up. Falling back to console log preview of the email notification.");
      console.log(`==================== EMAIL NOTIFICATION SIMULATED ====================
To: ${targetEmail}
Subject: 🔔 নতুন অর্ডার নোটিফিকেশন [${order.orderId}] - ৳${order.totalPrice}
Content:
----------------------------------------------------------------------
Customer Name: ${order.customerName}
Customer Phone: ${order.customerPhone}
Total Order Price: ৳${order.totalPrice}
======================================================================`);
      return res.json({
        success: true,
        method: "simulated",
        message: "SMTP credentials are empty. Notification logged to container console successfully.",
        note: "To send real emails, please set SMTP_USER and SMTP_PASS variables under Settings > Secrets in the AI Studio sidebar."
      });
    }

  } catch (error: any) {
    console.error("[Order Notifier ERROR] Failed to send email notification:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve static assets & build index pathways
const isProd = process.env.NODE_ENV === "production";

if (!isProd) {
  // Integrate Vite middleware in development mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
  console.log("[Dev Server] Vite middleware loaded successfully on port 3000.");
} else {
  // Serve static files from the dist/ folder in production mode
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  // Custom router fallback for Multi-Page App (MPA) in static production
  app.get("*", (req, res, next) => {
    // If requesting static assets, bypass
    if (req.path.includes(".")) {
      return next();
    }
    
    // Resolve page path dynamically
    let pagePath = req.path;
    if (pagePath === "/" || pagePath === "") {
      pagePath = "/index.html";
    } else if (!pagePath.endsWith(".html")) {
      pagePath += ".html";
    }

    const resolvedFile = path.join(distPath, pagePath);
    res.sendFile(resolvedFile, (err) => {
      if (err) {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
