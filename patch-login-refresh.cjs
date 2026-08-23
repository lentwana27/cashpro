const fs = require('fs');

let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

code = code.replace(
  `const [step, setStep] = useState<'login' | '2fa'>('login');
  const [tempToken, setTempToken] = useState<string>('');`,
  `const [step, setStep] = useState<'login' | '2fa'>(() => sessionStorage.getItem('cashup_temp_token') ? '2fa' : 'login');
  const [tempToken, setTempToken] = useState<string>(() => sessionStorage.getItem('cashup_temp_token') || '');`
);

code = code.replace(
  `        setTempToken(result.tempToken);
        setStep('2fa');`,
  `        sessionStorage.setItem('cashup_temp_token', result.tempToken);
        setTempToken(result.tempToken);
        setStep('2fa');`
);

code = code.replace(
  `                setStep('login');
                setTwoFactorCode('');
                setError('');`,
  `                sessionStorage.removeItem('cashup_temp_token');
                setStep('login');
                setTwoFactorCode('');
                setError('');`
);

fs.writeFileSync('src/pages/Login.tsx', code);
