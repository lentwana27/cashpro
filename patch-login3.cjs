const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

code = code.replace(
  `const [step, setStep] = useState<'login' | '2fa'>(() => sessionStorage.getItem('cashup_temp_token') ? '2fa' : 'login');`,
  `const [step, setStep] = useState<'login' | '2fa'>(() => sessionStorage.getItem('cashup_temp_token') ? '2fa' : 'login');
  const [isSetup, setIsSetup] = useState<boolean>(() => sessionStorage.getItem('cashup_2fa_setup') === 'true');`
);

code = code.replace(
  `        sessionStorage.setItem('cashup_temp_token', result.tempToken);
        setTempToken(result.tempToken);
        setStep('2fa');`,
  `        sessionStorage.setItem('cashup_temp_token', result.tempToken);
        if (result.isSetup) sessionStorage.setItem('cashup_2fa_setup', 'true');
        setTempToken(result.tempToken);
        setIsSetup(result.isSetup);
        setStep('2fa');`
);

code = code.replace(
  `                sessionStorage.removeItem('cashup_temp_token');
                setStep('login');`,
  `                sessionStorage.removeItem('cashup_temp_token');
                sessionStorage.removeItem('cashup_2fa_setup');
                setStep('login');`
);

code = code.replace(
  `              <div className="mb-4 text-sm text-slate-300 text-center">
                Please enter your 6-digit authentication code to verify your identity.
              </div>`,
  `              <div className="mb-4 text-sm text-slate-300 text-center">
                {isSetup 
                  ? "Please set a new 6-digit authentication code to secure your account."
                  : "Please enter your 6-digit authentication code to verify your identity."}
              </div>`
);

code = code.replace(
  `{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Access'}`,
  `{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSetup ? 'Save & Access' : 'Verify & Access')}`
);

fs.writeFileSync('src/pages/Login.tsx', code);
