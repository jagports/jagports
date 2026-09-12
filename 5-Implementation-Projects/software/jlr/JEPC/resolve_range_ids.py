#!/usr/bin/env python3
# resolve_range_ids.py — usage: python resolve_range_ids.py models_l_id_0.xml "XK"
import re, sys

def parse_records(text):
    # bracket-delimited, quote-aware split — handles commas inside 'quoted names'
    records = []
    for line in text.splitlines():
        line = line.strip()
        if not (line.startswith('[') and line.endswith(']')):
            continue
        body = line[1:-1]
        fields, buf, in_str = [], '', False
        for ch in body:
            if ch == "'":
                in_str = not in_str
                continue
            if ch == ',' and not in_str:
                fields.append(buf); buf = ''
                continue
            buf += ch
        fields.append(buf)
        if len(fields) == 3:
            own_id, parent_id, name = fields
            records.append((int(own_id), int(parent_id), name))
    return records

def main():
    path, pattern = sys.argv[1], sys.argv[2]
    text = open(path, encoding='latin-1').read()
    records = parse_records(text)

    parent_ids = {p for (_, p, _) in records}
    matched_groups = [(i, n) for (i, p, n) in records
                       if p == 10001 and pattern.lower() in n.lower()]

    print(f"# matched top-level groups for '{pattern}':", file=sys.stderr)
    for gid, gname in matched_groups:
        print(f"#   {gid}  {gname}", file=sys.stderr)

    group_ids = {gid for gid, _ in matched_groups}
    leaves = [(i, n) for (i, p, n) in records
              if p in group_ids and i not in parent_ids]

    for leaf_id, name in leaves:
        print(f"{leaf_id}\t{name}")

if __name__ == '__main__':
    main()