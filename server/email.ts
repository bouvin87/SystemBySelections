import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import type { User, Deviation, DeviationType, DeviationStatus } from '@shared/schema';
import { DeviationCreatedEmail } from './emails/DeviationCreated';
import { DeviationAssignedEmail } from './emails/DeviationAssigned';
import { DeviationStatusChangedEmail } from './emails/DeviationStatusChanged';
import { DeviationCommentAddedEmail } from './emails/DeviationCommentAdded';
import { DeviationUpdatedEmail } from './emails/DeviationUpdated';

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Anti-spam configuration
    headers: {
      'X-Priority': '3',
      'X-MSMail-Priority': 'Normal',
      'X-Mailer': 'System by Selection v1.0',
      'X-MimeOLE': 'System by Selection',
      'X-Auto-Response-Suppress': 'All',
      'Precedence': 'bulk',
    },
  });
};

// React Email templates are imported and used directly in the service methods below

// Email notification functions
export class EmailNotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = createTransporter();
  }

  private async sendEmail(to: string | string[], template: { subject: string; html: string }) {
    try {
      if (!process.env.SMTP_HOST || !process.env.FROM_EMAIL) {
        console.log('Email not configured, skipping notification');
        return;
      }

      const recipients = Array.isArray(to) ? to : [to];
      
      const info = await this.transporter.sendMail({
        from: {
          name: 'System by Selection',
          address: process.env.FROM_EMAIL,
        },
        to: recipients.join(', '),
        subject: template.subject,
        html: template.html,
        text: typeof template.html === 'string' ? this.htmlToText(template.html) : 'Ny avvikelse i systemet', // Plain text fallback
        headers: {
          'List-Unsubscribe': `<mailto:unsubscribe@${process.env.DOMAIN_NAME || 'systembyselections.se'}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'X-Entity-Ref-ID': 'system-by-selection',
          'Reply-To': process.env.FROM_EMAIL,
          'Message-ID': `<${Date.now()}-${Math.random().toString(36)}@${process.env.DOMAIN_NAME || 'systembyselections.se'}>`,
          'X-Campaign-ID': 'deviation-notifications',
          'X-Sender-ID': 'system-by-selection-notifications',
        },
      });

      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    if (typeof html !== 'string') {
      return String(html);
    }
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async notifyDeviationCreated(
    deviation: any,
    creator: User,
    type: DeviationType,
    notifyUsers: User[]
  ) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    
    const emailHtml = await render(DeviationCreatedEmail({
      deviation,
      creator,
      type,
      baseUrl,
    }));

    const template = {
      subject: `Ny avvikelse: ${deviation.title}`,
      html: emailHtml,
    };

    const emails = notifyUsers.map(user => user.email);
    
    if (emails.length > 0) {
      await this.sendEmail(emails, template);
    }
  }

  async notifyDeviationAssigned(
    deviation: any,
    assignedUser: User,
    assigner: User,
    type: DeviationType
  ) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    
    const emailHtml = await render(DeviationAssignedEmail({
      deviation,
      assignedUser,
      assigner,
      type,
      baseUrl,
    }));

    const template = {
      subject: `Avvikelse tilldelad: ${deviation.title}`,
      html: emailHtml,
    };

    await this.sendEmail(assignedUser.email, template);
  }

  async notifyStatusChanged(
    deviation: any,
    oldStatus: DeviationStatus,
    newStatus: DeviationStatus,
    changedBy: User,
    type: DeviationType,
    notifyUsers: User[]
  ) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    
    const emailHtml = await render(DeviationStatusChangedEmail({
      deviation,
      oldStatus,
      newStatus,
      changedBy,
      type,
      baseUrl,
    }));

    const template = {
      subject: `Avvikelse uppdaterad: ${deviation.title}`,
      html: emailHtml,
    };

    const emails = notifyUsers.map(user => user.email);
    
    if (emails.length > 0) {
      await this.sendEmail(emails, template);
    }
  }

  async notifyNewComment(
    deviation: any,
    comment: string,
    commenter: User,
    type: DeviationType,
    notifyUsers: User[]
  ) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    
    const emailHtml = await render(DeviationCommentAddedEmail({
      deviation,
      comment,
      commenter,
      type,
      baseUrl,
    }));

    const template = {
      subject: `Ny kommentar: ${deviation.title}`,
      html: emailHtml,
    };

    const emails = notifyUsers.map(user => user.email);
    
    if (emails.length > 0) {
      await this.sendEmail(emails, template);
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }
}

export const emailService = new EmailNotificationService();