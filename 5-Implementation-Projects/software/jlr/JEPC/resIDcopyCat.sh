#!/bin/bash
set -uo pipefail

SOURCE_ROOT="/c/Program Files/JEPC/applications/JEPC"
DEST_ROOT="/c/Users/tomil/OneDrive - Tomi Lind/_jagports/7.Ideat/Jagports parts sales website/jagports/5-Implementation-Projects/software/jlr/JEPC/JEPCFiles"
ID_LIST="xk_range_ids.txt"

while IFS= read -r plid_num; do
    plid="pl_id_${plid_num}"
    echo "== $plid =="

    src_base="$SOURCE_ROOT/drilldown/$plid"
    [ -d "$src_base/L0" ] || { echo "  no drilldown dir, skipping"; continue; }
    src_l0="$src_base/L0"

    dest_base="$DEST_ROOT/$plid"
    dest_l0="$dest_base/L0"
    mkdir -p "$dest_l0"

    while IFS= read -r cat_file; do
        [ -n "$cat_file" ] || continue
        id=$(basename "$cat_file" _L0.xml); id=${id#cat_}
        cp "$cat_file" "$dest_l0/"

        tl_file="$src_l0/tl_${id}_L0.xml"
        [ -e "$tl_file" ] && cp "$tl_file" "$dest_l0/"

        tl_attr="$src_base/tl_${id}_attributes.xml"
        [ -e "$tl_attr" ] && cp "$tl_attr" "$dest_base/"

        while IFS= read -r itm_file; do
            [ -n "$itm_file" ] || continue
            cp "$itm_file" "$dest_l0/"
            itm_name=$(basename "$itm_file" _L0.xml)
            attr_file="$src_base/${itm_name}_attributes.xml"
            [ -e "$attr_file" ] && cp "$attr_file" "$dest_base/"
        done < <(find "$src_l0" -maxdepth 1 -iname "Itm_${id}_I*_L0.xml" | sort)

    done < <(find "$src_l0" -maxdepth 1 -iname "cat_*_L0.xml" | sort)

done < "$ID_LIST"