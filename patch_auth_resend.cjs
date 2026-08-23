const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add Resend import and initialization
if (!code.includes('import { Resend }')) {
  code = code.replace(
    "import { eq, desc, or } from 'drizzle-orm';",
    "import { eq, desc, or } from 'drizzle-orm';\nimport { Resend } from 'resend';\n\nconst resend = new Resend(process.env.RESEND_API_KEY || 're_2vkPYVEZ_GHDenGCEcNGv9aeunRMeF6Qi');"
  );
}

// 2. Patch /auth/login
code = code.replace(
  `  if (user && user.passwordHash === password) {
    if (!user.active) {
      return res.status(401).json({ error: 'Account pending admin approval' });
    }
    const isSetup = !user.twoFactorCode;
    res.json({ requires2FA: true, tempToken: user.id, isSetup });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }`,
  `  if (user && user.passwordHash === password) {
    if (!user.active) {
      return res.status(401).json({ error: 'Account pending admin approval' });
    }
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to DB
    await db.update(schema.users).set({ twoFactorCode: otp }).where(eq(schema.users.id, user.id));
    
    // Send Email
    try {
      await resend.emails.send({
        from: 'CashUp Pro <onboarding@resend.dev>',
        to: user.email,
        subject: 'Your CashUp Pro Login Code',
        html: \`<p>Your 6-digit authentication code is: <strong>\${otp}</strong></p><p>This code will expire shortly.</p>\`
      });
    } catch(e) {
      console.error('Failed to send email:', e);
    }
    
    res.json({ requires2FA: true, tempToken: user.id, isSetup: false });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }`
);

// 3. Patch /auth/verify-2fa
code = code.replace(
  `  if (!user.twoFactorCode) {
    // First time setup
    await db.update(schema.users).set({ twoFactorCode: code, isOnline: true, lastSeen: new Date().toISOString() }).where(eq(schema.users.id, user.id));
    user.twoFactorCode = code;
    return res.json({ user, token: 'fake-jwt-token-replace-later' });
  }
  
  if (code !== user.twoFactorCode) {
    return res.status(401).json({ error: 'Invalid 2FA code' });
  }
  
  await db.update(schema.users).set({ isOnline: true, lastSeen: new Date().toISOString() }).where(eq(schema.users.id, user.id));
  res.json({ user, token: 'fake-jwt-token-replace-later' });`,
  `  if (!user.twoFactorCode || code !== user.twoFactorCode) {
    return res.status(401).json({ error: 'Invalid 2FA code' });
  }
  
  // Code is valid, clear it
  await db.update(schema.users).set({ twoFactorCode: null, isOnline: true, lastSeen: new Date().toISOString() }).where(eq(schema.users.id, user.id));
  
  res.json({ user, token: 'fake-jwt-token-replace-later' });`
);

fs.writeFileSync('server.ts', code);
