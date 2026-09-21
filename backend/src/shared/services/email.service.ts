import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { EmailLayoutTemplate } from '../templates/email-layout.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private i18n: I18nService,
  ) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    // Skip email initialization if SMTP credentials are not configured
    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn('SMTP credentials not configured. Email service will be disabled.');
      this.transporter = null;
      return;
    }

    // Initialize email transporter
    const isProduction = process.env.NODE_ENV === 'production';
    const rejectUnauthorized = this.configService.get<string>('SMTP_TLS_REJECT_UNAUTHORIZED') !== 'false';

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort || 587,
      secure: smtpPort === 465, // true for port 465, false for other ports (use STARTTLS)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        // In production, always verify TLS certificates
        // In development, can be disabled via SMTP_TLS_REJECT_UNAUTHORIZED=false
        rejectUnauthorized: isProduction ? true : rejectUnauthorized,
      },
    });

    this.logger.log(`Email service initialized with host: ${smtpHost}:${smtpPort}`);
  }

  /**
   * Send OTP email for registration
   */
  async sendRegistrationOTP(
    email: string,
    otp: string,
    fullName: string,
    locale: string = 'vi',
  ): Promise<void> {
    const OTP_EXPIRY_MINUTES = 2;

    const subject = this.i18n.t('email.registration.subject', { lang: locale });
    const title = this.i18n.t('email.registration.title', { lang: locale });
    const preheader = this.i18n.t('email.registration.preheader', { lang: locale });
    const headerIcon = this.i18n.t('email.registration.icon', { lang: locale });

    // Build email content with manual variable replacement
    const greetingTemplate = this.i18n.t('email.registration.greeting', { lang: locale });
    const greeting = greetingTemplate.replace('{{fullName}}', fullName || 'Khách hàng');

    const otpExpiryTemplate = this.i18n.t('email.registration.otpExpiry', { lang: locale });
    const otpExpiry = otpExpiryTemplate.replace('{{minutes}}', OTP_EXPIRY_MINUTES.toString());

    this.logger.debug(`Registration OTP - Email: ${email}, FullName: "${fullName}", Greeting: "${greeting}"`);

    const content = `
      <p>${greeting}</p>
      <p>${this.i18n.t('email.registration.intro', { lang: locale })}</p>

      ${EmailLayoutTemplate.otpBox(
        otp,
        this.i18n.t('email.registration.otpLabel', { lang: locale }),
        otpExpiry,
      )}

      ${EmailLayoutTemplate.warningBox(
        `<strong>${this.i18n.t('email.registration.warningTitle', { lang: locale })}</strong> ${this.i18n.t('email.registration.warningContent', { lang: locale })}`,
      )}

      <p>${this.i18n.t('email.registration.notRequested', { lang: locale })}</p>
    `;

    const html = EmailLayoutTemplate.generate({
      title,
      preheader,
      headerColor: '#4F46E5',
      headerIcon,
      content,
      footerText: this.i18n.t('email.common.footerAutoMessage', { lang: locale }),
      companyName: this.i18n.t('email.common.companyName', { lang: locale }),
      websiteUrl: this.configService.get<string>('FRONTEND_URL'),
    });

    await this.sendMail(email, subject, html);
  }

  /**
   * Send OTP email for password reset
   */
  async sendPasswordResetOTP(
    email: string,
    otp: string,
    fullName: string,
    locale: string = 'vi',
  ): Promise<void> {
    const OTP_EXPIRY_MINUTES = 2;

    const subject = this.i18n.t('email.passwordReset.subject', { lang: locale });
    const title = this.i18n.t('email.passwordReset.title', { lang: locale });
    const preheader = this.i18n.t('email.passwordReset.preheader', { lang: locale });
    const headerIcon = this.i18n.t('email.passwordReset.icon', { lang: locale });

    // Build email content with manual variable replacement
    const greetingTemplate = this.i18n.t('email.passwordReset.greeting', { lang: locale });
    const greeting = greetingTemplate.replace('{{fullName}}', fullName || 'Khách hàng');

    const otpExpiryTemplate = this.i18n.t('email.passwordReset.otpExpiry', { lang: locale });
    const otpExpiry = otpExpiryTemplate.replace('{{minutes}}', OTP_EXPIRY_MINUTES.toString());

    this.logger.debug(`Password Reset OTP - Email: ${email}, FullName: "${fullName}", Greeting: "${greeting}"`);

    const content = `
      <p>${greeting}</p>
      <p>${this.i18n.t('email.passwordReset.intro', { lang: locale })}</p>

      ${EmailLayoutTemplate.otpBox(
        otp,
        this.i18n.t('email.passwordReset.otpLabel', { lang: locale }),
        otpExpiry,
      )}

      ${EmailLayoutTemplate.warningBox(
        `<strong>${this.i18n.t('email.passwordReset.warningTitle', { lang: locale })}</strong> ${this.i18n.t('email.passwordReset.warningContent', { lang: locale })}`,
      )}

      <p>${this.i18n.t('email.passwordReset.nextSteps', { lang: locale })}</p>
    `;

    const html = EmailLayoutTemplate.generate({
      title,
      preheader,
      headerColor: '#DC2626',
      headerIcon,
      content,
      footerText: this.i18n.t('email.common.footerAutoMessage', { lang: locale }),
      companyName: this.i18n.t('email.common.companyName', { lang: locale }),
      websiteUrl: this.configService.get<string>('FRONTEND_URL'),
    });

    await this.sendMail(email, subject, html);
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(
    email: string,
    fullName: string,
    locale: string = 'vi',
  ): Promise<void> {
    this.logger.debug(`Sending welcome email to ${email} with fullName: "${fullName}"`);

    const companyName = this.i18n.t('email.common.companyName', { lang: locale });
    const subject = this.i18n.t('email.welcome.subject', { lang: locale })
      .replace('{{companyName}}', companyName);
    const title = this.i18n.t('email.welcome.title', { lang: locale });
    const preheader = this.i18n.t('email.welcome.preheader', { lang: locale });
    const headerIcon = this.i18n.t('email.welcome.icon', { lang: locale });

    // Build features list
    const features = [
      this.i18n.t('email.welcome.features.shopping', { lang: locale }),
      this.i18n.t('email.welcome.features.addresses', { lang: locale }),
      this.i18n.t('email.welcome.features.notifications', { lang: locale }),
      this.i18n.t('email.welcome.features.history', { lang: locale }),
    ];

    // Build email content with manual variable replacement
    const greetingTemplate = this.i18n.t('email.welcome.greeting', { lang: locale });
    this.logger.debug(`Greeting template: "${greetingTemplate}"`);
    const greeting = greetingTemplate.replace('{{fullName}}', fullName || 'Khách hàng');
    this.logger.debug(`Final greeting: "${greeting}"`);

    const content = `
      <p>${greeting}</p>
      <p>${this.i18n.t('email.welcome.congratulations', { lang: locale })}</p>
      <p><strong>${this.i18n.t('email.welcome.youCanNow', { lang: locale })}</strong></p>
      <ul>
        ${features.map((feature) => `<li>✅ ${feature}</li>`).join('\n        ')}
      </ul>

      ${EmailLayoutTemplate.button(
        this.i18n.t('email.welcome.buttonText', { lang: locale }),
        `${this.configService.get<string>('FRONTEND_URL')}/${locale}/products`,
      )}

      <hr class="divider" />

      <p style="text-align: center; color: #6b7280;">${this.i18n.t('email.welcome.thankYou', { lang: locale })}</p>
    `;

    const html = EmailLayoutTemplate.generate({
      title,
      preheader,
      headerColor: '#10B981',
      headerIcon,
      content,
      footerText: this.i18n.t('email.common.footerAutoMessage', { lang: locale }),
      companyName,
      websiteUrl: this.configService.get<string>('FRONTEND_URL'),
    });

    await this.sendMail(email, subject, html);
  }

  /**
   * Send order confirmation email to customer
   */
  async sendOrderConfirmation(
    orderData: {
      orderNumber: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      customerAddress: string;
      subtotal: string;
      shippingFee: string;
      discountAmount: string;
      total: string;
      createdAt: Date;
      items: Array<{
        productName: string;
        variantName?: string | null;
        quantity: number;
        price: string;
        total: string;
      }>;
    },
    locale: string = 'vi',
  ): Promise<void> {
    this.logger.log(`Sending order confirmation email to ${orderData.customerEmail} for order ${orderData.orderNumber}`);

    const companyName = this.i18n.t('email.common.companyName', { lang: locale });
    const subjectTemplate = this.i18n.t('email.orderConfirmation.subject', { lang: locale });
    const subject = subjectTemplate.replace('{{orderNumber}}', orderData.orderNumber);

    const title = this.i18n.t('email.orderConfirmation.title', { lang: locale });
    const preheaderTemplate = this.i18n.t('email.orderConfirmation.preheader', { lang: locale });
    const preheader = preheaderTemplate.replace('{{orderNumber}}', orderData.orderNumber);
    const headerIcon = this.i18n.t('email.orderConfirmation.icon', { lang: locale });

    const greetingTemplate = this.i18n.t('email.orderConfirmation.greeting', { lang: locale });
    const greeting = greetingTemplate.replace('{{customerName}}', orderData.customerName);

    // Format currency
    const formatCurrency = (amount: string) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(parseFloat(amount));
    };

    // Format date
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString(
        locale === 'vi' ? 'vi-VN' : 'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      );
    };

    // Build items list
    const itemsList = orderData.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${item.productName}</strong>
            ${item.variantName ? `<br><small style="color: #6b7280;">${item.variantName}</small>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.price)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${formatCurrency(item.total)}</strong></td>
        </tr>
      `
      )
      .join('');

    const content = `
      <p>${greeting}</p>
      <p>${this.i18n.t('email.orderConfirmation.intro', { lang: locale })}</p>

      ${EmailLayoutTemplate.warningBox(
        `<strong>⏱️ ${this.i18n.t('email.orderConfirmation.processingTime', { lang: locale })}</strong><br><br>
        ${this.i18n.t('email.orderConfirmation.trackingInfo', { lang: locale })}`
      )}

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>${this.i18n.t('email.orderConfirmation.orderNumber', { lang: locale })}</strong> ${orderData.orderNumber}</p>
        <p style="margin: 0 0 8px 0;"><strong>${this.i18n.t('email.orderConfirmation.orderDate', { lang: locale })}</strong> ${formatDate(orderData.createdAt)}</p>
      </div>

      <h3>${this.i18n.t('email.orderConfirmation.items', { lang: locale })}</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">${locale === 'vi' ? 'Sản phẩm' : 'Product'}</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">${locale === 'vi' ? 'SL' : 'Qty'}</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">${locale === 'vi' ? 'Đơn giá' : 'Price'}</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">${locale === 'vi' ? 'Thành tiền' : 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
      </table>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0;">${this.i18n.t('email.orderConfirmation.subtotal', { lang: locale })}</td>
            <td style="padding: 8px 0; text-align: right;">${formatCurrency(orderData.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">${this.i18n.t('email.orderConfirmation.shippingFee', { lang: locale })}</td>
            <td style="padding: 8px 0; text-align: right;">${formatCurrency(orderData.shippingFee)}</td>
          </tr>
          ${parseFloat(orderData.discountAmount) > 0 ? `
          <tr style="color: #10b981;">
            <td style="padding: 8px 0;">${this.i18n.t('email.orderConfirmation.discount', { lang: locale })}</td>
            <td style="padding: 8px 0; text-align: right;">-${formatCurrency(orderData.discountAmount)}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 12px 0; font-size: 18px;"><strong>${this.i18n.t('email.orderConfirmation.totalAmount', { lang: locale })}</strong></td>
            <td style="padding: 12px 0; text-align: right; font-size: 18px; color: #4f46e5;"><strong>${formatCurrency(orderData.total)}</strong></td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>${this.i18n.t('email.orderConfirmation.shippingAddress', { lang: locale })}</strong></p>
        <p style="margin: 0; color: #6b7280;">
          ${orderData.customerName}<br>
          ${orderData.customerPhone}<br>
          ${orderData.customerAddress}
        </p>
      </div>

      ${EmailLayoutTemplate.button(
        this.i18n.t('email.orderConfirmation.buttonText', { lang: locale }),
        `${this.configService.get<string>('FRONTEND_URL')}/${locale}/profile/orders`,
      )}

      <hr class="divider" />

      <p style="text-align: center; color: #6b7280;">${this.i18n.t('email.orderConfirmation.contactSupport', { lang: locale })}</p>
      <p style="text-align: center; color: #6b7280;"><strong>${this.i18n.t('email.orderConfirmation.thankYou', { lang: locale })}</strong></p>
    `;

    const html = EmailLayoutTemplate.generate({
      title,
      preheader,
      headerColor: '#4F46E5',
      headerIcon,
      content,
      footerText: this.i18n.t('email.common.footerAutoMessage', { lang: locale }),
      companyName,
      websiteUrl: this.configService.get<string>('FRONTEND_URL'),
    });

    await this.sendMail(orderData.customerEmail, subject, html);
  }

  /**
   * Send new order notification to admin
   */
  async sendNewOrderNotificationToAdmin(
    orderData: {
      orderNumber: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      customerAddress: string;
      subtotal: string;
      shippingFee: string;
      discountAmount: string;
      total: string;
      createdAt: Date;
      notes?: string | null;
      items: Array<{
        productName: string;
        variantName?: string | null;
        quantity: number;
        price: string;
        total: string;
      }>;
    },
    locale: string = 'vi',
  ): Promise<void> {
    const adminEmails = this.configService.get<string>('ADMIN_EMAILS');

    if (!adminEmails) {
      this.logger.warn('ADMIN_EMAILS not configured. Skipping admin notification.');
      return;
    }

    const emailList = adminEmails.split(',').map(email => email.trim()).filter(email => email);

    if (emailList.length === 0) {
      this.logger.warn('No valid admin emails found. Skipping admin notification.');
      return;
    }

    this.logger.log(`Sending new order notification to admins: ${emailList.join(', ')} for order ${orderData.orderNumber}`);

    const companyName = this.i18n.t('email.common.companyName', { lang: locale });
    const subjectTemplate = this.i18n.t('email.newOrderAdmin.subject', { lang: locale });
    const subject = subjectTemplate.replace('{{orderNumber}}', orderData.orderNumber);

    const title = this.i18n.t('email.newOrderAdmin.title', { lang: locale });
    const preheaderTemplate = this.i18n.t('email.newOrderAdmin.preheader', { lang: locale });
    const preheader = preheaderTemplate.replace('{{customerName}}', orderData.customerName);
    const headerIcon = this.i18n.t('email.newOrderAdmin.icon', { lang: locale });

    // Format currency
    const formatCurrency = (amount: string) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(parseFloat(amount));
    };

    // Format date
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString(
        locale === 'vi' ? 'vi-VN' : 'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      );
    };

    // Build items list
    const itemsList = orderData.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${item.productName}</strong>
            ${item.variantName ? `<br><small style="color: #6b7280;">${item.variantName}</small>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.price)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${formatCurrency(item.total)}</strong></td>
        </tr>
      `
      )
      .join('');

    const content = `
      <p><strong>${this.i18n.t('email.newOrderAdmin.intro', { lang: locale })}</strong></p>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>📋 ${this.i18n.t('email.newOrderAdmin.orderNumber', { lang: locale })}</strong> ${orderData.orderNumber}</p>
        <p style="margin: 0;"><strong>📅 ${this.i18n.t('email.newOrderAdmin.orderDate', { lang: locale })}</strong> ${formatDate(orderData.createdAt)}</p>
      </div>

      <h3>${this.i18n.t('email.newOrderAdmin.customerInfo', { lang: locale })}</h3>
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>${this.i18n.t('email.newOrderAdmin.customerName', { lang: locale })}</strong> ${orderData.customerName}</p>
        <p style="margin: 0 0 8px 0;"><strong>${this.i18n.t('email.newOrderAdmin.customerEmail', { lang: locale })}</strong> ${orderData.customerEmail}</p>
        <p style="margin: 0;"><strong>${this.i18n.t('email.newOrderAdmin.customerPhone', { lang: locale })}</strong> ${orderData.customerPhone}</p>
      </div>

      <h3>${this.i18n.t('email.newOrderAdmin.items', { lang: locale })}</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">${locale === 'vi' ? 'Sản phẩm' : 'Product'}</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">${locale === 'vi' ? 'SL' : 'Qty'}</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">${locale === 'vi' ? 'Đơn giá' : 'Price'}</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">${locale === 'vi' ? 'Thành tiền' : 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
      </table>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0;">${this.i18n.t('email.newOrderAdmin.subtotal', { lang: locale })}</td>
            <td style="padding: 8px 0; text-align: right;">${formatCurrency(orderData.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">${this.i18n.t('email.newOrderAdmin.shippingFee', { lang: locale })}</td>
            <td style="padding: 8px 0; text-align: right;">${formatCurrency(orderData.shippingFee)}</td>
          </tr>
          ${parseFloat(orderData.discountAmount) > 0 ? `
          <tr style="color: #10b981;">
            <td style="padding: 8px 0;">${this.i18n.t('email.newOrderAdmin.discount', { lang: locale })}</td>
            <td style="padding: 8px 0; text-align: right;">-${formatCurrency(orderData.discountAmount)}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 12px 0; font-size: 18px;"><strong>${this.i18n.t('email.newOrderAdmin.totalAmount', { lang: locale })}</strong></td>
            <td style="padding: 12px 0; text-align: right; font-size: 18px; color: #f59e0b;"><strong>${formatCurrency(orderData.total)}</strong></td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>${this.i18n.t('email.newOrderAdmin.shippingAddress', { lang: locale })}</strong></p>
        <p style="margin: 0; color: #6b7280;">
          ${orderData.customerName}<br>
          ${orderData.customerPhone}<br>
          ${orderData.customerAddress}
        </p>
      </div>

      ${orderData.notes ? `
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>${this.i18n.t('email.newOrderAdmin.notes', { lang: locale })}</strong></p>
        <p style="margin: 0; color: #6b7280; font-style: italic;">${orderData.notes}</p>
      </div>
      ` : ''}

      ${EmailLayoutTemplate.button(
        this.i18n.t('email.newOrderAdmin.buttonText', { lang: locale }),
        `${this.configService.get<string>('FRONTEND_URL')}/${locale}/admin/orders`,
      )}

      <hr class="divider" />

      <p style="text-align: center; color: #6b7280;"><strong>${this.i18n.t('email.newOrderAdmin.action', { lang: locale })}</strong></p>
    `;

    const html = EmailLayoutTemplate.generate({
      title,
      preheader,
      headerColor: '#F59E0B',
      headerIcon,
      content,
      footerText: this.i18n.t('email.common.footerAutoMessage', { lang: locale }),
      companyName,
      websiteUrl: this.configService.get<string>('FRONTEND_URL'),
    });

    // Send to all admin emails
    for (const adminEmail of emailList) {
      try {
        await this.sendMail(adminEmail, subject, html);
      } catch (error) {
        this.logger.error(`Failed to send admin notification to ${adminEmail}:`, error);
        // Continue sending to other admins even if one fails
      }
    }
  }

  /**
   * Core method to send email
   */
  private async sendMail(to: string, subject: string, html: string): Promise<void> {
    // Skip sending email if transporter is not configured
    if (!this.transporter) {
      this.logger.warn(`Email service not configured. Skipping email to ${to} with subject: ${subject}`);
      this.logger.debug(`Email content would have been sent to ${to}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('SMTP_FROM_NAME', 'NextShop')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new Error('Failed to send email');
    }
  }
}
