import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import type { User, Deviation, DeviationType, DeviationStatus } from '@shared/schema';
import { DeviationCreatedEmail } from './emails/DeviationCreated';
import { DeviationAssignedEmail } from './emails/DeviationAssigned';
import { DeviationStatusChangedEmail } from './emails/DeviationStatusChanged';
import { DeviationCommentAddedEmail } from './emails/DeviationCommentAdded';

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

// Email templates
const emailTemplates = {
  deviationCreated: (deviation: any, creator: User, type: DeviationType) => ({
    subject: `Ny avvikelse: ${deviation.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Ny avvikelse skapad</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">${deviation.title}</h3>
          <p><strong>Typ:</strong> <span style="color: ${type.color};">${type.name}</span></p>
          <p><strong>Beskrivning:</strong></p>
          <p style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid ${type.color};">
            ${deviation.description || 'Ingen beskrivning angiven'}
          </p>
          <p><strong>Skapad av:</strong> ${creator.firstName} ${creator.lastName}</p>
          <p><strong>Datum:</strong> ${new Date(deviation.createdAt).toLocaleDateString('sv-SE')}</p>
        </div>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/deviations/${deviation.id}" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Visa avvikelse
          </a>
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Detta är en automatisk notifiering från avvikelsesystemet.
        </p>
      </div>
    `
  }),

  deviationAssigned: (deviation: any, assignedUser: User, assigner: User, type: DeviationType) => ({
    subject: `Avvikelse tilldelad: ${deviation.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Du har tilldelats en avvikelse</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">${deviation.title}</h3>
          <p><strong>Typ:</strong> <span style="color: ${type.color};">${type.name}</span></p>
          <p><strong>Tilldelad av:</strong> ${assigner.firstName} ${assigner.lastName}</p>
          <p><strong>Beskrivning:</strong></p>
          <p style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid ${type.color};">
            ${deviation.description || 'Ingen beskrivning angiven'}
          </p>
        </div>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/deviations/${deviation.id}" 
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Hantera avvikelse
          </a>
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Detta är en automatisk notifiering från avvikelsesystemet.
        </p>
      </div>
    `
  }),

  deviationStatusChanged: (deviation: any, oldStatus: DeviationStatus, newStatus: DeviationStatus, changedBy: User, type: DeviationType) => ({
    subject: `Avvikelse uppdaterad: ${deviation.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Avvikelse statusändring</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">${deviation.title}</h3>
          <p><strong>Typ:</strong> <span style="color: ${type.color};">${type.name}</span></p>
          <div style="background: white; padding: 15px; border-radius: 4px; margin: 10px 0;">
            <p><strong>Status ändrad:</strong></p>
            <p>
              <span style="background: ${oldStatus.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${oldStatus.name}
              </span>
              →
              <span style="background: ${newStatus.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${newStatus.name}
              </span>
            </p>
          </div>
          <p><strong>Ändrad av:</strong> ${changedBy.firstName} ${changedBy.lastName}</p>
          <p><strong>Datum:</strong> ${new Date().toLocaleDateString('sv-SE')}</p>
        </div>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/deviations/${deviation.id}" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Visa avvikelse
          </a>
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Detta är en automatisk notifiering från avvikelsesystemet.
        </p>
      </div>
    `
  }),

  deviationCommented: (deviation: any, comment: string, commenter: User, type: DeviationType) => ({
    subject: `Ny kommentar: ${deviation.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Ny kommentar på avvikelse</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">${deviation.title}</h3>
          <p><strong>Typ:</strong> <span style="color: ${type.color};">${type.name}</span></p>
          <div style="background: white; padding: 15px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #007bff;">
            <p><strong>Kommentar från ${commenter.firstName} ${commenter.lastName}:</strong></p>
            <p>${comment}</p>
          </div>
          <p><strong>Datum:</strong> ${new Date().toLocaleDateString('sv-SE')}</p>
        </div>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/deviations/${deviation.id}" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Visa avvikelse
          </a>
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Detta är en automatisk notifiering från avvikelsesystemet.
        </p>
      </div>
    `
  })
};

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