const fs = require('fs');
let code = fs.readFileSync('src/pages/SystemBranches.tsx', 'utf8');

code = code.replace(/import \{ Building2, X, CheckCircle, Activity, Search, Target, MessageCircle, AlertTriangle, Send, ShieldCheck, Plus \} from 'lucide-react';/g,
  "import { Building2, X, CheckCircle, Activity, Search, Target, MessageCircle, AlertTriangle, Send, ShieldCheck, Plus, UserSquare, UserPlus, ArrowRightLeft } from 'lucide-react';");

fs.writeFileSync('src/pages/SystemBranches.tsx', code);
