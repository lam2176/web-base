/**
 * Common Email Layout Template
 * Provides consistent branding and styling for all system emails
 */

export interface EmailLayoutOptions {
  title: string;
  preheader?: string;
  headerColor?: string;
  headerIcon?: string;
  content: string;
  footerText?: string;
  companyName?: string;
  websiteUrl?: string;
}

export class EmailLayoutTemplate {
  /**
   * Generate complete email HTML with layout
   */
  static generate(options: EmailLayoutOptions): string {
    const {
      title,
      preheader = '',
      headerColor = '#4F46E5',
      headerIcon = '📧',
      content,
      footerText = '',
      companyName = 'NextShop',
      websiteUrl = '',
    } = options;

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    /* Base styles */
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
      line-height: 1.6;
    }

    /* Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }

    /* Preheader text */
    .preheader {
      display: none;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
      mso-hide: all;
      font-size: 1px;
      line-height: 1px;
      color: #f3f4f6;
    }

    /* Header */
    .header {
      background-color: ${headerColor};
      color: #ffffff;
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      line-height: 1.2;
    }

    /* Content */
    .content {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #374151;
    }
    .content strong {
      color: #111827;
      font-weight: 600;
    }

    /* Button */
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: ${headerColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      transition: background-color 0.3s ease;
    }
    .button:hover {
      opacity: 0.9;
    }

    /* OTP Box */
    .otp-box {
      background-color: #f9fafb;
      border: 2px dashed ${headerColor};
      padding: 24px;
      text-align: center;
      margin: 24px 0;
      border-radius: 8px;
    }
    .otp-label {
      margin: 0 0 8px 0;
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: ${headerColor};
      letter-spacing: 8px;
      margin: 8px 0;
      font-family: 'Courier New', monospace;
    }
    .otp-expiry {
      margin: 8px 0 0 0;
      color: #9ca3af;
      font-size: 13px;
    }

    /* Warning Box */
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .warning-box p {
      margin: 0;
      color: #92400e;
      font-size: 14px;
    }
    .warning-box strong {
      color: #78350f;
    }

    /* Info Box */
    .info-box {
      background-color: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      color: #1e40af;
      font-size: 14px;
    }

    /* Success Box */
    .success-box {
      background-color: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .success-box p {
      margin: 0;
      color: #065f46;
      font-size: 14px;
    }

    /* List styles */
    .content ul {
      margin: 16px 0;
      padding-left: 20px;
    }
    .content ul li {
      margin-bottom: 8px;
      color: #374151;
      font-size: 15px;
    }

    /* Divider */
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 32px 0;
      border: none;
    }

    /* Footer */
    .footer {
      background-color: #f9fafb;
      padding: 30px 20px;
      text-align: center;
      border-radius: 0 0 8px 8px;
    }
    .footer p {
      margin: 0 0 8px 0;
      color: #6b7280;
      font-size: 13px;
      line-height: 1.5;
    }
    .footer a {
      color: ${headerColor};
      text-decoration: none;
      font-weight: 500;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .social-links {
      margin-top: 16px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #9ca3af;
      font-size: 20px;
      text-decoration: none;
    }

    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .content {
        padding: 24px 20px !important;
      }
      .header h1 {
        font-size: 24px !important;
      }
      .otp-code {
        font-size: 28px !important;
        letter-spacing: 6px !important;
      }
    }
  </style>
</head>
<body>
  <!-- Preheader text -->
  <span class="preheader">${preheader}</span>

  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="padding: 20px 0;">
        <!-- Email container -->
        <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" align="center">
          <!-- Header -->
          <tr>
            <td class="header">
              <div class="header-icon">${headerIcon}</div>
              <h1>${title}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer">
              <p>${footerText || 'Email này được gửi tự động, vui lòng không trả lời.'}</p>
              ${websiteUrl ? `<p><a href="${websiteUrl}">Truy cập website</a></p>` : ''}
              <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} ${companyName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Helper: Generate OTP box HTML
   */
  static otpBox(otpCode: string, label: string, expiryText: string): string {
    return `
      <div class="otp-box">
        <p class="otp-label">${label}</p>
        <div class="otp-code">${otpCode}</div>
        <p class="otp-expiry">${expiryText}</p>
      </div>
    `;
  }

  /**
   * Helper: Generate warning box HTML
   */
  static warningBox(content: string): string {
    return `
      <div class="warning-box">
        <p>${content}</p>
      </div>
    `;
  }

  /**
   * Helper: Generate info box HTML
   */
  static infoBox(content: string): string {
    return `
      <div class="info-box">
        <p>${content}</p>
      </div>
    `;
  }

  /**
   * Helper: Generate success box HTML
   */
  static successBox(content: string): string {
    return `
      <div class="success-box">
        <p>${content}</p>
      </div>
    `;
  }

  /**
   * Helper: Generate button HTML
   */
  static button(text: string, url: string): string {
    return `
      <div style="text-align: center;">
        <a href="${url}" class="button">${text}</a>
      </div>
    `;
  }
}
