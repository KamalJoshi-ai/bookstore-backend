
import nodemailer from "nodemailer";

import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config();

const transporter = nodemailer.createTransport({
  service:"gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


transporter.verify((error, success) => {
  if (error) {
    console.log(" Email server error:", error);
  } else {
    console.log(" Email server is ready to send messages");
  }
});

export const sendEmail = async (to: string, subject: string, body: string) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: body,
  });
};
export const sendVerificationToEmail = async (to: string, token: string) => {
 
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

const html = `
  <div style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; padding:40px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
            
            <tr>
              <td align="center">
                <h1 style="margin:0; color:#111827; font-size:26px;">
                  Welcome to BookArt 
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 0; color:#4b5563; font-size:16px; text-align:center;">
                Thank you for signing up!  
                Please confirm your email address by clicking the button below.
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:20px 0;">
                <a href="${verificationUrl}" 
                   style="
                     background-color:#4f46e5;
                     color:#ffffff;
                     padding:12px 24px;
                     text-decoration:none;
                     border-radius:6px;
                     font-size:16px;
                     font-weight:bold;
                     display:inline-block;
                   ">
                  Verify Email 
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding-top:20px; font-size:14px; color:#6b7280; text-align:center;">
                This link will expire in 24 hours.
              </td>
            </tr>

            <tr>
              <td style="padding-top:10px; font-size:12px; color:#9ca3af; text-align:center;">
                If you did not create an account, you can safely ignore this email.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
`;

  await sendEmail(to, "Verify Your BookKart Account", html);
};


