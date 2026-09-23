"""
REFERENCE ONLY — not Jagports production importer code.

This file exists solely as third-party/reconstructed research evidence. Production
Jagports importer code must not import, execute, package, or depend on this module
at runtime. Reusable findings belong in the canonical JEPC research/specification
documents and production behavior is implemented independently.

Reconstructed from jPart.exe (JPEC2_Main.pyc), part 2: menu / category-tree
file-reading code. Extracted the same way as before - located by name in
the bytecode's code-object tree, disassembled with xdis, hand-translated
back to Python. Original source line numbers kept in comments.

This batch exists to check the DataImporter's 8-path list
(DataImporter_Runtime.mjs bundlePaths()) against what jPart actually reads.
See the notes at the bottom for the comparison result.
"""

class jpecFrame:  # (MyFrame) - continued, menu/category-related methods

    # ---- original source lines ~209-232 ----
    def ReadOptions(self):
        if os.path.exists(self.sOptionsFilename):
            data = ET.parse(self.sOptionsFilename)
            root = data.getroot()
            header = root.find('header')

            tlmf = header.find('TopLevelMenuFile')
            self.sTopMenuFile = tlmf.text

            jdf = header.find('JEPCDataFolder')
            self.EPC_Root_Folder = jdf.text

            lsl = header.find('LastShoppingList')
            if lsl != None:
                self.lastShoppingList = lsl.text
        else:
            # Fallback defaults if no options.xml exists yet
            sDefaultTopLevelMenu = "C:/JEPC/applications/JEPC/menus/L0/models_l_id_0.xml"
            sDefaultJEPCRoot = "C:/JEPC/applications/JEPC/"
            if os.path.exists(sDefaultTopLevelMenu):
                self.sTopMenuFile = sDefaultTopLevelMenu
                self.EPC_Root_Folder = sDefaultJEPCRoot
            self.save_Options()

    # ---- original source lines ~760-822+ (model menu -> Models dropdown) ----
    def create_ModelSelectionMenu(self):
        self.listOfModelLists = []

        # self.sTopMenuFile comes from options.xml (TopLevelMenuFile), or
        # defaults to ".../menus/L0/models_l_id_0.xml" - it is NOT derived
        # from model/category/language the way the other files below are.
        target_file = codecs.open(self.sTopMenuFile, mode="r", encoding="utf-8")
        tree = ET.parse(target_file)
        root = tree.getroot()

        # Same "Data element wrapping newline-separated Python-literal rows"
        # format as everywhere else in this app: [id, parent, 'label', ...]
        listTemp = root.text.splitlines()
        listTemp.pop(0)  # header line

        for sModelRecord in listTemp:
            self.listOfModelLists.append(ast.literal_eval(sModelRecord))

        # ... builds the "Models" menu / hierarchy from listOfModelLists
        # (tree-building / wx.Menu wiring omitted - not part of file I/O)

    # ---- original source lines ~880-897 ----
    def Populate_PartCategoryTree(self):
        self.tree_ctrl_PartsCategories.DeleteAllItems()
        self.listOfPartCategoryLists.clear()

        sFilePartCategories = (
            self.EPC_Root_Folder + "menus/L0/pl_id_"
            + ascii(self.currentModelNumber) + "_l_id_0.xml"
        )

        target_file = codecs.open(sFilePartCategories, mode="r", encoding="utf-8")
        tree = ET.parse(target_file)
        root = tree.getroot()
        target_file.close

        listTemp = root.text.splitlines()
        # ... (pop header, ast.literal_eval each row, same pattern as above,
        #      populates self.listOfPartCategoryLists / the category tree)

    # ---- original source lines ~1004-1085 ----
    def Populate_PartsTree(self, myPartCategory):
        sFilePartCategory = (
            self.EPC_Root_Folder + "drilldown/pl_id_" + ascii(self.currentModelNumber)
            + "/L0/cat_M" + ascii(self.currentModelNumber)
            + "_C" + ascii(myPartCategory[0]) + "_L0.xml"
        )
        target_file = codecs.open(sFilePartCategory, mode="r", encoding="utf-8")
        tree = ET.parse(target_file)
        root = tree.getroot()
        target_file.close

        listTemp = root.text.splitlines()
        listTemp.pop(0)

        # listTemp[1] holds the diagram image/xml basenames for this category
        sImageFilename = listTemp[1]
        sImageFilename = self.EPC_Root_Folder + "flash/images/" + sImageFilename.strip("[]") + ".jpg"
        sXMLFilename = listTemp[1]
        sXMLFilename = self.EPC_Root_Folder + "flash/xml/" + sXMLFilename.strip("[]") + ".xml"

        # ... loads sImageFilename into the parts-diagram canvas (wx.Image /
        #     FloatCanvas) - not related to the search index.

        sFilePartNames = (
            self.EPC_Root_Folder + "drilldown/pl_id_" + ascii(self.currentModelNumber)
            + "/L0/tl_M" + ascii(self.currentModelNumber)
            + "_C" + ascii(myPartCategory[0]) + "_L0.xml"
        )
        target_file = codecs.open(sFilePartNames, mode="r", encoding="utf-8")
        tree = ET.parse(target_file)
        root = tree.getroot()
        target_file.close

        listPartsTemp = root.text.splitlines()
        listPartsTemp.pop(0)

        self.listOfPartLists = []
        for sPartRecord in listPartsTemp:
            self.listOfPartLists.append(ast.literal_eval(sPartRecord))

        for Part in self.listOfPartLists:
            tempitem = self.listtree_parts.AppendItem(
                self.PartsRoot, "[" + ascii(Part[0]) + "] " + Part[1],
                wx.NO_IMAGE, wx.NO_IMAGE
            )
            self.AddPartTree(tempitem, Part, myPartCategory[0])

        self.update_parts_tree_from_shopping_list()
        self.add_hotspots_to_canvas(sXMLFilename)
        self.currentPartCategory = ascii(myPartCategory[0])

    # ---- original source lines ~933-976 ----
    def AddPartTree(self, parenttreeitem, Part, PartCategoryNum):
        # NOTE: lowercase "itm_M" here, vs. uppercase "Itm_M" used by
        # CreateFlatPartList / ConvertPartItmemFileIntoList. Same file on a
        # case-insensitive filesystem (Windows), but a real difference in
        # the literal string constant baked into the app.
        sFilePartFile = (
            self.EPC_Root_Folder + "drilldown/pl_id_" + ascii(self.currentModelNumber)
            + "/L0/itm_M" + ascii(self.currentModelNumber)
            + "_C" + ascii(PartCategoryNum) + "_I" + ascii(Part[0]) + "_L0.xml"
        )
        target_file = codecs.open(sFilePartFile, mode="r", encoding="utf-8")
        tree = ET.parse(target_file)
        root = tree.getroot()
        target_file.close

        listTemp = root.text.splitlines()
        listTemp.pop(0)

        self.PartComponents = []
        for sPartrecord in listTemp:
            self.PartComponents.append(ast.literal_eval(self.fixCSV(sPartrecord)))

        # ... walks self.PartComponents to build the sub-part tree under
        #     parenttreeitem (GUI tree population, not search-index related)

    # ---- original source lines ~1274-1328 ----
    def ConvertPartItmemFileIntoList(self, sPartDetailFileName, sPartId, sBaseDescription, sModel, sCategory):
        item_file = codecs.open(sPartDetailFileName, mode="r", encoding="utf-8")
        tree = ET.parse(item_file)
        root = tree.getroot()
        item_file.close

        listTemp = root.text.splitlines()
        listTemp.pop(0)

        myPartComponents = []
        for sPartrecord in listTemp:
            sPartrecord = self.fixCSV(sPartrecord)
            myPartComponents.append(ast.literal_eval(sPartrecord))

        # Roll up child-component descriptions (myComponent[3] > 0) onto the
        # matching parent record's description field (index 2), walking
        # backwards through myPartComponents to build the full description
        # chain.
        for myComponent in myPartComponents:
            if myComponent[3] > 0:
                sDescription = myComponent[2]
                if str(myComponent[0]) == str(sPartId):
                    myComponent[2] = sBaseDescription + myComponent[2]
                    continue
                sParent = str(myComponent[0])
                bAtTop = False
                while not bAtTop:
                    for tempComponent in reversed(myPartComponents):
                        if str(tempComponent[1]) == sParent:
                            sDescription = tempComponent[2] + " " + sDescription
                            sParent = str(tempComponent[0])
                            if str(sPartId) == sParent:
                                bAtTop = True
                    myComponent[2] = sBaseDescription + " " + sDescription

        # Build the flat (description, partnumber, model, category) rows -
        # this is what feeds saveRealPartsToDatabase()'s INSERT.
        myRealParts = []
        for myComponent in reversed(myPartComponents):
            if myComponent[3] > 0:
                tmpRealPart = []
                tmpRealPart.append(myComponent[2].strip())   # description
                tmpRealPart.append(myComponent[4])            # partnumber
                tmpRealPart.append(sModel)                    # model
                tmpRealPart.append(sCategory)                 # category
                myRealParts.append(tmpRealPart)

        return myRealParts

    # ---- original source lines ~1100-1109 ----
    def fixCSV(self, sInput):
        # Loosens up malformed rows before ast.literal_eval: bare double
        # quotes are stripped, and if the row is actually single-quoted
        # (more than 2 apostrophes), those apostrophe-delimited fields are
        # converted to double-quoted so literal_eval can parse them.
        sDoubleQuotesRemoved = sInput.replace('"', "in")
        if sInput.count("'") > 2:
            sResult = str(sDoubleQuotesRemoved).replace("',", '",')
            sResult = str(sResult).replace(",'", ',"')
            sResult = str(sResult).replace("']", '"]')
            return sResult
        return sDoubleQuotesRemoved


