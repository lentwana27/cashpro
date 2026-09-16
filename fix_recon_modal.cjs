const fs = require('fs');

let code = fs.readFileSync('src/components/ReconModal.tsx', 'utf8');

// Fix BreakdownSection
code = code.replace(
"      </div>\n      </div>\n    </div>\n  );\n}",
"      </div>\n    </div>\n  );\n}"
);

// Fix end of file
const lastPart = "        )}\n      </div>\n    </div>\n  );\n}";
const newLastPart = "        )}\n      </div>\n      </div>\n    </div>\n  );\n}";

const lastIndex = code.lastIndexOf(lastPart);
if (lastIndex !== -1) {
  code = code.substring(0, lastIndex) + newLastPart;
}

fs.writeFileSync('src/components/ReconModal.tsx', code);
