// Mock data for mail templates
export const mockMailTemplates = [
  {
    name: 'welcome_email',
    subject: 'Welcome to Our Platform!',
    body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #007bff;">Welcome to Our Platform!</h1>
        <p>Hello {{name}},</p>
        <p>Thank you for joining our platform. We're excited to have you on board!</p>
        <p>Your account has been successfully created with the email: <strong>{{email}}</strong></p>
        <p>You can now log in and start exploring our features.</p>
        <div style="margin: 30px 0;">
            <a href="{{login_url}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Login to Your Account</a>
        </div>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Team</p>
    </div>
</body>
</html>`,
    active: true
  },
  {
    name: 'password_reset',
    subject: 'Password Reset Request',
    body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc3545;">Password Reset Request</h1>
        <p>Hello {{name}},</p>
        <p>We received a request to reset your password for your account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="margin: 30px 0;">
            <a href="{{reset_url}}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        <p>Best regards,<br>The Team</p>
    </div>
</body>
</html>`,
    active: true
  },
  {
    name: 'account_verification',
    subject: 'Please Verify Your Email Address',
    body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #28a745;">Email Verification Required</h1>
        <p>Hello {{name}},</p>
        <p>Thank you for creating an account with us. To complete your registration, please verify your email address.</p>
        <div style="margin: 30px 0;">
            <a href="{{verification_url}}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">{{verification_url}}</p>
        <p>This verification link will expire in 24 hours.</p>
        <p>Best regards,<br>The Team</p>
    </div>
</body>
</html>`,
    active: true
  }
];