const fs = require('fs');

let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// 1. Add authMethod state
code = code.replace(
  `  const [isSetup, setIsSetup] = useState<boolean>(() => sessionStorage.getItem('cashup_2fa_setup') === 'true');`,
  `  const [isSetup, setIsSetup] = useState<boolean>(() => sessionStorage.getItem('cashup_2fa_setup') === 'true');
  const [authMethod, setAuthMethod] = useState<'STATIC' | 'EMAIL'>(() => sessionStorage.getItem('cashup_auth_method') as 'STATIC' | 'EMAIL' || 'EMAIL');`
);

// 2. Handle login response
code = code.replace(
  `        if (result.isSetup) sessionStorage.setItem('cashup_2fa_setup', 'true');
        setTempToken(result.tempToken);
        setIsSetup(result.isSetup);
        setStep('2fa');`,
  `        if (result.isSetup) sessionStorage.setItem('cashup_2fa_setup', 'true');
        if (result.authMethod) sessionStorage.setItem('cashup_auth_method', result.authMethod);
        setTempToken(result.tempToken);
        setIsSetup(result.isSetup);
        setAuthMethod(result.authMethod || 'EMAIL');
        setStep('2fa');`
);

// 3. Update the UI text
code = code.replace(
  `              <div className="mb-4 text-sm text-slate-300 text-center">
                We've sent a 6-digit authentication code to your email. Please enter it below to verify your identity.
              </div>`,
  `              <div className="mb-4 text-sm text-slate-300 text-center">
                {authMethod === 'STATIC' ? (
                  isSetup 
                    ? "Please set a new 6-digit authentication code to secure your account."
                    : "Please enter your 6-digit authentication code to verify your identity."
                ) : (
                  "We've sent a 6-digit authentication code to your email. Please enter it below to verify your identity."
                )}
              </div>`
);

// 4. Update the button text
code = code.replace(
  `{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code & Access'}`,
  `{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMethod === 'STATIC' && isSetup ? 'Save & Access' : 'Verify Code & Access')}`
);

fs.writeFileSync('src/pages/Login.tsx', code);
