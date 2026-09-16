const fs = require('fs');
let code = fs.readFileSync('src/pages/DirectorDashboard.tsx', 'utf8');

const oldButtons = `<div className="flex items-center gap-2">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 bg-[#112240] hover:bg-[#1a2d53] border border-[#1e345e] rounded-lg text-sm font-medium text-white shadow-lg transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              CSV
            </button>
            <button 
              onClick={exportBranchDataToExcel}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium text-white shadow-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button 
              onClick={exportBranchDataToPdf}
              className="flex items-center gap-2 px-3 py-2 bg-rose-500 hover:bg-rose-600 rounded-lg text-sm font-medium text-white shadow-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>`;

const newButton = `<div className="flex items-center gap-2">
            <button 
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium text-white shadow-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Advanced Export
            </button>
          </div>`;

code = code.replace(oldButtons, newButton);

const modalRender = `      {showRates && (
        <ExchangeRatesModal rates={rates} onClose={() => setShowRates(false)} onUpdate={loadData} />
      )}`;

const newModalRender = `      {showRates && (
        <ExchangeRatesModal rates={rates} onClose={() => setShowRates(false)} onUpdate={loadData} />
      )}
      <ExportReportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
        reconciliations={reconciliations} 
        branches={branches} 
      />`;

code = code.replace(modalRender, newModalRender);
fs.writeFileSync('src/pages/DirectorDashboard.tsx', code);
