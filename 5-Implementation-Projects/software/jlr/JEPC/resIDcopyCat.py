#!/usr/bin/env python3

from pathlib import Path
import shutil


SOURCE_ROOT = Path("/c/Program Files/JEPC/applications/JEPC")
DEST_ROOT = Path("/c/temp/jepc")
ID_LIST = Path("xk_range_ids.tsv")


def copy_if_exists(src: Path, dest_dir: Path):
    if src.exists():
        dest_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest_dir / src.name)


def main():
    with ID_LIST.open("r", encoding="utf-8") as f:
        for line in f:
            plid_num = line.strip()
            if not plid_num:
                continue

            plid = f"pl_id_{plid_num}"
            print(f"== {plid} ==")

            src_base = SOURCE_ROOT / "drilldown" / plid

            if not (src_base / "L0").is_dir():
                print("  no drilldown dir, skipping")
                continue

            src_l0 = src_base / "L0"

            dest_base = DEST_ROOT / plid
            dest_l0 = dest_base / "L0"

            dest_l0.mkdir(parents=True, exist_ok=True)

            # find cat_*_L0.xml files
            for cat_file in sorted(src_l0.glob("cat_*_L0.xml")):
                name = cat_file.name

                # id=$(basename "$cat_file" _L0.xml); id=${id#cat_}
                cat_id = name.removesuffix("_L0.xml")
                cat_id = cat_id.removeprefix("cat_")

                shutil.copy2(cat_file, dest_l0 / cat_file.name)

                # tl_<id>_L0.xml
                tl_file = src_l0 / f"tl_{cat_id}_L0.xml"
                copy_if_exists(tl_file, dest_l0)

                # tl_<id>_attributes.xml
                tl_attr = src_base / f"tl_{cat_id}_attributes.xml"
                copy_if_exists(tl_attr, dest_base)

                # Itm_<id>_I*_L0.xml
                pattern = f"Itm_{cat_id}_I*_L0.xml"

                for itm_file in sorted(src_l0.glob(pattern)):
                    shutil.copy2(itm_file, dest_l0 / itm_file.name)

                    # itm_name=$(basename "$itm_file" _L0.xml)
                    itm_name = itm_file.name.removesuffix("_L0.xml")

                    # <itm_name>_attributes.xml
                    attr_file = src_base / f"{itm_name}_attributes.xml"
                    copy_if_exists(attr_file, dest_base)


if __name__ == "__main__":
    main()