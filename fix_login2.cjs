const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

code = code.replace(
`            </button>
          </form>
          )}`,
`            </button>
          </form>
          )}`
); // oh, it's really )}

// It should be replaced with `)}`
code = code.replace(
`            </button>
          </form>
          )}`,
`            </button>
          </form>
          )}`
);
