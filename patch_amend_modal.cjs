const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

if (!content.includes('const [showAmendModal, setShowAmendModal]')) {
    content = content.replace(
        'const [showQuickLog, setShowQuickLog] = useState(false);',
        'const [showQuickLog, setShowQuickLog] = useState(false);\n  const [showAmendModal, setShowAmendModal] = useState(false);\n  const [amendReason, setAmendReason] = useState("");'
    );
}

const reqAmendBtn = `            <button
              onClick={async () => {
                await api.put(\`/reconciliations/\${submitted.id}\`, {
                  status: "AMENDMENT_REQUESTED",
                });
                loadData();
              }}
              className="px-6 py-2 bg-[#112240] hover:bg-[#1a2d53] text-white border border-[#1e345e] rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2 mx-auto"
            >
              Request to Amend
            </button>`;

const newReqAmendBtn = `            <button
              onClick={() => setShowAmendModal(true)}
              className="px-6 py-2 bg-[#112240] hover:bg-[#1a2d53] text-white border border-[#1e345e] rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2 mx-auto"
            >
              Request to Amend
            </button>`;

content = content.replace(reqAmendBtn, newReqAmendBtn);

const amendModalCode = `      {showAmendModal && submitted && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl w-full max-w-sm p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-4">
              Reason for Amendment
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Please provide a detailed reason for requesting an amendment. This will be visible to Accountants and Auditors.
            </p>
            <textarea
              value={amendReason}
              onChange={(e) => setAmendReason(e.target.value)}
              className="w-full bg-[#061121] border border-[#1e345e] rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[100px] mb-4"
              placeholder="E.g., Forgot to log $50 expenses..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAmendModal(false);
                  setAmendReason("");
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                disabled={!amendReason.trim()}
                onClick={async () => {
                  const timestamp = new Date().toLocaleString();
                  const note = \`[\${timestamp}] Amendment Requested: \${amendReason}\`;
                  const updatedNotes = submitted.amendmentNotes ? [...submitted.amendmentNotes, note] : [note];
                  
                  await api.put(\`/reconciliations/\${submitted.id}\`, {
                    status: "AMENDMENT_REQUESTED",
                    amendmentNotes: updatedNotes
                  });
                  setShowAmendModal(false);
                  setAmendReason("");
                  loadData();
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}`;

// Add amend modal before closing tag of main div
content = content.replace('{/* Quick Log Modal */}', amendModalCode + '\n      {/* Quick Log Modal */}');

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