export const sendResetPasswordLinkToEmail = async (
  to: string,
  token: string
) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const html = `
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
  `;

  await sendEmail(to, "Reset Your Password", html);
};
export const sendShippingEmail = async (
  to: string,
  orderDetails: {
    customerName: string;
    orderId: string;
    trackingNumber: string;
    courierName: string;
    books: string[];
    shippedDate: Date;
  }
) => {
  const estimatedDelivery = new Date(orderDetails.shippedDate);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
  const earliestDelivery = new Date(orderDetails.shippedDate);
  earliestDelivery.setDate(earliestDelivery.getDate() + 5);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const html = `
    <div style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; padding:40px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">

              <!-- Header -->
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <h1 style="margin:0; color:#111827; font-size:26px;">📦 Your Order is On the Way!</h1>
                </td>
              </tr>

              <!-- Greeting -->
              <tr>
                <td style="color:#4b5563; font-size:16px; padding-bottom:20px;">
                  Hi <strong>${orderDetails.customerName}</strong>,<br/>
                  Great news! Your order has been shipped and is on its way to you.
                </td>
              </tr>

              <!-- Order Info -->
              <tr>
                <td style="padding-bottom:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border-radius:8px; padding:20px;">
                    <tr>
                      <td style="padding:6px 0; font-size:14px; color:#6b7280;">Order ID</td>
                      <td style="padding:6px 0; font-size:14px; color:#111827; font-weight:bold; text-align:right;">
                        #${orderDetails.orderId.slice(-6).toUpperCase()}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; font-size:14px; color:#6b7280;">Tracking Number</td>
                      <td style="padding:6px 0; font-size:14px; color:#4f46e5; font-weight:bold; text-align:right;">
                        ${orderDetails.trackingNumber}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; font-size:14px; color:#6b7280;">Courier</td>
                      <td style="padding:6px 0; font-size:14px; color:#111827; text-align:right;">
                        ${orderDetails.courierName}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; font-size:14px; color:#6b7280;">Shipped On</td>
                      <td style="padding:6px 0; font-size:14px; color:#111827; text-align:right;">
                        ${formatDate(orderDetails.shippedDate)}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; font-size:14px; color:#6b7280;">Estimated Delivery</td>
                      <td style="padding:6px 0; font-size:14px; color:#059669; font-weight:bold; text-align:right;">
                        ${formatDate(earliestDelivery)} – ${formatDate(estimatedDelivery)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Books -->
              <tr>
                <td style="padding-bottom:24px;">
                  <p style="font-size:14px; color:#6b7280; margin:0 0 8px;">Books in this order:</p>
                  ${orderDetails.books.map(book => `
                    <div style="padding:8px 12px; background:#f3f4f6; border-radius:6px; margin-bottom:6px; font-size:14px; color:#111827;">
                      📚 ${book}
                    </div>
                  `).join("")}
                </td>
              </tr>

              <!-- Note -->
              <tr>
                <td style="padding:16px; background:#fffbeb; border-radius:8px; border-left:4px solid #f59e0b; margin-bottom:24px;">
                  <p style="margin:0; font-size:13px; color:#92400e;">
                    <strong>Note:</strong> Delivery estimates are based on working days and may vary depending on your location.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding-top:24px; font-size:12px; color:#9ca3af; text-align:center; border-top:1px solid #f3f4f6;">
                  If you have any issues, please contact us at ${process.env.EMAIL_USER}<br/>
                  © Book Kart
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  await sendEmail(to, "Your Order Has Been Shipped! 📦", html);
};
export const sendDeliveryEmail = async (
  to: string,
  orderDetails: {
    customerName: string;
    orderId: string;
    books: string[];
    deliveredDate: Date;
  }
) => {
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const html = `
    <div style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; padding:40px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">

              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <h1 style="margin:0; color:#111827; font-size:26px;">✅ Order Delivered!</h1>
                </td>
              </tr>

              <tr>
                <td style="color:#4b5563; font-size:16px; padding-bottom:20px;">
                  Hi <strong>${orderDetails.customerName}</strong>,<br/>
                  Your order has been successfully delivered. We hope you enjoy your books!
                </td>
              </tr>

              <tr>
                <td style="padding-bottom:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border-radius:8px; padding:20px;">
                    <tr>
                      <td style="padding:6px 0; font-size:14px; color:#6b7280;">Order ID</td>
                      <td style="padding:6px 0; font-size:14px; color:#111827; font-weight:bold; text-align:right;">
                        #${orderDetails.orderId.slice(-6).toUpperCase()}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; font-size:14px; color:#6b7280;">Delivered On</td>
                      <td style="padding:6px 0; font-size:14px; color:#059669; font-weight:bold; text-align:right;">
                        ${formatDate(orderDetails.deliveredDate)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding-bottom:24px;">
                  <p style="font-size:14px; color:#6b7280; margin:0 0 8px;">Books delivered:</p>
                  ${orderDetails.books.map(book => `
                    <div style="padding:8px 12px; background:#f3f4f6; border-radius:6px; margin-bottom:6px; font-size:14px; color:#111827;">
                      📚 ${book}
                    </div>
                  `).join("")}
                </td>
              </tr>

              <tr>
                <td style="padding:16px; background:#ecfdf5; border-radius:8px; border-left:4px solid #059669; margin-bottom:24px;">
                  <p style="margin:0; font-size:13px; color:#065f46;">
                    <strong>Happy Reading!</strong> If you faced any issue with your order, please contact us.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding-top:24px; font-size:12px; color:#9ca3af; text-align:center; border-top:1px solid #f3f4f6;">
                  If you have any issues, please contact us at ${process.env.EMAIL_USER}<br/>
                  © Book Kart
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  await sendEmail(to, "Your Order Has Been Delivered! ✅", html);
};

export const sendCancellationEmail = async (
  to: string,
  orderDetails: {
    customerName: string;
    orderId: string;
    books: string[];
  }
) => {
  const html = `
    <div style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; padding:40px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">

              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <h1 style="margin:0; color:#111827; font-size:26px;">❌ Order Cancelled</h1>
                </td>
              </tr>

              <tr>
                <td style="color:#4b5563; font-size:16px; padding-bottom:20px;">
                  Hi <strong>${orderDetails.customerName}</strong>,<br/>
                  We're sorry to inform you that your order has been cancelled.
                </td>
              </tr>

              <tr>
                <td style="padding-bottom:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border-radius:8px; padding:20px;">
                    <tr>
                      <td style="padding:6px 0; font-size:14px; color:#6b7280;">Order ID</td>
                      <td style="padding:6px 0; font-size:14px; color:#111827; font-weight:bold; text-align:right;">
                        #${orderDetails.orderId.slice(-6).toUpperCase()}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding-bottom:24px;">
                  <p style="font-size:14px; color:#6b7280; margin:0 0 8px;">Cancelled books:</p>
                  ${orderDetails.books.map(book => `
                    <div style="padding:8px 12px; background:#f3f4f6; border-radius:6px; margin-bottom:6px; font-size:14px; color:#111827;">
                      📚 ${book}
                    </div>
                  `).join("")}
                </td>
              </tr>

              <tr>
                <td style="padding:16px; background:#fef2f2; border-radius:8px; border-left:4px solid #ef4444; margin-bottom:24px;">
                  <p style="margin:0; font-size:13px; color:#991b1b;">
                    <strong>Note:</strong> If you think this is a mistake or need help, please contact us.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding-top:24px; font-size:12px; color:#9ca3af; text-align:center; border-top:1px solid #f3f4f6;">
                  If you have any issues, please contact us at ${process.env.EMAIL_USER}<br/>
                  © Book Kart
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  await sendEmail(to, "Your Order Has Been Cancelled ❌", html);
};