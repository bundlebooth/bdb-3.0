const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

function getTransporter() {
  if (transporter) return transporter;
  transporter = createTransporter();
  return transporter;
}

async function sendEmail({ to, subject, text, html, from }) {
  const t = getTransporter();
  if (!t) {
    console.log('Email not configured; would send:', { to, subject, text });
    return;
  }
  const fromAddr = from || process.env.SMTP_FROM || 'no-reply@venuevue.app';
  await t.sendMail({ from: fromAddr, to, subject, text, html });
}

async function sendTwoFactorCode(email, code) {
  const subject = 'Your verification code';
  const text = `Your verification code is ${code}. It expires in 10 minutes.`;
  const html = `<p>Your verification code is <b>${code}</b>. It expires in 10 minutes.</p>`;
  await sendEmail({ to: email, subject, text, html });
}

module.exports = { sendEmail, sendTwoFactorCode };
