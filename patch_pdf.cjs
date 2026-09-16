const fs = require('fs');
let code = fs.readFileSync('src/components/ReconModal.tsx', 'utf8');

// First, make sure we have a reference to the container
if (!code.includes('const pdfRef = useRef<HTMLDivElement>(null);')) {
  code = code.replace(
    'const [saving, setSaving] = useState(false);',
    'const [saving, setSaving] = useState(false);\n  const pdfRef = useRef<HTMLDivElement>(null);\n  const [downloading, setDownloading] = useState(false);'
  );
}

// Add the download function
if (!code.includes('const downloadPdf')) {
  const downloadFunc = `
  const downloadPdf = async () => {
    if (!pdfRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(pdfRef.current, { scale: 2, backgroundColor: '#0a192f', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(\`Reconciliation_\${localRecon.date}_\${localRecon.branchId}.pdf\`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF. Check console for details.');
    } finally {
      setDownloading(false);
    }
  };
  `;
  code = code.replace('const saveNote = async (idx: number) => {', downloadFunc + '\n  const saveNote = async (idx: number) => {');
}

// Add the download button next to X
if (!code.includes('<button onClick={downloadPdf}')) {
  code = code.replace(
    '<button onClick={onClose} className="text-slate-500 hover:text-white bg-[#112240] p-2 rounded-lg transition-colors">',
    `<div className="flex items-center gap-3">
            <button onClick={downloadPdf} disabled={downloading} className="flex items-center gap-2 text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 p-2 px-3 rounded-lg transition-colors border border-emerald-500/20 text-sm font-bold disabled:opacity-50">
              <Download className="w-4 h-4" />
              {downloading ? 'Exporting...' : 'Download PDF'}
            </button>
            <button onClick={onClose} className="text-slate-500 hover:text-white bg-[#112240] p-2 rounded-lg transition-colors">`
  );
  // close the flex div
  code = code.replace(
    '<X className="w-5 h-5" />\n          </button>',
    '<X className="w-5 h-5" />\n          </button>\n          </div>'
  );
}

// Attach the ref to the content we want to capture
code = code.replace('<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#061121]">', '<div ref={pdfRef} className="bg-[#0a192f]">\n        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#061121]">');
code = code.replace('</div>\n    </div>\n  );\n}', '</div>\n      </div>\n    </div>\n  );\n}'); // close the ref div

fs.writeFileSync('src/components/ReconModal.tsx', code);
