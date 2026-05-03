import { CONFIG } from './config';
import { log } from './logger';
import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

if (CONFIG.EMAIL_NOTIFICATIONS && CONFIG.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: CONFIG.SMTP_HOST,
    port: CONFIG.SMTP_PORT,
    secure: false,
    auth: {
      user: CONFIG.SMTP_USER,
      pass: CONFIG.SMTP_PASS,
    },
  });
  log('info', 'Email transporter initialized');
}

export async function sendTelegramNotification(message: string) {
  if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
    log('debug', 'Telegram not configured, skipping notification');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', `Telegram API error: ${response.status}`, errorText);
      return;
    }

    log('info', '✅ Telegram notification sent');
  } catch (error) {
    log('error', 'Failed to send Telegram notification', error);
  }
}

export async function sendEmailNotification(subject: string, body: string) {
  if (!transporter || !CONFIG.EMAIL_TO) {
    log('debug', 'Email not configured, skipping notification');
    return;
  }

  try {
    await transporter.sendMail({
      from: CONFIG.SMTP_USER,
      to: CONFIG.EMAIL_TO,
      subject,
      text: body,
    });
    log('info', '✅ Email notification sent');
  } catch (error) {
    log('error', 'Failed to send email notification', error);
  }
}

export async function notifyStatusChange(
  url: string,
  oldStatus: string,
  newStatus: string,
  isBlocked: boolean = false
) {
  const timestamp = new Date().toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
  });

  if (isBlocked) {
    const intervalMin = Math.floor(CONFIG.POLL_INTERVAL_SECONDS / 60);
    const telegramMsg = `🚫 <b>Website ${newStatus}</b>\n\n` +
      `<b>URL:</b> ${url}\n` +
      `<b>Detected:</b> ${timestamp}\n\n` +
      `The monitoring service detected ${newStatus.toLowerCase()} status. ` +
      `Next alert in ${Math.floor(CONFIG.NOTIFICATION_COOLDOWN_SECONDS / 60)} minutes if issue persists.\n\n` +
      `Current config: ${intervalMin}min interval, ${CONFIG.JITTER_FACTOR * 100}% jitter`;

    const emailSubject = `[${newStatus}] Website Monitor — datasport.de`;
    const emailBody = `The website monitoring service detected an issue:\n${url}\n\n` +
      `Status: ${newStatus}\n` +
      `Detected at: ${timestamp}\n\n` +
      `The service is using a ${intervalMin}-minute polling interval with ${CONFIG.JITTER_FACTOR * 100}% jitter.\n` +
      `Next alert in ${Math.floor(CONFIG.NOTIFICATION_COOLDOWN_SECONDS / 60)} minutes if the issue persists.`;

    await Promise.all([
      sendTelegramNotification(telegramMsg),
      sendEmailNotification(emailSubject, emailBody),
    ]);
    return;
  }

  // Registration is OPEN!
  const telegramMsg = `🚨 <b>REGISTRATION OPEN!</b>\n\n` +
    `<b>URL:</b> ${url}\n` +
    `<b>Detected:</b> ${timestamp}\n\n` +
    `Previous status: <code>${oldStatus}</code>\n` +
    `New status: <code>${newStatus}</code>\n\n` +
    `🏃‍♂️ Go register now!`;

  const emailSubject = `[OPEN] Registration Available — datasport.de`;
  const emailBody = `Registration is now OPEN!\n\n` +
    `URL: ${url}\n\n` +
    `Previous status: ${oldStatus}\n` +
    `New status: ${newStatus}\n\n` +
    `Detected at: ${timestamp}\n\n` +
    `Go register now!`;

  await Promise.all([
    sendTelegramNotification(telegramMsg),
    sendEmailNotification(emailSubject, emailBody),
  ]);
}
