# ============================================================
# class jpecFrame(MyFrame):   (main application frame)
# ============================================================

class jpecFrame:  # (MyFrame) - trimmed to the relevant methods

    # ---- original source lines ~632-658 ----
    def Create_Tables(self):
        con = sl.connect(self.sDatabaseFilename)
        with con:
            con.execute("""
                CREATE TABLE IF NOT EXISTS myCars (
	                name	TEXT UNIQUE,
	                year	INTEGER,
	                modelname	TEXT,
	                modelnumber	INTEGER NOT NULL,
	                notes	TEXT,
	                vin	TEXT,
                    modifiedtime TIMESTAMP,
                    selectedtime TIMESTAMP,
	                PRIMARY KEY(name)
                );
            """)
            con.execute("""
                CREATE TABLE IF NOT EXISTS parts (
                    description TEXT,
                    partnumber  TEXT,
                    model       TEXT,
                    category    TEXT 
                );
            """)
        con.close

    # ---- original source lines ~1129-1193 ----
    def CreateFlatPartList(self, iModel):
        sModel = str(iModel)

        # EPC "drilldown" folder for this model, level 0
        sDir = self.EPC_Root_Folder + "drilldown/pl_id_" + sModel + "/L0"
        directory = os.fsencode(sDir)

        myListOfRealParts = []

        # Walk every "table-of-contents" XML file for this model
        # (filenames look like tl_M<model>_C<category>_L0.xml)
        for file in os.listdir(directory):
            filename = os.fsdecode(file)

            if not filename.endswith(".xml"):
                continue
            if not filename.startswith("tl_M"):
                continue

            # Derive the part-category code from the filename
            sPartCategory = filename.replace("tl_M" + sModel + "_C", "")
            sPartCategory = sPartCategory.replace("_L0.xml", "")

            # Read the XML "table of contents" for this category
            tlfile = codecs.open(sDir + "/" + filename, mode="r", encoding="utf-8")
            tree = ET.parse(tlfile)
            root = tree.getroot()
            tlfile.close

            # The XML root's text is a newline-separated list of Python-literal
            # tuples/lists (one per part-group entry); first line is a header
            # and is discarded.
            listPartsTemp = root.text.splitlines()
            listPartsTemp.pop(0)

            mylistOfPartLists = []
            for sPartRecord in listPartsTemp:
                sPartRecord = self.fixCSV(sPartRecord)
                mylistOfPartLists.append(ast.literal_eval(sPartRecord))

            # For each part-group entry, open its per-item detail XML
            # (Itm_M<model>_C<category>_I<id>_L0.xml) if present, and flatten
            # every real part it contains into myListOfRealParts.
            for Part in mylistOfPartLists:
                sPartDetailFileName = (
                    sDir + "/" + "Itm_M" + sModel + "_C" + sPartCategory
                    + "_I" + str(Part[0]) + "_L0.xml"
                )

                if not os.path.exists(sPartDetailFileName):
                    continue

                myTempListOfRealParts = self.ConvertPartItmemFileIntoList(
                    sPartDetailFileName, Part[0], Part[1], sModel, sPartCategory
                )

                for tmp in myTempListOfRealParts:
                    myListOfRealParts.append(tmp)

        return myListOfRealParts

    # ---- original source lines ~1199-1208 ----
    def saveRealPartsToDatabase(self, ListOfParts):
        con = sl.connect(self.sDatabaseFilename)

        sql = "INSERT INTO parts (description, partnumber, model,category) values(?, ?, ? , ?)"

        with con:
            con.executemany(sql, ListOfParts)
        con.close

    # ---- original source lines ~1212-1218 ----
    def CountPartsInDB(self, sModel):
        con = sl.connect(self.sDatabaseFilename)
        cur = con.cursor()
        cur.execute("SELECT COUNT(*) from parts where model='" + str(sModel) + "'")
        cur_result = cur.fetchone()
        rows = cur_result[0]
        con.close
        return rows

    # ---- original source lines ~1222-1225 ----
    def DeletePartsInDB(self, sModel):
        con = sl.connect(self.sDatabaseFilename)
        with con:
            con.execute("DELETE from parts where model='" + str(sModel) + "'")
        con.close


# ============================================================
# class ManagePartsDB_Class(jPartManageSearchDBDialog_Class):
#   ("Manage Search Database" dialog - drives the flow above)
# ============================================================

class ManagePartsDB_Class:  # (jPartManageSearchDBDialog_Class) - trimmed

    # ---- original source lines ~2026-2032 ----
    def __init__(self, *args, **kwds):
        jPartManageSearchDBDialog_Class.__init__(self, *args, **kwds)
        self.Title = "Search Database Management"
        self.partsDBFile = ""
        self.CreatePopupMenu()
        self.list_ctrl_Models.SetColumnWidth(1, 0)

    # ---- original source lines ~2078-2083 ----
    def GetCurrentCounts(self):
        num_rows = self.list_ctrl_Models.GetItemCount()
        for row in range(num_rows):
            modelnum = self.list_ctrl_Models.GetItemText(row, 1)
            partcount = app.frame.CountPartsInDB(modelnum)
            self.list_ctrl_Models.SetStringItem(row, 2, str(partcount))

    # ---- original source lines ~2088-2103 ----
    def buttonclic_BuildAll(self, event):
        MessageBox(
            "Warning: About to rebuild search database for all models of car. "
            "This will take a long time!"
        )
        num_rows = self.list_ctrl_Models.GetItemCount()
        for row in range(num_rows):
            modelnum = self.list_ctrl_Models.GetItemText(row, 1)

            mylist = app.frame.CreateFlatPartList(modelnum)
            app.frame.DeletePartsInDB(modelnum)
            app.frame.saveRealPartsToDatabase(mylist)

            partcount = app.frame.CountPartsInDB(modelnum)
            self.list_ctrl_Models.SetStringItem(row, 2, str(partcount))
        event.Skip()

    # ---- original source lines ~2106-2112 ----
    def buttonClick_DeleteAll(self, event):
        num_rows = self.list_ctrl_Models.GetItemCount()
        for row in range(num_rows):
            modelnum = self.list_ctrl_Models.GetItemText(row, 1)

            app.frame.DeletePartsInDB(modelnum)

            partcount = app.frame.CountPartsInDB(modelnum)
            self.list_ctrl_Models.SetStringItem(row, 2, str(partcount))
        event.Skip()
