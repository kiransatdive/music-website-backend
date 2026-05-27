import nodemailer from "nodemailer";

export type OtpEmailPurpose = "email verification" | "password reset";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to send OTP email`);
  }

  return value;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: getRequiredEnv("SMTP_EMAIL"),
      pass: getRequiredEnv("SMTP_PASSWORD"),
    },
  });
}

export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: OtpEmailPurpose,
) {
  const fromEmail = getRequiredEnv("SMTP_EMAIL");
  const transporter = createTransporter();
  const subject =
    purpose === "password reset"
      ? "Your password reset OTP"
      : "Your email verification OTP";

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? `"Music Backend" <${fromEmail}>`,
    to,
    subject,
    text: `Your OTP for ${purpose} is ${otp}. This code is valid for a limited time.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2>${subject}</h2>
        <p>Use the OTP below to complete your ${purpose}.</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendStatusChangeEmail(
  to: string,
  releaseTitle: string,
  newStatus: string,
  reason?: string,
) {
  const fromEmail = getRequiredEnv("SMTP_EMAIL");
  const transporter = createTransporter();
  const subject = `Update on your release: ${releaseTitle}`;

  let statusMessage = `The status of your release "<strong>${releaseTitle}</strong>" has been updated to: <strong>${newStatus}</strong>.`;
  let reasonMessage = reason ? `<p><strong>Reason:</strong> ${reason}</p>` : "";

  if (newStatus === "rejected") {
    statusMessage = `Unfortunately, your release "<strong>${releaseTitle}</strong>" has been <strong>rejected</strong>.`;
  } else if (newStatus === "live") {
    statusMessage = `Great news! Your release "<strong>${releaseTitle}</strong>" is now distributed and <strong>live on platforms</strong>.`;
  } else if (newStatus === "taken_down") {
    statusMessage = `Your release "<strong>${releaseTitle}</strong>" has been <strong>taken down</strong>.`;
  } else if (newStatus === "approved") {
    statusMessage = `Your release "<strong>${releaseTitle}</strong>" has been <strong>approved</strong> and will be distributed shortly.`;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? `"Music Backend" <${fromEmail}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2>Release Status Update</h2>
        <p>${statusMessage}</p>
        ${reasonMessage}
        <p>If you have any questions, please contact support.</p>
      </div>
    `,
  });
}

export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
) {
  const fromEmail = getRequiredEnv("SMTP_EMAIL");
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? `"Music Backend" <${fromEmail}>`,
    to,
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <h2>${title}</h2>
        <p>${message}</p>
        <br />
        <p style="font-size: 14px; color: #6b7280;">This is an automated notification from Music Backend.</p>
      </div>
    `,
  });
}
