#!/usr/bin/env python3
# resolve_range_ids.py — usage: python resolve_range_ids.py models_l_id_0.xml "Daimler"
import sys

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

    matched_groups = [(i, n) for (i, p, n) in records
                       if p == 10001 and pattern.lower() in n.lower()]
    print(f"# matched top-level groups for '{pattern}':", file=sys.stderr)
    for gid, gname in matched_groups:
        print(f"#   {gid}  {gname}", file=sys.stderr)

    # children[parent_id] -> list of (own_id, name)
    children = {}
    for i, p, n in records:
        children.setdefault(p, []).append((i, n))

    # collect EVERY descendant at any depth, not just direct children
    seen_ids = set()
    def walk(pid):
        for cid, cname in children.get(pid, []):
            if cid in seen_ids:
                continue
            seen_ids.add(cid)
            print(f"{cid}\t{cname}")
            walk(cid)  # recurse — don't assume only 2 levels

    for gid, _ in matched_groups:
        walk(gid)

if __name__ == '__main__':
    main()