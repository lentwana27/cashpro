const fs = require('fs');

let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// Replace the message text
code = code.replace(
  `              <div className="mb-4 text-sm text-slate-300 text-center">
                {isSetup 
                  ? "Please set a new 6-digit authentication code to secure your account."
                  : "Please enter your 6-digit authentication code to verify your identity."}
              </div>`,
  `              <div className="mb-4 text-sm text-slate-300 text-center">
                We've sent a 6-digit authentication code to your email. Please enter it below to verify your identity.
              </div>`
);

// Replace the button text
code = code.replace(
  `{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSetup ? 'Save & Access' : 'Verify & Access')}`,
  `{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code & Access'}`
);

fs.writeFileSync('src/pages/Login.tsx', code);
