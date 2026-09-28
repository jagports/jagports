#!/bin/bash
set -e

SOURCE_ROOT="/c/Program Files/JEPC/applications/JEPC"
DEST_ROOT="/c/Users/tomil/OneDrive - Tomi Lind/_jagports/7.Ideat/Jagports parts sales website/jagports/5-Implementation-Projects/software/jlr/JEPC/JEPCFiles"

MENUS_SRC="$SOURCE_ROOT/menus/L0"

mkdir -p "$DEST_ROOT/menus"

echo "Copying menus/L0/models_l_id_0.xml"
cp "$MENUS_SRC/models_l_id_0.xml" "$DEST_ROOT/menus/"

shopt -s nullglob
for f in "$MENUS_SRC"/pl_id_*_l_id_0.xml; do
    fname=$(basename "$f")

    echo ""
    echo "== Model: $fname =="
    cp "$f" "$DEST_ROOT/menus/"
    echo "  Copied menus/$fname"

    plid=$(echo "$fname" | sed -E 's/(pl_id_[0-9]+)_l_id_0\.xml/\1/')
    src_l0="$SOURCE_ROOT/drilldown/$plid/L0"
    src_base="$SOURCE_ROOT/drilldown/$plid"
    dest_l0="$DEST_ROOT/drilldown/$plid/L0"
    dest_base="$DEST_ROOT/drilldown/$plid"

    if [ ! -d "$src_l0" ]; then
        echo "  No drilldown dir for $plid, skipping"
        continue
    fi
    mkdir -p "$dest_l0"

    # first available category
    cat_file=$(find "$src_l0" -maxdepth 1 -iname "cat_*_L0.xml" | sort | head -n1)
    if [ -z "$cat_file" ]; then
        echo "  No category files found in $src_l0, skipping"
        continue
    fi

    id=$(basename "$cat_file" _L0.xml)
    id=${id#cat_}
    echo "  Using category ID: $id"

    cp "$cat_file" "$dest_l0/"
    echo "  Copied L0/$(basename "$cat_file")"

    # tl file + its attributes
    tl_file="$src_l0/tl_${id}_L0.xml"
    if [ -e "$tl_file" ]; then
        cp "$tl_file" "$dest_l0/"
        echo "  Copied L0/$(basename "$tl_file")"
    else
        echo "  Missing tl file: tl_${id}_L0.xml"
    fi

    tl_attr="$src_base/tl_${id}_attributes.xml"
    if [ -e "$tl_attr" ]; then
        cp "$tl_attr" "$dest_base/"
        echo "  Copied $(basename "$tl_attr")"
    fi

    # all Itm_<id>_I*_L0.xml + matching attributes
    while IFS= read -r itm_file; do
        [ -n "$itm_file" ] || continue
        cp "$itm_file" "$dest_l0/"
        echo "  Copied L0/$(basename "$itm_file")"

        itm_name=$(basename "$itm_file" _L0.xml)   # Itm_M1002_C1003_I1
        attr_file="$src_base/${itm_name}_attributes.xml"
        if [ -e "$attr_file" ]; then
            cp "$attr_file" "$dest_base/"
            echo "  Copied $(basename "$attr_file")"
        else
            echo "  Missing attributes: $(basename "$attr_file")"
        fi
    done < <(find "$src_l0" -maxdepth 1 -iname "Itm_${id}_I*_L0.xml" | sort)
done

echo ""
echo "Done."

