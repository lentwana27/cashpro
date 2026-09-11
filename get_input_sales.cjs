const fs = require('fs');
let content = fs.readFileSync('src/pages/AccountantDashboard.tsx', 'utf8');

const modalStart = content.indexOf('function InputSalesModal');
const modalEnd = content.indexOf('export function AccountantDashboard', modalStart) !== -1 ? content.indexOf('export function AccountantDashboard', modalStart) : content.length;

let modalCode = content.substring(modalStart);
fs.writeFileSync('InputSalesModal.txt', modalCode);
console.log("Wrote InputSalesModal.txt");
