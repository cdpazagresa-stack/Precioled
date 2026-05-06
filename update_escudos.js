const fs = require('fs');

const data = fs.readFileSync('excel_data.txt', 'utf8');
const lines = data.split('\n');
const teams = [];

for (let i = 2; i < lines.length; i++) { // Skip headers
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split('|');
    if (parts.length >= 4) {
        let name = parts[1].trim();
        let url = parts[3].trim();
        if (name && url) {
            teams.push({
                name: name,
                short: name,
                badgeUrl: url
            });
        }
    }
}

const escudosCode = `/* ============================================================
   ESCUDOS — Team Badge Search & Database
   ============================================================
   Pre-loaded database of Navarra football teams with badge URLs.
   Includes search functionality with autocomplete.
   ============================================================ */

const NAVARRA_TEAMS = ${JSON.stringify(teams, null, 4)};

/**
 * Get badge URL for a team.
 * Uses the pre-defined URL from the database.
 */
function getBadgeUrl(teamName) {
    const team = NAVARRA_TEAMS.find(t => t.name === teamName);
    return team ? team.badgeUrl : getDefaultBadgeSVG(teamName);
}

/**
 * Generate a simple SVG shield as fallback badge
 */
function getDefaultBadgeSVG(teamName = '?') {
    const initial = teamName.charAt(0).toUpperCase();
    return \`data:image/svg+xml,\${encodeURIComponent(\`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
            <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#222"/>
                    <stop offset="100%" style="stop-color:#111"/>
                </linearGradient>
            </defs>
            <path d="M50 5 L95 25 L95 65 Q95 100 50 115 Q5 100 5 65 L5 25 Z" 
                  fill="url(#g)" stroke="#f6ee36" stroke-width="2"/>
            <text x="50" y="70" text-anchor="middle" font-family="Arial" font-size="36" 
                  font-weight="bold" fill="#f6ee36">\${initial}</text>
        </svg>
    \`)}\`;
}

/**
 * Search teams by name (Navarra database)
 * Returns top 10 matches
 */
function searchTeams(query) {
    if (!query || query.length < 2) return [];
    
    const q = query.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    
    return NAVARRA_TEAMS.filter(team => {
        const name = team.name.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
        const short = team.short.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
        return name.includes(q) || short.includes(q);
    }).slice(0, 10).map(team => ({
        ...team
    }));
}

/**
 * Create a custom team (for teams not in the database)
 */
function createCustomTeam(name, badgeUrl = '') {
    return {
        id: null,
        name: name.toUpperCase(),
        short: name.toUpperCase(),
        badgeUrl: badgeUrl || getDefaultBadgeSVG(name)
    };
}
`;

fs.writeFileSync('js/escudos.js', escudosCode);
console.log('escudos.js updated');
