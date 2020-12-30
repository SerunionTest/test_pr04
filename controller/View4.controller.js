var userId,
	Intid = -1;
var oDataModel;
var expandedNodes = [];
var gvBindingObject;
var BapiErrors,
	executePress;
 
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/Device",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/Dialog",
	"sap/m/ButtonType",
	"sap/m/Button"

], function (Controller, Device, Filter, FilterOperator, Sorter, Toast, Fragment, MessageToast, MessageBox, Dialog, ButtonType, Button) {
	"use strict";

	return Controller.extend("pr0104.pr0104.controller.View4", {
		onInit: function () {

			userId = Math.floor(Math.random() * 1000000); //Id to store the data in case the same user is being used in multiple sessions.

			//Get the current day, and set the value to the DatePicker date
			var dateToday = new Date();
			//Set the hour to midday to prevent errors while 
			dateToday.setDate(dateToday.getDate());
			dateToday.setHours(12);

			this.getView().byId("filterDatePicker").setDateValue(dateToday);
			//Hide filter configuration button
			this.getView().byId("filterBar").setShowFilterConfiguration(false);

			// Keeps reference to any of the created sap.m.ViewSettingsDialog-s in this sample
			this._mViewSettingsDialogs = {};

			//Set the center to G896
			this.getView().byId("input_werks").setValue("G896");

			//Prepare the data to be shown in the table
			this.readFile();
			this.DisableParents();
			//Wait till the model is loaded
			/*var oModel = this.getView().getModel("nodeModel");
			oModel.attachRequestCompleted(function (oEvent) {
				debugger;
				//Disable selection of parent nodes
				this.DisableParents();
			});*/

			this._oOrdenFilter = null;
			this._oMatnrFilter = null;
			this._oMaktxFilter = null;
			//Set the correct status icon color
			//var oTable = this.byId("TreeTable");
			//	var	oBinding = oTable.getBinding("rows");
			//	var nodes = oTable.getRows();

		},

		onAfterRendering: function () {
			var oTreeTable = this.getView().byId("TreeTable");
			/*oTreeTable.expand(0);
			oTreeTable.expand(1);
			oTreeTable.expand(2);*/
			//oTreeTable.expandToLevel(1); //number of the levels of the tree table.
		},

		expandNodes: function () {
			var nodesToExpand = [];
			var oTreeTable = this.getView().byId("TreeTable");
			var i = 0;
			var x = oTreeTable.getContextByIndex(i);
			while (typeof (x) != "undefined") {

				for (var k = 0; k < expandedNodes.length; k++) {
					if (x.sPath == expandedNodes[k]) {
						nodesToExpand.push(i);
					}
				}
				i++;
				x = oTreeTable.getContextByIndex(i);
			}

			//Expand all the nodes that were expanded before:
			oTreeTable.expand(nodesToExpand);

		},

		readFile: function () {
			var self = this;
			var oGlobalBusyDialog = new sap.m.BusyDialog();
			oGlobalBusyDialog.open();
			//load the data from the JSON file
			oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZPPG_PR01_04_SRV");

			var oFilter = [];
			oFilter.push(new Filter("Werks", sap.ui.model.FilterOperator.EQ, this.getView().byId("input_werks").getValue()));
			/*			oFilter.push(new Filter("Intid", sap.ui.model.FilterOperator.EQ, Intid));
						Intid++;
						oFilter.push(new sap.ui.model.Filter("Userid", sap.ui.model.FilterOperator.EQ, userId));*/

			//Get Date filter
			var datefilter = new Date(this.getView().byId("filterDatePicker").getDateValue());

			if (datefilter != "") {
				oFilter.push(new Filter("Gstrs", FilterOperator.EQ, datefilter));
			}
			oDataModel.read("/AbatimientoInfoSet", {
				filters: oFilter,
				success: function (oData, response) {
					oGlobalBusyDialog.close();
					//var oResults = oData.results;
					var flatData = null;
					//inModel.setData(oData.results);
					if (oData.results) {
						flatData = oData.results;
					}
					var deepData = self.transformTreeData(flatData);
					self.setModelData(deepData);

				},
				error: function (oEvt) {
					oGlobalBusyDialog.close();
				}
			});
		},

		transformTreeData: function (nodesIn) {

			var nodes = []; //'deep' object structure
			var nodeMap = {}; //'map', each node is an attribute

			if (nodesIn) {

				var nodeOut;
				var parentOrgeh;

				for (var i = 0; i < nodesIn.length; i++) {
					var nodeIn = nodesIn[i];

					nodeOut = {
						/*status: nodeIn.Status,
						orden: nodeIn.Orden,
						material: nodeIn.Material,
						id: nodeIn.Nodeid,
						description: nodeIn.Description,
						muestra: nodeIn.Muestra,
						quantity: nodeIn.Quantity,
						um: nodeIn.Um,
						horaini: nodeIn.Horaini,
						horafin: nodeIn.Horafin,
						tempfin: nodeIn.Tempfin,
						parentnode: nodeIn.Parentnodeid,
						children: []*/
						status: nodeIn.Status,
						orden: nodeIn.Order,
						material: nodeIn.Matnr,
						id: nodeIn.NodeId,
						description: nodeIn.MatDescription,
						quantity: nodeIn.Quantity,
						um: nodeIn.UOM,
						fechaini: nodeIn.AbatInitDate,
						horaini: (nodeIn.AbatInitTime.ms === 0 ? null : nodeIn.AbatInitTime),
						numCarro: nodeIn.CarroNumber,
						numAbat: nodeIn.AbatNumber,
						fechafin: nodeIn.AbatEndDate,
						horafin: (nodeIn.AbatEndTime.ms === 0 ? null : nodeIn.AbatEndTime),
						tempfin: nodeIn.EndPackTemp,
						comment: nodeIn.Ltxa1,
						vlsch: nodeIn.Vlsch,
						parentnode: nodeIn.ParentNodeId,
						children: []
					};

					//Set the text for the status:
					if (nodeOut.orden == '') {
						switch (nodeOut.status) {
						case "0":
							nodeOut.orden = "Pendiente";
							break;

						case "1":
							nodeOut.orden = "En proceso";
							break;

						case "2":
							nodeOut.orden = "Finalizado";
							break;
						}
					}

					//	parentOrgeh = nodeIn.Parentnodeid;
					parentOrgeh = nodeIn.ParentNodeId;

					//	if ((parentOrgeh != "0") || parentOrgeh.length > 0) {
					if (parentOrgeh != "0") {
						//we have a parent, add the node there
						//NB because object references are used, changing the node
						//in the nodeMap changes it in the nodes array too
						//(we rely on parents always appearing before their children)
						//var parent = nodeMap[nodeIn.Parentnodeid];
						var parent = nodeMap[nodeIn.ParentNodeId];

						if (parent) {
							parent.children.push(nodeOut);
						}
					} else {
						//there is no parent, must be top level
						nodes.push(nodeOut);
					}

					//add the node to the node map, which is a simple 1-level list of all nodes
					nodeMap[nodeOut.id] = nodeOut;
				}
			}
			return nodes;
		},

		setModelData: function (nodes) {
			//store the nodes in the JSON model, so the view can access them
			var nodesModel = new sap.ui.model.json.JSONModel();
			nodesModel.setData({
				nodeRoot: {
					children: nodes
				}
			});
			this.getView().setModel(nodesModel, "nodeModel");
		},

		DisableParents: function () {
			// disable checkboxes
			var tbl = this.getView().byId("TreeTable");
			/*        var tabmod = this.getView().byId("TreeTable").getModel("nodeModel");
			        var header = tbl.$().find('thead');
			        var selectAllCb = header.find('.sapMCb');
			        selectAllCb.remove();
			        var x = tbl.getRows();*/

			tbl.addDelegate({
				onAfterRendering: function () {
					//var xx = $("#container-PR01_02---View2--TreeTable-rowsel0");
					//var oCB = $().find("#container-PR01_02---View2--TreeTable-rowsel0");
					//debugger;
					//var header = this.$().find('thead');
					//var selectAllCb = header.find('.sapMCb');
					//	selectAllCb.remove();
					// 	var x = this.getRows();
					// 	debugger;
					// 	 this.getRows().forEach(function (r) {
					// 	// 	var obj = r.getBindingContext("nodeModel").getObject();
					// 	// 	var enabled = false;
					// 	 	var cb = r.$().find('.sapMCb');
					// 	 	var x = $('#'+ r.sId).find('.sapMCb');
					// 	 //	var y = cb.getAttribute('id');
					// var oCheckBox = sap.ui.getCore().byId("container-PR01_02---View2--TreeTable-rowsel0");
					// 	 	debugger;
					// 	// 	var oCb = sap.ui.getCore().byId(cb.attr('id'));
					// 	// 	oCb.setEnabled(enabled);
					// 	 });
				}
			}, tbl);

			// tbl.addDelegate({
			// 	onAfterRendering: function () {
			// 		var header = this.$().find('thead');
			// 		var selectAllCb = header.find('.sapMCb');
			// 		selectAllCb.remove();

			// 		/*this.getRows().forEach(function (r) {
			// 			var obj = r.getBindingContext("nodeModel").getObject();
			// 			var oparentnode = obj.parentnode;
			// 			var cb = r.$().find('.sapMCb');
			// 			var x = cb.context.id;

			// 			//var oCb = sap.ui.getCore().byId(cb.attr('id'));
			// 			var oCb = sap.ui.getCore().byId(x);
			// 			if (oparentnode == 0) {
			// 				debugger;
			// 				oCb.setVisible(false);
			// 			}
			// 		});*/
			// 	}
			// }, tbl);

			/*        tbl.getItems().forEach(function(r) {
			          var obj = r.getBindingContext().getObject();
			          var oStatus = obj.Status;
			          var cb = r.$().find('.sapMCb');
			          var oCb = sap.ui.getCore().byId(cb.attr('id'));
			          if (oStatus == "Discontinued") {
			            oCb.setEnabled(false);
			          }
			        });*/
		},

		/* ----------------------------------------------------------------------------------------------- */
		/* --------------------- HANDLERS FOR SEARCH HELP IN WERKS OF FILTERBAR -------------------------- */
		/* ----------------------------------------------------------------------------------------------- */

		onSearch: function (oEvent) {
			var sMessage = "Buscando...";
			MessageToast.show(sMessage);
			Intid = -1;
			this._filter();
		},

		handleValueHelp: function (oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment("pr0104.pr0104.view.Dialog", this);
				this.getView().addDependent(this._valueHelpDialog);
			}
			// create a filter for the binding
			this._valueHelpDialog.getBinding("items").filter([new Filter("Werks", sap.ui.model.FilterOperator.StartsWith, sInputValue)]);
			// open value help dialog filtered by the input value
			this._valueHelpDialog.open(sInputValue);
		},

		_handleValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new Filter("Werks", sap.ui.model.FilterOperator.StartsWith, sValue);
			evt.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var productInput = this.byId(this.inputId);
				productInput.setValue(oSelectedItem.getTitle());
			}
			evt.getSource().getBinding("items").filter([]);
		},

		//Create the View Settings Dialog (for filtering and ordering)
		createViewSettingsDialog: function (sDialogFragmentName) {
			var oDialog = this._mViewSettingsDialogs[sDialogFragmentName];
			//		if (this._oDialog) {
			//			this._oDialog.destroy();
			//		}
			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(sDialogFragmentName, this);
				this._mViewSettingsDialogs[sDialogFragmentName] = oDialog;
				if (Device.system.desktop) {
					oDialog.addStyleClass("sapUiSizeCompact");
				}
			}
			return oDialog;
		},

		/* ----------------------------------------------------------------------------------------------- */
		/* --------------------------------- FUNCTIONS FOR TOOLBAR BUTTONS ------------------------------- */
		/* ----------------------------------------------------------------------------------------------- */
		_filter: function () {
			var oFilter = [];
			var self = this;

			oFilter.push(new Filter("Werks", sap.ui.model.FilterOperator.EQ, this.getView().byId("input_werks").getValue()));
			/*			oFilter.push(new Filter("Intid", sap.ui.model.FilterOperator.EQ, Intid));
						Intid++;
						oFilter.push(new sap.ui.model.Filter("Userid", sap.ui.model.FilterOperator.EQ, userId));*/

			//Get Date filter
			var datefilter = new Date(this.getView().byId("filterDatePicker").getDateValue());
			datefilter.setHours(12);

			if (datefilter != "") {
				oFilter.push(new Filter("Gstrs", FilterOperator.EQ, datefilter));
			}
			if (this._oOrdenFilter) {
				oFilter.push(this._oOrdenFilter);
			}
			if (this._oMatnrFilter) {
				oFilter.push(this._oMatnrFilter);
			}
			if (this._oMaktxFilter) {
				oFilter.push(this._oMaktxFilter);
			}

			var oGlobalBusyDialog = new sap.m.BusyDialog();
			oGlobalBusyDialog.open();
			oDataModel.read("/AbatimientoInfoSet", {
				filters: oFilter,
				success: function (oData, response) {
					var flatData = null;
					if (oData.results) {
						oGlobalBusyDialog.close();
						flatData = oData.results;
					}
					var deepData = self.transformTreeData(flatData);
					self.setModelData(deepData);
					self.expandNodes();
				},
				error: function (oEvt) {
					oGlobalBusyDialog.close();
					var flatData = null;
					var deepData = self.transformTreeData(flatData);
					self.setModelData(deepData);
					self.expandNodes();
				}
			});
		},

		filters: function (oEvent) {

			var oColumn = oEvent.getParameter("column");
			oEvent.preventDefault();
			var sValue = oEvent.getParameter("value");

			//Switch to create and store the filters:
			var FilterParam = oColumn.getFilterProperty();
			switch (FilterParam) {
			case "Orden":
				this._oOrdenFilter = new Filter(FilterParam, FilterOperator.EQ, sValue);
				oColumn.setFiltered(true);
				break;

			case "Plnbez":
				this._oMatnrFilter = new Filter(FilterParam, FilterOperator.EQ, sValue);
				oColumn.setFiltered(true);
				break;

			case "Maktx":
				this._oMaktxFilter = new Filter(FilterParam, FilterOperator.EQ, sValue);
				oColumn.setFiltered(true);
				break;
			}

			function clear() {
				oColumn.setFiltered(false);
				var FilterParam = oColumn.getFilterProperty();
				switch (FilterParam) {
				case "Orden":
					this._oOrdenFilter = null;
					break;

				case "Plnbez":
					this._oMatnrFilter = null;
					break;

				case "Maktx":
					this._oMaktxFilter = null;
					break;
				}
				this._filter();
			}

			if (!sValue) {
				clear.apply(this);
				return;
			}

			this._filter();
		},

		handleFilterButtonPressed: function () {
			//Get the view to add the dependency
			var viewSettingsD = this.createViewSettingsDialog("pr0104.pr0104.view.FilterDialog");
			//Once the dependency is added, we can bind the data into the List inside the fragment
			this.getView().addDependent(viewSettingsD);
			//Hide cancel button
			/* eslint-disable sap-no-ui5base-prop */
			viewSettingsD._dialog.mAggregations.endButton.setVisible(false);
			/* eslint-enable sap-no-ui5base-prop */
			viewSettingsD.open();
		},

		handleCommentDialogConfirm: function (oEvent) {
			var commentValue = sap.ui.getCore().byId("textAreaForComment").getValue();
			var inputVlsch = sap.ui.getCore().byId("inputVlsch").getSelectedKey();

			var self = this;

			var lvWerks = this.getView().byId("input_werks").getValue();
			var UpdatePath = ("/ZPPS_PR01_04Set(NodeId=" + gvBindingObject.id + ",Werks='" + lvWerks + "')");
			var updateObject = {
				Status: gvBindingObject.status,
				Order: gvBindingObject.orden,
				Matnr: gvBindingObject.material,
				NodeId: gvBindingObject.nodeId,
				MatDescription: gvBindingObject.description,
				Quantity: gvBindingObject.quantity,
				UOM: gvBindingObject.um,
				AbatInitDate: gvBindingObject.fechaini,
				AbatInitTime: gvBindingObject.horaini,
				CarroNumber: gvBindingObject.numCarro,
				AbatNumber: gvBindingObject.numAbat,
				AbatEndDate: gvBindingObject.fechafin,
				AbatEndTime: gvBindingObject.horafin,
				EndPackTemp: gvBindingObject.tempfin,
				ParentNodeId: gvBindingObject.parentnode,
				Ltxa1: commentValue,
				Vlsch: inputVlsch
			};
			var oGlobalBusyDialog = new sap.m.BusyDialog();
			oGlobalBusyDialog.open();

			oDataModel.update(UpdatePath, updateObject, {
				error: function (err) {
					oGlobalBusyDialog.close();
					//sap.m.MessageBox.error($(err.response.body).find('message').first().text());
					if (err.statusCode === '410') sap.m.MessageBox.error(JSON.parse(err.responseText)["error"]["message"]["value"]);

				},
				success: function (oEvent) {
					oGlobalBusyDialog.close();
					self._filter();
				}
			});
		},

		/* ------------------------------------------------------------------------------------------------ */
		/* ------------------------------------ EVENTS FOR TABLE BUTTONS ---------------------------------- */
		/* ------------------------------------------------------------------------------------------------ */

		onPlayPress: function (oEvent) {
			var time = new Date(); //get the time
			//var oButton = oEvent.getSource(); //Button in the row
			// Get binding context of the button to identify the row where the event is originated
			//var oBindingContext = oButton.getBindingContext("nodeModel");	//Since we have a model name, we need to specify it.
			//var oBindingObject = oBindingContext.getObject();
			var oHbox = oEvent.getSource().getParent(); //Since the button is inside an Hbox, if we want the whole row, we need to get the parent again.
			var oItems = oHbox.getItems(); //Item 0 = button, Item 1 = text.
			oItems[0].setVisible(false); //Set the button invisible
			oItems[1].setVisible(true); //Set the text visible

			var hourFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "HH:mm:ss"
			});
			var hourFormatted = hourFormat.format(time);
			oItems[1].setDateValue(time);

			//Setting current date
			var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "dd.MM.yyyy"
			});
			var currentDate = oDateFormat.format(time);
			var oTable = this.getView().byId("TreeTable");
			var index = oEvent.getSource().getParent().getParent().getIndex();
			var oContext = oTable.getContextByIndex(index);
			var model = oContext.getModel();
			model.setProperty(oContext.getPath() + '/fechafin', currentDate);

			// if (time.getMinutes().toString().length == 1) {
			// 	oItems[1].setText(time.getHours() + ":" + "0" + time.getMinutes());
			// } else {
			// 	oItems[1].setText(time.getHours() + ":" + time.getMinutes());
			// }
			this.onInputChange(oEvent);
		},

		onCataOkPress: function (oEvent) {
			var ToggleButtons = oEvent.getSource().getParent().getItems();
			var isPressed = oEvent.getSource().getPressed();
			var id = oEvent.getSource().getId();
			if (isPressed == false) { //If we unpress the button, we store a zero.
				ToggleButtons[2].setText("0");
			} else { //We set dynamically the value to the Label 2
				for (var i = 0; i < ToggleButtons.length; i++) {
					if (ToggleButtons[i].getId() == id) {
						ToggleButtons[2].setText(i + 1);
					}
				}
			}
			//Unpress both buttons
			ToggleButtons[0].setPressed(false);
			ToggleButtons[1].setPressed(false);
			oEvent.getSource().setPressed(isPressed);

			//Call change event
			this.onInputChange(oEvent);
		},

		onInputChange: function (oEvent) {
			var self = this;
			var oGlobalBusyDialog = new sap.m.BusyDialog();
			oGlobalBusyDialog.open();
			//If the user inputs a value, we need to update the model:
			//var oValue = oEvent.getParameter("value"); //Get the Input Value
			var oItem = oEvent.getSource().getParent(); //Get the Item
			//Check if we are accessing from a taste button.
			if (typeof (oItem.getCells) != "function") {
				oItem = oItem.getParent();
			}
			//var oInput = oEvent.getSource(); //Get the Input
			// var oBindingValue = oInput.getBinding("value"); //Get value binding of Input
			// var oInputPath = oBindingValue.getPath(); //Model Property
			// var oItemPath = oItem.getBindingContext("nodeModel").getPath(); //Item path
			// var oTable = this.getView().byId("TreeTable"); //Get Hold of table
			//oTable.getModel("nodeModel").setProperty(oItemPath + "/" + oInputPath, oValue); //Set the property
			var oBindingContext = oItem.getBindingContext("nodeModel");
			var oBindingObject = oBindingContext.getObject();
			var lvWerks = this.getView().byId("input_werks").getValue();
			var UpdatePath = ("/AbatimientoInfoSet(NodeId=" + oBindingObject.id + ",Werks='" + lvWerks + "')");
			var updateObject = {
				Status: oBindingObject.status,
				Order: oBindingObject.orden,
				Matnr: oBindingObject.material,
				NodeId: oBindingObject.id,
				MatDescription: oBindingObject.description,
				Quantity: oBindingObject.quantity,
				UOM: oBindingObject.um,
				AbatInitDate: oBindingObject.fechaini,
				AbatInitTime: oBindingObject.horaini,
				CarroNumber: oBindingObject.numCarro,
				AbatNumber: oBindingObject.numAbat,
				AbatEndDate: oBindingObject.fechafin,
				AbatEndTime: oBindingObject.horafin,
				EndPackTemp: oBindingObject.tempfin,
				Ltxa1: oBindingObject.comment,
				Vlsch: oBindingObject.vlsch,
				ParentNodeId: oBindingObject.parentnode
			};

			oDataModel.update(UpdatePath, updateObject, {
				error: function (err) {
					oGlobalBusyDialog.close();
					//sap.m.MessageBox.error($(err.response.body).find('message').first().text());
					if (err.statusCode === '410') sap.m.MessageBox.error(JSON.parse(err.responseText)["error"]["message"]["value"]);

				},
				success: function (oEvent) {
					oGlobalBusyDialog.close();
					self._filter();
				}
			});
		},

		onOrdenPress: function (oEvent) {
			//var ToggleButtons = oEvent.getValue();
			if (this._oDialog) {
				this._oDialog.destroy();
			}
			var aufnrval = oEvent.getSource().getText();

			Fragment.load({
				name: "pr0104.pr0104.view.OrdenDialog",
				controller: this
			}).then(function (oDialog) {
				this._oDialog = oDialog;
				this._oDialog.setModel(this.getView().getModel());
				//apply the filter
				var oFilter = new Filter("Order", FilterOperator.EQ, aufnrval);
				var oBinding = this._oDialog.getBinding("items");
				oBinding.filter([oFilter]);
				oBinding.refresh(true);
				this._oDialog.open();
			}.bind(this));
		},

		onCommentPress: function (oEvent) {
			var oTable = oEvent.getSource().getParent();
			var oObject = oTable.getBindingContext("nodeModel").getObject();
			var ObjectPath = oTable.getBindingContext("nodeModel").sPath;
			gvBindingObject = oObject;
			//Get the view to add the dependency
			var viewSettingsD = this.createViewSettingsDialog("pr0104.pr0104.view.CommentDialog");
			//Once the dependency is added, we can bind the data into the List inside the fragment
			this.getView().addDependent(viewSettingsD);
			var lvcomment = oObject.comment.split(""); //Split using EOT ascii code.
			sap.ui.getCore().byId("textAreaForComment").setValue(lvcomment[1]);
			sap.ui.getCore().byId("inputVlsch").setSelectedKey(lvcomment[0]);

			//Hide cancel button
			/* eslint-disable sap-no-ui5base-prop */
			//viewSettingsD._dialog.mAggregations.endButton.setVisible(false);
			/* eslint-enable sap-no-ui5base-prop */
			viewSettingsD.open();
		},

		handleLiveChange: function (oEvent) {
			var oTextArea = oEvent.getSource(),
				iValueLength = oTextArea.getValue().length,
				iMaxLength = oTextArea.getMaxLength(),
				sState = iValueLength > iMaxLength ? "Error" : "None";

			oTextArea.setValueState(sState);
		},

		OpenStatePress: function (oEvent) {
			var nodeExpanded = oEvent.getParameter("rowContext");
			var sx = expandedNodes.indexOf(nodeExpanded.sPath);
			if (oEvent.getParameter("expanded") == true) {
				expandedNodes.push(nodeExpanded.sPath);
			} else if (expandedNodes.indexOf(nodeExpanded.sPath) != -1) {
				expandedNodes.splice(expandedNodes.indexOf(nodeExpanded.sPath), 1);
			}
		},
		/* ------------------------------------------------------------------------------------------------- */
		/* -------------------------------- HANDLERS FOR FOOTER BAR BUTTONS -------------------------------- */
		/* ------------------------------------------------------------------------------------------------- */

		handleWarning2MessageBoxPress: function (oEvent) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.warning("Los datos no ser\xE1n grabados. Desea cancelar?", {
				actions: [
					MessageBox.Action.YES,
					MessageBox.Action.NO
				],
				styleClass: bCompact ? "sapUiSizeCompact" : "",
				onClose: function (sAction) {
					MessageToast.show("Action selected: " + sAction);
				}
			});
		},

		onEjecutar: function (oEvent) {
			executePress = true; //to count the executions
			BapiErrors = [];
			var oTable = this.byId("TreeTable");
			var selectedindices = oTable.getSelectedIndices();
			var selectedData = [];
			for (var i = 0; i < selectedindices.length; i++) {
				//fetch the data of selected rows by index
				var tableContext = oTable.getContextByIndex(selectedindices[i]);
				var data = oTable.getModel("nodeModel").getProperty(tableContext.getPath());
				selectedData.push(data);
			}
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			if (selectedindices.length === 0) {

				MessageBox.information("Seleccione los platos que cocinó.", {
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				});

			} else {

				if (this._oDialog) {
					this._oDialog.destroy();
				}

				this.getView().getModel().attachBatchRequestCompleted(function (oEvent2) {
					if (executePress == true) {
						executePress = false;
						if (BapiErrors.length == 0) {
							MessageBox.success("Se han ejecutado las entradas seleccionadas.", {
								styleClass: bCompact ? "sapUiSizeCompact" : ""
							});
						} else {
							//var details2 = BapiErrors.join('\n');
							var details2 = "";
							BapiErrors.forEach(function (errormssg) {
								details2 = details2 + errormssg;
							});
							BapiErrors = [];
							MessageBox.error("No se pudieron ejecutar todas las entradas.", {
								title: "Error",
								//id: "messageBoxId2",
								details: details2,
								styleClass: bCompact ? "sapUiSizeCompact" : "",
								contentWidth: "250px"
							});
						}
					}
				});
				for (var j = 0; j < selectedData.length; j++) {
					var oBindingObject = selectedData[j];

					var updateObject = {
						Status: oBindingObject.status,
						Order: oBindingObject.orden,
						Matnr: oBindingObject.material,
						NodeId: oBindingObject.id,
						MatDescription: oBindingObject.description,
						Quantity: oBindingObject.quantity,
						UOM: oBindingObject.um,
						AbatInitDate: oBindingObject.fechaini,
						AbatInitTime: oBindingObject.horaini,
						CarroNumber: oBindingObject.numCarro,
						AbatNumber: oBindingObject.numAbat,
						AbatEndDate: oBindingObject.fechafin,
						AbatEndTime: oBindingObject.horafin,
						EndPackTemp: oBindingObject.tempfin,
						Ltxa1: oBindingObject.comment,
						Vlsch: oBindingObject.vlsch,
						ParentNodeId: oBindingObject.parentnode
					};
					this.getView().getModel().createEntry("/AbatimientoInfoSet", {
						groupId: "group1",
						changeSetId: ("cs" + j),
						properties: updateObject,
						error: function (err) {
							if (err.statusCode === '410') {
								var errorcatched = JSON.parse(err.responseText)["error"]["message"]["value"];
								//If the error is not repeated, add it
								if (BapiErrors.indexOf(errorcatched) == -1) {
									BapiErrors.push(errorcatched);
								}
							}
						}
					});

				}
				this.getView().getModel().submitChanges({
					groupId: "group1"
				});
			}
		},

		onMedida: function (oEvent) {
			var lTable = this.byId("TreeTable").getSelectedIndices();
			if (lTable.length === 0) {
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.information("Seleccione los platos a cambiar la UM.", {
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				});

			} else {
				if (this._oDialog) {
					this._oDialog.destroy();
				}

				var oButton = oEvent.getSource();
				//	if (!this._oDialog) {
				Fragment.load({
					name: "pr0104.pr0104.view.UMDialog",
					controller: this
				}).then(function (oDialog) {
					this._oDialog = oDialog;
					this._oDialog.setModel(this.getView().getModel());
					this._configDialog(oButton);
					this._oDialog.setGrowing(true);
					this._oDialog.open();
				}.bind(this));
			}
		},

		_configDialog: function (oButton) {
			var sCustomConfirmButtonText = oButton.data("confirmButtonText");
			this._oDialog.setConfirmButtonText(sCustomConfirmButtonText);
			// clear the old search filter
			this._oDialog.getBinding("items").filter([]);
			// Set growing property
			var bGrowing = oButton.data("growing");
			this._oDialog.setGrowing(bGrowing === "true");
			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
		},

		handleUMSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("UOM", FilterOperator.StartsWith, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
			oBinding.refresh(true);
		},
		handleUMClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var lvunit = aContexts.map(function (oContext) {
					return oContext.getObject().UOM;
				}).join(", ");
				//	MessageToast.show("You have chosen " + lvunit);
				//Modificamos los elementos de la tabla seleccionados
				var oTable = this.byId("TreeTable");
				var TableIndices = oTable.getSelectedIndices();

				var selectedData = [];
				for (var i = 0; i < TableIndices.length; i++) {
					//fetch the data of selected rows by index
					var tableContext = oTable.getContextByIndex(TableIndices[i]);
					var data = oTable.getModel("nodeModel").getProperty(tableContext.getPath());
					selectedData.push(data);
				}

				if (TableIndices.length === 0) {
					MessageToast.show("Seleccione los platos que desea determinar la UM");
				} else {
					var row;
					for (row = 0; row < selectedData.length; row++) {
						//var m = selectedData[row].getModel("nodeModel");
						oTable.getModel("nodeModel").setProperty(oTable.getContextByIndex(TableIndices[row]).getPath() + "/um", lvunit);
					}
				}
			} else {
				MessageToast.show("No new item was selected.");
			}
			oEvent.getSource().getBinding("items").filter([]);
		}
	});
});