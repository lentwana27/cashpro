const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemBranches.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    loadData();
  }, []);`;

const newEffect = `  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);`;

if (content.includes(oldEffect)) {
  content = content.replace(oldEffect, newEffect);
  fs.writeFileSync('src/pages/SystemBranches.tsx', content);
  console.log("Patched SystemBranches");
} else {
  console.log("Could not find SystemBranches useEffect");
}
