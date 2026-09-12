const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/submitted\.amendmentNotes\.map/g, '(submitted.amendmentNotes || []).map');
  content = content.replace(/r\.amendmentNotes\.map/g, '(r.amendmentNotes || []).map');
  content = content.replace(/localRecon\.amendmentNotes\.map/g, '(localRecon.amendmentNotes || []).map');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("Patched " + file);
  }
}

patchFile('src/pages/SupervisorDashboard.tsx');
patchFile('src/pages/AccountantDashboard.tsx');
patchFile('src/pages/AuditorDashboard.tsx');
patchFile('src/components/ReconModal.tsx');

