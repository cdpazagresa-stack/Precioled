import csv, datetime, zipfile, re, unicodedata, json, os
import xml.etree.ElementTree as ET

def normalize(txt):
    if not txt: return ''
    txt = unicodedata.normalize('NFKD', txt).encode('ASCII', 'ignore').decode('utf-8')
    return re.sub(r'[^A-Z0-9 ]', '', re.sub(r'\s+', ' ', txt.strip().upper()))

cutoff_date = datetime.date(2018, 12, 31)

def infer_category(birth_year, is_female=False, existing_team=''):
    if existing_team:
        team_up = existing_team.upper()
        if 'REGIONAL' in team_up or '3' in team_up or 'PREFERENTE' in team_up:
            return 'Senior / Regional'
        if 'JUVENIL' in team_up:
            return 'Juvenil'
        if 'CADETE' in team_up:
            return 'Cadete'
        if 'INFANTIL' in team_up:
            return 'Infantil'
        if 'ALEV' in team_up:
            return 'Alevín'
        if 'BENJAM' in team_up:
            return 'Benjamín'
        if 'PREBENJAM' in team_up:
            return 'Prebenjamín'
        if 'FEMEN' in team_up:
            return 'Femenino'

    if not birth_year:
        return 'General'
    
    if is_female or (existing_team and 'FEMEN' in existing_team.upper()):
        return 'Femenino'
    if birth_year <= 2006:
        return 'Senior / Regional'
    elif birth_year in [2007, 2008, 2009]:
        return 'Juvenil'
    elif birth_year in [2010, 2011]:
        return 'Cadete'
    elif birth_year in [2012, 2013]:
        return 'Infantil'
    elif birth_year in [2014, 2015]:
        return 'Alevín'
    elif birth_year in [2016, 2017]:
        return 'Benjamín'
    elif birth_year == 2018:
        return 'Prebenjamín'
    return 'Senior / Regional'

csv_path = r'C:\Users\yosis\Downloads\Gesdep2526\Deportistas2526.csv'
players = {}

with open(csv_path, 'r', encoding='utf-16le', errors='ignore') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        nombre = row.get('Nombre', '').strip()
        apellidos = row.get('Apellidos', '').strip()
        if not nombre: continue
        
        fnac_str = row.get('Fecha Nacimiento', '').strip()
        birth_date = None
        if fnac_str:
            try:
                parts = fnac_str.split('/')
                if len(parts) == 3:
                    birth_date = datetime.date(int(parts[2]), int(parts[1]), int(parts[0]))
            except Exception:
                pass
        
        if birth_date and birth_date > cutoff_date:
            continue
            
        equipo = row.get('Equipo', '').strip()
        dorsal = re.sub(r'\D', '', row.get('Dorsal', '').strip())
        nif = row.get('NIF Jugador', '').strip()
        
        full_name = f"{nombre} {apellidos}".strip()
        norm_key = normalize(full_name)
        birth_year = birth_date.year if birth_date else None
        
        cat = infer_category(birth_year, 'FEMEN' in equipo.upper(), equipo)
        
        players[norm_key] = {
            'id': f"cdpa-{len(players)+1:03d}",
            'nombre': nombre,
            'apellidos': apellidos,
            'fullName': full_name,
            'birthDate': birth_date.strftime('%d/%m/%Y') if birth_date else fnac_str,
            'birthYear': birth_year,
            'category': cat,
            'team': equipo or cat,
            'dorsal': dorsal or '',
            'dni': nif,
            'source': 'Gesdep'
        }

print(f"Loaded from CSV (born <= 2018): {len(players)}")

xlsx_path = r'C:\Users\yosis\Downloads\AppFNF\Inscripción C.D (version 1).xlsx'
added_from_excel = 0

