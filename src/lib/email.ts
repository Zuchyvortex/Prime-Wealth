import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Prime Wealth Support" <support@primewealth.com>';

  console.log(`[Email Notification]
To: ${to}
Subject: ${subject}
Content: ${html.replace(/<[^>]*>/g, " ").trim()}
  `);

  if (!host || !user || !pass) {
    console.log("[Email Notification] SMTP credentials not fully configured. Email was logged instead of sent.");
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`[Email Notification] Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email Notification] Error sending email:", error);
    return { success: false, error };
  }
}
