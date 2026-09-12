#!/usr/bin/env python3
# import_to_sqlite.py — usage: python import_to_sqlite.py JEPCFiles vieps.sqlite
import sqlite3, sys, re
from pathlib import Path

def parse_records(text):
    records = []
    for line in text.splitlines():
        line = line.strip()
        if not (line.startswith('[') and line.endswith(']')):
            continue
        body = line[1:-1]
        fields, buf, in_str = [], '', False
        for ch in body:
            if ch == "'":
                in_str = not in_str; continue
            if ch == ',' and not in_str:
                fields.append(buf); buf = ''; continue
            buf += ch
        fields.append(buf)
        records.append(fields)
    return records

def init_schema(con):
    con.executescript("""
    CREATE TABLE IF NOT EXISTS jepc_category (
        model_id INTEGER, category_id INTEGER, breadcrumb TEXT, image_file TEXT,
        PRIMARY KEY (model_id, category_id)
    );
    CREATE TABLE IF NOT EXISTS jepc_top_item (
        model_id INTEGER, category_id INTEGER, item_no INTEGER, description TEXT,
        PRIMARY KEY (model_id, category_id, item_no)
    );
    CREATE TABLE IF NOT EXISTS jepc_item_row (
        model_id INTEGER, category_id INTEGER, item_no INTEGER,
        parent_id INTEGER, row_id INTEGER, description TEXT,
        catentry_id INTEGER, part_number TEXT, is_dfs INTEGER, is_superseded INTEGER,
        is_classic INTEGER, internal_part_no TEXT, qty_or_state TEXT, application_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS jepc_attribute_raw (
        key_id INTEGER, raw_group TEXT, raw_value TEXT, except_flag INTEGER, extra TEXT,
        source_file TEXT
    );
    """)

def import_pl_id_folder(con, folder: Path):
    plid = folder.name  # e.g. pl_id_3187
    model_id = int(plid.split('_')[-1])

    for cat_file in folder.glob("L0/cat_*_L0.xml"):
        m = re.match(r"cat_M(\d+)_C(\d+)_L0\.xml", cat_file.name)
        if not m: continue
        cat_id = int(m.group(2))
        lines = parse_records(cat_file.read_text(encoding='latin-1'))
        breadcrumb = lines[0][0] if lines else None
        image_file = lines[1][0] if len(lines) > 1 else None
        con.execute("INSERT OR REPLACE INTO jepc_category VALUES (?,?,?,?)",
                    (model_id, cat_id, breadcrumb, image_file))

        tl_file = folder / "L0" / f"tl_M{model_id}_C{cat_id}_L0.xml"
        if tl_file.exists():
            for row in parse_records(tl_file.read_text(encoding='latin-1')):
                if len(row) == 2:
                    con.execute("INSERT OR REPLACE INTO jepc_top_item VALUES (?,?,?,?)",
                                (model_id, cat_id, int(row[0]), row[1]))

        for itm_file in folder.glob(f"L0/Itm_M{model_id}_C{cat_id}_I*_L0.xml"):
            im = re.match(rf"Itm_M{model_id}_C{cat_id}_I(\d+)_L0\.xml", itm_file.name)
            item_no = int(im.group(1)) if im else None
            for r in parse_records(itm_file.read_text(encoding='latin-1')):
                if len(r) == 12:
                    con.execute("""INSERT INTO jepc_item_row VALUES
                        (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                        (model_id, cat_id, item_no, int(r[0]), int(r[1]), r[2],
                         int(r[3] or 0), r[4], int(r[5] or 0), int(r[6] or 0),
                         int(r[7] or 0), r[8], r[10], int(r[11] or 0)))

        for attr_file in folder.glob(f"Itm_M{model_id}_C{cat_id}_I*_attributes.xml"):
            for line in attr_file.read_text(encoding='latin-1').splitlines():
                line = line.strip()
                if ',[' not in line: continue
                key_part, rest = line.split(',', 1)
                for m2 in re.finditer(r"\[([^\]]+)\]", rest):
                    parts = m2.group(1).split(',')
                    con.execute("INSERT INTO jepc_attribute_raw VALUES (?,?,?,?,?,?)",
                        (int(key_part), parts[0], parts[1] if len(parts)>1 else None,
                         int(parts[2]) if len(parts)>2 and parts[2].strip().lstrip('-').isdigit() else None,
                         ','.join(parts[3:]) if len(parts)>3 else None,
                         attr_file.name))

def main():
    root, db_path = Path(sys.argv[1]), sys.argv[2]
    con = sqlite3.connect(db_path)
    init_schema(con)
    for folder in sorted(root.glob("pl_id_*")):
        print(f"importing {folder.name}")
        import_pl_id_folder(con, folder)
    con.commit()
    con.close()

if __name__ == '__main__':
    main()