with zipfile.ZipFile(xlsx_path) as z:
    strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
            text = ''.join(t.text for t in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t.text)
            strings.append(text)
    
    s_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    rows = s_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
    header = []
    for c in rows[0].findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
        t = c.attrib.get('t')
        v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
        val = strings[int(v.text)] if (t == 's' and v is not None and v.text) else (v.text if v is not None else '')
        header.append(val.strip())
    
    for r in rows[1:]:
        row_dict = {}
        for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
            r_ref = c.attrib.get('r', '')
            col_match = re.match(r'([A-Z]+)', r_ref)
            if not col_match: continue
            col_letters = col_match.group(1)
            col_idx = 0
            for ch in col_letters:
                col_idx = col_idx * 26 + (ord(ch) - ord('A') + 1)
            col_idx -= 1
            if col_idx < len(header):
                col_name = header[col_idx]
                t = c.attrib.get('t')
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = strings[int(v.text)] if (t == 's' and v is not None and v.text) else (v.text if v is not None else '')
                row_dict[col_name] = val
        
        nombre = row_dict.get('Nombre jugador@', '').strip()
        apellidos = row_dict.get('Apellidos jugador@', '').strip()
        if not nombre: continue
        
        fnac_val = row_dict.get('Fecha Nacimiento jugador@', '').strip()
        birth_date = None
        if fnac_val:
            try:
                if fnac_val.isdigit():
                    serial = int(fnac_val)
                    birth_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=serial)
                elif '/' in fnac_val:
                    parts = fnac_val.split('/')
                    birth_date = datetime.date(int(parts[2]), int(parts[1]), int(parts[0]))
            except Exception:
                pass
        
        if birth_date and birth_date > cutoff_date:
            continue
            
        full_name = f"{nombre} {apellidos}".strip()
        norm_key = normalize(full_name)
        
        seccion = row_dict.get('Inscripcin en Seccin Club', row_dict.get('Inscripción en Sección Club', ''))
        is_female = 'FEMEN' in seccion.upper()
        birth_year = birth_date.year if birth_date else None
        dni = row_dict.get('DNI/NIE Jugador@ o N Pasaporte', row_dict.get('DNI/NIE Jugador@ o Nº Pasaporte', '')).strip()
        
        if norm_key in players:
            if dni and not players[norm_key].get('dni'):
                players[norm_key]['dni'] = dni
            if birth_date and not players[norm_key].get('birthDate'):
                players[norm_key]['birthDate'] = birth_date.strftime('%d/%m/%Y')
                players[norm_key]['birthYear'] = birth_year
            continue
        
        cat = infer_category(birth_year, is_female, '')
        players[norm_key] = {
            'id': f"cdpa-{len(players)+1:03d}",
            'nombre': nombre,
            'apellidos': apellidos,
            'fullName': full_name,
            'birthDate': birth_date.strftime('%d/%m/%Y') if birth_date else '',
            'birthYear': birth_year,
            'category': cat,
            'team': f"CDPA {cat}",
            'dorsal': '',
            'dni': dni,
            'source': 'InscripcionFNF'
        }
        added_from_excel += 1

print(f"New players added from Excel: {added_from_excel}")
print(f"Total unified players: {len(players)}")

player_list = sorted(players.values(), key=lambda p: (p['category'], p['fullName']))

for idx, p in enumerate(player_list, 1):
    p['id'] = f"CDPA-{idx:03d}"

cat_counts = {}
for p in player_list:
    c = p['category']
    cat_counts[c] = cat_counts.get(c, 0) + 1

print("Categories breakdown:")
for c, cnt in sorted(cat_counts.items()):
    print(f"  {c}: {cnt}")

output_js = r'c:\Users\yosis\Downloads\Precioled\js\jugadores-cdpa.js'
os.makedirs(os.path.dirname(output_js), exist_ok=True)

with open(output_js, 'w', encoding='utf-8') as out:
    out.write("/**\n")
    out.write(" * BASE DE DATOS DE JUGADORES C.D. PEÑA AZAGRESA\n")
    out.write(f" * Consolidada de Gesdep 25/26 y FNF 26/27 (Nacidos <= 31/12/2018)\n")
    out.write(f" * Total Jugadores: {len(player_list)}\n")
    out.write(" */\n\n")
    out.write("window.CDPA_DATABASE = ")
    out.write(json.dumps(player_list, ensure_ascii=False, indent=2))
    out.write(";\n\n")
    out.write("""
window.findCDPAPlayers = function(query, category) {
    if (!window.CDPA_DATABASE) return [];
    var q = (query || '').toLowerCase().trim();
    return window.CDPA_DATABASE.filter(function(p) {
        var matchCat = !category || category === 'TODOS' || p.category === category;
        var matchQ = !q || p.fullName.toLowerCase().includes(q) || (p.dorsal && p.dorsal.toString() === q);
        return matchCat && matchQ;
    });
};

window.getCDPACategories = function() {
    if (!window.CDPA_DATABASE) return [];
    var cats = {};
    window.CDPA_DATABASE.forEach(function(p) { if (p.category) cats[p.category] = true; });
    return Object.keys(cats).sort();
};
""")

print("Successfully written to", output_js)
