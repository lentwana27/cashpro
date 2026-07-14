const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// The second occurrence needs the onClick handler
let parts = code.split('<span className="font-medium">Till Operators</span>\n              </Link>');

if (parts.length === 3) {
  code = parts[0] + '<span className="font-medium">Till Operators</span>\n              </Link>' + parts[1].replace('className="flex items-center gap-3', 'onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3') + '<span className="font-medium">Till Operators</span>\n              </Link>' + parts[2];
  fs.writeFileSync('src/components/Layout.tsx', code);
}
