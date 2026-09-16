const fs = require('fs');

let code = fs.readFileSync('src/components/ReconModal.tsx', 'utf8');

// Remove the old ref
code = code.replace('<div ref={pdfRef} className="bg-[#0a192f]">\n        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#061121]">', '<div className="bg-[#0a192f]">\n        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#061121]">');

// We want to wrap the inner content (excluding the close/download buttons) in pdfRef.
// The header currently is:
/*
        <div className="p-6 border-b border-[#1e345e] flex justify-between items-center sticky top-0 bg-[#0a192f] z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Reconciliation Details</h2>
            <p className="text-sm text-slate-400 mt-1">{format(new Date(localRecon.date), 'MMMM dd, yyyy')} - <span className="font-mono text-emerald-400">{localRecon.status}</span></p>
          </div>
          <div className="flex items-center gap-3">
*/

// Let's change the structure to:
/*
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-5xl max-h-full shadow-2xl overflow-y-auto flex flex-col relative">
        <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
            <button onClick={downloadPdf} ...> Download </button>
            <button onClick={onClose} ...> X </button>
        </div>
        <div ref={pdfRef} className="bg-[#0a192f]">
          <div className="p-6 border-b border-[#1e345e] flex justify-between items-center bg-[#0a192f]">
            <div>
              <h2 className="text-xl font-bold text-white">Reconciliation Details</h2>
              ...
*/

// Let's just use regex or replace
code = code.replace(
  '<div className="p-6 border-b border-[#1e345e] flex justify-between items-center sticky top-0 bg-[#0a192f] z-10">',
  `<div className="absolute top-6 right-6 flex items-center gap-3 z-20">
            <button onClick={downloadPdf} disabled={downloading} className="flex items-center gap-2 text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 p-2 px-3 rounded-lg transition-colors border border-emerald-500/20 text-sm font-bold disabled:opacity-50">
              <Download className="w-4 h-4" />
              {downloading ? 'Exporting...' : 'Download PDF'}
            </button>
            <button onClick={onClose} className="text-slate-500 hover:text-white bg-[#112240] p-2 rounded-lg transition-colors shadow-lg">
              <X className="w-5 h-5" />
            </button>
        </div>
        <div ref={pdfRef} className="bg-[#0a192f] flex-1 flex flex-col">
          <div className="p-6 border-b border-[#1e345e] flex justify-between items-center bg-[#0a192f] z-10 pr-48">`
);

code = code.replace(
  `          <div className="flex items-center gap-3">
            <button onClick={downloadPdf} disabled={downloading} className="flex items-center gap-2 text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 p-2 px-3 rounded-lg transition-colors border border-emerald-500/20 text-sm font-bold disabled:opacity-50">
              <Download className="w-4 h-4" />
              {downloading ? 'Exporting...' : 'Download PDF'}
            </button>
            <button onClick={onClose} className="text-slate-500 hover:text-white bg-[#112240] p-2 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>`,
  `        </div>`
);

// We need to add "relative" to the outer div
code = code.replace(
  '<div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-5xl max-h-full shadow-2xl overflow-y-auto flex flex-col">',
  '<div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl w-full max-w-5xl max-h-full shadow-2xl overflow-y-auto flex flex-col relative">'
);

fs.writeFileSync('src/components/ReconModal.tsx', code);
