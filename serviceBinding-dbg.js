function initModel() {
	var sUrl = "/sap/opu/odata/sap/ZPPG_PR01_04_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}