"""
============================================================
Comparison vs. DataImporter_Runtime.mjs -> bundlePaths()
============================================================

JS path (language=0, as coded)                                          | Confirmed against jPart source?
------------------------------------------------------------------------|----------------------------------------------
1. menus/models_l_id_0.xml                                              | MISMATCH. Real default is
                                                                         |   menus/L0/models_l_id_0.xml   (extra "L0/"
                                                                         |   folder), and in practice this path isn't a
                                                                         |   fixed template at all - it's read verbatim
                                                                         |   from options.xml's <TopLevelMenuFile>, which
                                                                         |   the user can point anywhere.
2. menus/L{language}/pl_id_{model}_l_id_{language}.xml                  | CONFIRMED - matches Populate_PartCategoryTree's
                                                                         |   "menus/L0/pl_id_<model>_l_id_0.xml" exactly
                                                                         |   for language=0.
3. menus/pl_id_{model}_attributes.xml                                   | NOT FOUND. No "_attributes.xml" string exists
                                                                         |   anywhere in JPEC2_Main.pyc. jPart doesn't
                                                                         |   read this file.
4. drilldown/pl_id_{model}/L{language}/cat_M{model}_C{category}_L{lang}.xml | CONFIRMED - matches Populate_PartsTree's
                                                                         |   "drilldown/pl_id_<model>/L0/cat_M<model>_C
                                                                         |   <category>_L0.xml" for language=0.
5. drilldown/pl_id_{model}/L{language}/tl_M{model}_C{category}_L{lang}.xml  | CONFIRMED - matches both CreateFlatPartList
                                                                         |   and Populate_PartsTree.
6. drilldown/pl_id_{model}/L{language}/Itm_M..._I{item}_L{lang}.xml     | CONFIRMED for CreateFlatPartList /
                                                                         |   ConvertPartItmemFileIntoList (uppercase
                                                                         |   "Itm_M"). Note AddPartTree uses lowercase
                                                                         |   "itm_M" for the same file - only matters on
                                                                         |   a case-sensitive filesystem.
7. drilldown/pl_id_{model}/tl_M{model}_C{category}_attributes.xml       | NOT FOUND. No "_attributes.xml" string
                                                                         |   anywhere in the module.
8. drilldown/pl_id_{model}/Itm_..._I{item}_attributes.xml               | NOT FOUND. Same as above.

Also: jPart reads two more files per part category that aren't in
bundlePaths() at all - the diagram image (flash/images/<name>.jpg) and its
hotspot XML (flash/xml/<name>.xml), named from the second field of the
cat_M...xml row. Irrelevant to search-index building, but relevant if the
importer is meant to eventually cover "media processing" (which its own
help text lists as not-yet-implemented).

Net: of the 8 checked paths, 4 are confirmed correct (#2, #4, #5, #6), 1 is
subtly wrong (#1 - missing "L0/" and, more importantly, not actually a
fixed path), and 3 don't correspond to anything jPart reads (#3, #7, #8).
And regardless of path correctness, none of this reconstructed code is
wired up to actually parse/import the data yet - that's still the gap
noted last time (saveRealPartsToDatabase / INSERT is unimplemented).
"""
