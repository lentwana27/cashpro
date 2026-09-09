const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf8');

content = content.replace(
  `                      </button>
            </div>
          </div>
          );
        })}
      </div>
            ) : (`,
  `                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (`
);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log('Fixed quickLogs map');
