import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { User, DeviationType, DeviationStatus } from "@shared/schema";
import { DeviationCreatedEmail } from "./emails/DeviationCreated";
import { DeviationAssignedEmail } from "./emails/DeviationAssigned";
import { DeviationStatusChangedEmail } from "./emails/DeviationStatusChanged";
import { DeviationCommentAddedEmail } from "./emails/DeviationCommentAdded";
import { DeviationUpdatedEmail } from "./emails/DeviationUpdated";

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Anti-spam configuration
    headers: {
      "X-Priority": "3",
      "X-MSMail-Priority": "Normal",
      "X-Mailer": "System by Selection v1.0",
      "X-MimeOLE": "System by Selection",
      "X-Auto-Response-Suppress": "All",
      Precedence: "bulk",
    },
  });
};



export class EmailNotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendEmail(
    to: string | string[],
    template: { subject: string; html: string },
  ) {
    try {
      if (!process.env.SMTP_HOST || !process.env.FROM_EMAIL) {
        console.log("Email not configured, skipping notification");
        return;
      }

      const recipients = Array.isArray(to) ? to : [to];

      const info = await this.transporter.sendMail({
        from: {
          name: "System by Selection",
          address: process.env.FROM_EMAIL,
        },
        to: recipients.join(", "),
        subject: template.subject,
        html: template.html,
        text: this.htmlToText(template.html),
      });

      console.log("Email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  }

  private htmlToText(html: string): string {
    if (!html) return "Notifiering från System by Selection";
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&\w+;/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Notifiering från System by Selection";
  }

  async notifyDeviationCreated(
    deviation: any,
    creator: User,
    type: DeviationType,
    notifyUsers: User[],
  ) {
    const emailHtml = await render(
      DeviationCreatedEmail({
        deviation,
        creator,
        type,
        baseUrl: process.env.FRONTEND_URL || "http://localhost:5000",
      }),
    );

    await this.sendEmail(
      notifyUsers.map((user) => user.email),
      { subject: `Ny avvikelse: ${deviation.title}`, html: emailHtml }
    );
  }

  async notifyDeviationAssigned(
    deviation: any,
    assignedUser: User,
    assigner: User,
    type: DeviationType,
  ) {
    const emailHtml = await render(
      DeviationAssignedEmail({
        deviation,
        assignedUser,
        assigner,
        type,
        baseUrl: process.env.FRONTEND_URL || "http://localhost:5000",
      }),
    );

    await this.sendEmail(assignedUser.email, {
      subject: `Avvikelse tilldelad: ${deviation.title}`,
      html: emailHtml,
    });
  }

  async notifyStatusChanged(
    deviation: any,
    oldStatus: DeviationStatus,
    newStatus: DeviationStatus,
    changedBy: User,
    type: DeviationType,
    notifyUsers: User[],
  ) {
    const emailHtml = await render(
      DeviationStatusChangedEmail({
        deviation,
        oldStatus,
        newStatus,
        changedBy,
        type,
        baseUrl: process.env.FRONTEND_URL || "http://localhost:5000",
      }),
    );

    await this.sendEmail(
      notifyUsers.map((user) => user.email),
      { subject: `Statusändring: ${deviation.title}`, html: emailHtml }
    );
  }

  async notifyNewComment(
    deviation: any,
    comment: string,
    commenter: User,
    type: DeviationType,
    notifyUsers: User[],
  ) {
    const emailHtml = await render(
      DeviationCommentAddedEmail({
        deviation,
        comment,
        commenter,
        type,
        baseUrl: process.env.FRONTEND_URL || "http://localhost:5000",
      }),
    );

    await this.sendEmail(
      notifyUsers.map((user) => user.email),
      { subject: `Ny kommentar: ${deviation.title}`, html: emailHtml }
    );
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: "Email configuration is valid" };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }
}

export const emailService = new EmailNotificationService();
