const fs = require('fs');

let code = fs.readFileSync('src/components/ReconModal.tsx', 'utf8');

const regex = /<div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black\/60 backdrop-blur-sm overflow-hidden">[\s\S]*?<div className="bg-\[#0a192f\]">\s*<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-\[#061121\]">/;

const newHeader = 
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-hidden">\n' +
    '  <div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-5xl max-h-full shadow-2xl overflow-y-auto flex flex-col relative">\n' +
    '    <div className="absolute top-6 right-6 flex items-center gap-3 z-20">\n' +
    '        <button onClick={downloadPdf} disabled={downloading} className="flex items-center gap-2 text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 p-2 px-3 rounded-lg transition-colors border border-emerald-500/20 text-sm font-bold disabled:opacity-50">\n' +
    '          <Download className="w-4 h-4" />\n' +
    '          {downloading ? "Exporting..." : "Download PDF"}\n' +
    '        </button>\n' +
    '        <button onClick={onClose} className="text-slate-500 hover:text-white bg-[#112240] p-2 rounded-lg transition-colors shadow-lg">\n' +
    '          <X className="w-5 h-5" />\n' +
    '        </button>\n' +
    '    </div>\n' +
    '    <div ref={pdfRef} className="bg-[#0a192f] flex-1 flex flex-col">\n' +
    '      <div className="p-6 border-b border-[#1e345e] flex justify-between items-center bg-[#0a192f] z-10 pr-48">\n' +
    '        <div>\n' +
    '          <h2 className="text-xl font-bold text-white">Reconciliation Details</h2>\n' +
    '          <p className="text-sm text-slate-400 mt-1">{format(new Date(localRecon.date), "MMMM dd, yyyy")} - <span className="font-mono text-emerald-400">{localRecon.status}</span></p>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#061121]">';

code = code.replace(regex, newHeader);

const endRegex = /        \)\}\s*<\/div>\s*<\/div>\s*(?:<\/div>\s*)?\);\s*\}/;
code = code.replace(endRegex, '        )}\n      </div>\n    </div>\n  </div>\n  );\n}');

fs.writeFileSync('src/components/ReconModal.tsx', code);
