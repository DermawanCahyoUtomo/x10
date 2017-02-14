var apcom = {
	Date: ko.observable(),
	Amount: ko.observable(),
	ROI: ko.observable(),
	PF: ko.observable(),
	PG: ko.observable(),
	Security: ko.observable(),
	OtherConditions: ko.observableArray([]),
	CommitteeRemarks: ko.observable(),
	RecommendedCondition: ko.observableArray([]),
	RecCondition: ko.observableArray([]),
	Recommendations: ko.observable(),
	isfreezeCA: ko.observable(false),
	LeftAmount: ko.observable(),
	Status: ko.observable(),
	CaStatus: {
		val: ko.observable(),
		SEND: 1,
		SAVE: 0
	}
}

apcom.dataStatus = ko.observableArray(["Awaiting Action", "Approved", "Rejected", "Cancelled", "On Hold", "Sent Back"])

apcom.dcsanctiondatestring = ko.observable("")
apcom.latestStatusStr = ko.observable("")

apcom.dataBasisRecommendation = ko.observableArray([
	{title: "Date", value: ""},
	{title: "Amount", value: ""},
	{title: "ROI", value: ""},
	{title: "PF", value: ""},
	{title: "PG", value: ""},
	{title: "Security", value: ""},
	{title: "Committee Remarks", value: ""},
])

apcom.templateSanction ={
	Id: "",
	CustomerId :0,
	DealNo:"",
	Date: "",
	Amount: "",
	IsNullAmount: false,
	ROI: "",
	IsNullROI: false,
	PF: "",
	PG: "",
	Security: "",
	CommitteeRemarks: "",
	Status: false,
	LatestValue : "Awaiting Action"
}
apcom.sanction = ko.mapping.fromJS(apcom.templateSanction)
apcom.accountCommentFinancials = ko.observable('');
apcom.tempFinalComment = ko.observableArray([
	{title: "Amount", value: 0},
	{title: "RecommendedCondition", value: ''},
	{title: "Recommendations", value: ''}
])
apcom.templateFinalComment = {
	Amount: 0,
	IsNullAmount: false,
	RecommendedCondition: [],
	Recommendations: '',
}
apcom.templateCreditAnalys = {
	Id:"",
	DealNo: '',
	CustomerId: '',
	CreditAnalysRisks : [],
	FinalComment: apcom.templateFinalComment,
}
apcom.dataTempRiskMitigants = ko.observableArray([])
apcom.formCreditAnalyst = ko.mapping.fromJS(apcom.templateCreditAnalys)

apcom.loadCommentData = function(tayp){
	// alert("masuk sini")
	apcom.accountCommentFinancials([])

	var param = {
		DealNo : "", 
		CustomerId: ""
	}
	
	try{
		param.CustomerId = r.customerId().split('|')[0]
	  	param.DealNo = r.customerId().split('|')[1]
	} catch(e){}

	if(param.CustomerId == "" || param.DealNo == ""){
		param.CustomerId = filter().CustomerSearchVal()
		param.DealNo = filter().DealNumberSearchVal() 
	}

	ajaxPost("/accountdetail/getaccountdetailconfirmed", param, function(res){
		var data = res.Data;
		if(data.BorrowerDetails.CommentsonFinancials != null){
			apcom.accountCommentFinancials(data.BorrowerDetails.CommentsonFinancials);
		}else{
			apcom.accountCommentFinancials([""]);
		}
		
	})

	apcom.dataBasisRecommendation([])
	apcom.tempFinalComment([])

	ajaxPost("/approval/getdcandcreditanalys" + (tayp != undefined ? tayp : ""), param, function(res){
		var data = res;
	    if(res.success != false){
			apcom.dataTempRiskMitigants([])
	    	if(data[0].CreditAnalys.CreditAnalysRisks == null){
	    		apcom.dataTempRiskMitigants( {Risks: "", Mitigants: ""} )
	    	} else {
	    		apcom.dataTempRiskMitigants(data[0].CreditAnalys.CreditAnalysRisks)
	    	}
		    ko.mapping.fromJS(data[0].CreditAnalys, apcom.formCreditAnalyst);
		    if(data[0].CreditAnalys.FinalComment.RecommendedCondition != null){
		    	apcom.RecCondition(data[0].CreditAnalys.FinalComment.RecommendedCondition)
		    }else{
		    	apcom.RecCondition([""])
		    }
		    
		    ko.mapping.fromJS(data[1].DCFinalSanction, apcom.sanction);

		    if(tayp === undefined) {
		    	if(apcom.sanction.LatestStatus() === "" && apcom.formCreditAnalyst.Id() !== "") {
			    	apcom.sanction.LatestStatus("Awaiting Action")
			    }

			    if(apcom.ValidateDate(apcom.sanction.Date()) && apcom.sanction.LatestStatus() !== "Awaiting Action" && apcom.sanction.LatestStatus() !== "" ) {
			    	var tempDate = moment(apcom.sanction.Date()).format("DD-MMM-YYYY")
		    		apcom.dcsanctiondatestring(tempDate)
			    }

			    apcom.checkLatestStatus(res[0].CreditAnalys)

		    	if(apcom.sanction.LatestStatus() === "Awaiting Action") {
			    	if(apcom.ValidateDate(apcom.formCreditAnalyst.FinalComment.SendDate())) {
			    		var tempDate = moment(apcom.formCreditAnalyst.FinalComment.SendDate()).format("DD-MMM-YYYY")
			    		apcom.sanction.Date(apcom.formCreditAnalyst.FinalComment.SendDate())
			    		apcom.dcsanctiondatestring(tempDate)
			    	} else {
			    		apcom.sanction.Date((new Date()).toISOString())
			    		apcom.dcsanctiondatestring("")
			    	}
			    }

			    apcom.latestStatusStr(apcom.sanction.LatestStatus())
		    }

		    apcom.Date("")
			apcom.LeftAmount("")
			apcom.ROI("")
			apcom.PF("")
			apcom.PG("")
			apcom.Security("")
			apcom.CommitteeRemarks("")
			apcom.Amount("")
			// apcom.RecommendedCondition([""])
			apcom.Recommendations("")
			apcom.Status("")
			apcom.CaStatus.val("")

			// apcom.plainDate(data[1].DCFinalSanction.Date)
			apcom.sanction.Id(data[1].DCFinalSanction.Id)
		    apcom.Date(moment(data[1].DCFinalSanction.Date).format('DD-MMM-YYYY') == "01-Jan-0001" ? "" : moment(data[1].DCFinalSanction.Date).format('DD-MMM-YYYY'));
		    if(data[1].DCFinalSanction.IsNullAmount != true){
		    	apcom.LeftAmount("");
		    }else{
		    	apcom.LeftAmount(data[1].DCFinalSanction.Amount);
		    }

		    if(data[1].DCFinalSanction.IsNullROI != true){
		    	apcom.ROI("");
		    }else{
		    	apcom.ROI(data[1].DCFinalSanction.ROI);
		    }
		    
		    apcom.PF(data[1].DCFinalSanction.PF);
		    apcom.PG(data[1].DCFinalSanction.PG);
		    apcom.Security(data[1].DCFinalSanction.Security);

			if (!_.isArray(data[1].DCFinalSanction.OtherConditions) ||
				data[1].DCFinalSanction.OtherConditions.length == 0)
				apcom.OtherConditions([""])
			else
				apcom.OtherConditions(data[1].DCFinalSanction.OtherConditions);

		    apcom.CommitteeRemarks(data[1].DCFinalSanction.CommitteeRemarks);
		    apcom.Status(data[1].DCFinalSanction.Status)

		    apcom.formCreditAnalyst.Id(data[0].CreditAnalys.Id)
		    if(data[0].CreditAnalys.FinalComment.IsNullAmount != false){
		    	apcom.Amount(data[0].CreditAnalys.FinalComment.Amount)
		    }else{
		    	apcom.Amount("")
		    }
		    
			apcom.RecommendedCondition(data[0].CreditAnalys.FinalComment.RecommendedCondition)
			apcom.Recommendations(data[0].CreditAnalys.FinalComment.Recommendations)
		    apcom.CaStatus.val(data[0].CreditAnalys.Status)
		    if(apcom.formCreditAnalyst.FinalComment.RecommendedCondition() == null){
		    	apcom.formCreditAnalyst.FinalComment.RecommendedCondition([""])
		    }
		    apcom.isfreezeCA(data[0].CreditAnalys.FinalComment.IsFreeze);
		    // alert(data[0].CreditAnalys.FinalComment.IsFreeze)
		    apcom.setFreezeCommentCA(data[0].CreditAnalys.FinalComment.IsFreeze)

	    }
	    apcom.loadSection();
	});
}

apcom.ValidateDate = function(date){
	var tempDate = moment(date).format("DD-MMM-YYYY") 
	if(tempDate === "01-Jan-0001") {
		return false
	}

	return true
}

apcom.Amount.subscribe(function(value){
	// console.log(value)
	if(typeof value == "string"){
		var data = value.replace(/^$|\s+/g, "")
		if(data == ""){
		apcom.formCreditAnalyst.FinalComment.IsNullAmount(false);
		}else{
			if(!isNaN(value)){
				apcom.formCreditAnalyst.FinalComment.IsNullAmount(true);
			} else {
				apcom.formCreditAnalyst.FinalComment.IsNullAmount(false);
			}
		}
	}else{
		apcom.formCreditAnalyst.FinalComment.IsNullAmount(true);
	}
	
});

apcom.setParamSanction = function(){
	apcom.sanction.Date(dcFinalSanctionDate(new Date(apcom.Date())))
	apcom.sanction.Amount(parseFloat(apcom.LeftAmount()))
	apcom.sanction.ROI(parseFloat(apcom.ROI()))
	apcom.sanction.PF(apcom.PF())
	apcom.sanction.PG(apcom.PG())
	apcom.sanction.Security(apcom.Security())
	apcom.sanction.OtherConditions(apcom.OtherConditions())
	apcom.sanction.CommitteeRemarks(apcom.CommitteeRemarks())
	apcom.sanction.Status(true)
	apcom.sanction.CustomerId(parseInt(r.customerId().split('|')[0]))
	apcom.sanction.DealNo(r.customerId().split('|')[1])
	var param = ko.mapping.toJS(apcom.sanction)

	return param	
}

apcom.checkLatestStatus = function(param){
	if(param != undefined && param.Id != undefined && param.Id == "") {
		$(".checkLatestStatus").prop("disabled", true)
	} else if(param != undefined && param.Id != undefined && param.Id !== "" && apcom.sanction.LatestStatus() === "") {
		$(".checkLatestStatus").prop("disabled", false)
	} else if(apcom.sanction.LatestStatus() === "Awaiting Action" || apcom.sanction.LatestStatus() === "On Hold" || apcom.sanction.LatestStatus() === "Sent Back") {
		$(".checkLatestStatus").prop("disabled", false)
	} else {
		$(".checkLatestStatus").prop("disabled", true)
	}


}

apcom.saveSanctionFix = function(param, callback) {
	if(r.customerId().split('|')[0] != "" && r.customerId().split('|')[1] != ""){
		ajaxPost("/approval/updatedateandlatestvalue", param, function(res){
			if(typeof callback === "function"){
				callback(res)
			}
		})
	}else{
		swal("Warning", "Select Customer Id and Deal Number First", "warning");
	}
}

apcom.checkingAndSaveStatus = function(status) {
	return function(){
		param = apcom.setParamSanction()
		param.Date = (new Date()).toISOString()
		param.LatestStatus = status

		apcom.saveSanctionFix(param, function(res){
			if(res.success != true){
				swal("Error", res.message, "error")
			}else{
				var tempDate = (new Date()).toISOString()
				apcom.sanction.Date(tempDate)

				tempDate = moment(apcom.sanction.Date()).format("DD-MMM-YYYY") 
				apcom.dcsanctiondatestring(tempDate)

				apcom.sanction.LatestStatus(status)
				
				apcom.checkLatestStatus()

				if(apcom.sanction.LatestStatus() === "Sent Back") {
					apcom.setFreezeCommentCA(false)
					apcom.isfreezeCA(false)
				}
				apcom.latestStatusStr(apcom.sanction.LatestStatus())
				swal("Success", "Data Successfully " + status, "success");
			}
		})


		// apcom.sanction.Date

		// console.log(status)
	}
}

apcom.sendCreditAnalyst = function(a, event){
	apcom.formCreditAnalyst.CreditAnalysRisks([]);
	apcom.formCreditAnalyst.DealNo(r.customerId().split('|')[1])
	apcom.formCreditAnalyst.CustomerId(parseInt(r.customerId().split('|')[0]))
	var dataGrid = $("#grid1").data("kendoGrid").dataSource.data();
	
	_.each(dataGrid, function(items){
		apcom.formCreditAnalyst.CreditAnalysRisks.push(
			{ Risks: items.Risks, Mitigants: items.Mitigants }
		)
	});

	apcom.formCreditAnalyst.FinalComment.Amount(parseFloat(apcom.Amount()))
	// apcom.formCreditAnalyst.FinalComment.RecommendedCondition(apcom.RecommendedCondition)
	apcom.formCreditAnalyst.FinalComment.Recommendations(apcom.Recommendations)
	// apcom.formCreditAnalyst.FinalComment.RecommendedCondition([])
	// console.log("--------->>>>", apcom.RecCondition())
	// apcom.formCreditAnalyst.FinalComment.RecommendedCondition(apcom.RecCondition())
    // $.each(apcom.RecCondition(), function(i, item){
    // 	console.log("==========>>>>>", item)
    // 	apcom.formCreditAnalyst.FinalComment.RecommendedCondition.push(item)
    // });
	
	var param = {
		Ca: ko.mapping.toJS(apcom.formCreditAnalyst),
		Status: _.find($(".btn-save.save"), function(btn){
			return btn == $(event.target)[0]
		}) != undefined ? apcom.CaStatus.SAVE : apcom.CaStatus.SEND
	}

	param.Ca.FinalComment.RecommendedCondition = apcom.RecCondition();
	if(param.Status == apcom.CaStatus.SEND){
		param.Ca.FinalComment.SendDate = (new Date()).toISOString();
		param.Ca.FinalComment.IsFreeze = true;
	}else{
		param.Ca.FinalComment.IsFreeze = false;
	}
	
	if(r.customerId().split('|')[0] != "" && r.customerId().split('|')[1] != ""){
		ajaxPost("/approval/savecreditanalys", param , function(res){
			if(res.success != true){
				swal("Error", res.message, "error")
			}else{
				if (param.Status == apcom.CaStatus.SAVE) {
					swal("Success", "Data Successfully Saved", "success");
				} else if (param.Status == apcom.CaStatus.SEND) {
					swal("Success", "Data Successfully Sent", "success");
					apcom.setFreezeCommentCA(true)
					apcom.isfreezeCA(true)
					apcom.sanction.LatestStatus("Awaiting Action")
					apcom.latestStatusStr(apcom.sanction.LatestStatus())
					apcom.dcsanctiondatestring(kendo.toString(new Date(param.Ca.FinalComment.SendDate), "dd-MMM-yyyy"));
					
					apcom.checkLatestStatus()
				}

				getComments('draft');
			}

		})
	}else{
		swal("Warning", "Select Customer Id and Deal Number First", "warning");
	}
	
}

var dcFinalSanctionDate = function(d){
	var ret = function(param){
		pelengkap = "T00:00:00.000Z"
		// console.log(param == undefined ? ("1970-01-01" + pelengkap) : (kendo.toString(param, "yyyy-MM-dd") + pelengkap));
		return param == undefined ? ("1970-01-01" + pelengkap) : (kendo.toString(param, "yyyy-MM-dd") + pelengkap)
	}

	if ( Object.prototype.toString.call(d) === "[object Date]" ){
	  	if ( isNaN( d.getTime() ) ){
	  		return ret()
	  	} else {
	  		return ret(d)
	  	}
	} else{
		return ret()
	}
}

apcom.LeftAmount.subscribe(function(value){
	// console.log(value)
	if(typeof value == "string"){
		var data = value.replace(/^$|\s+/g, "")
		if(data == ""){
		apcom.sanction.IsNullAmount(false);
		}else{
			if(!isNaN(value)){
				apcom.sanction.IsNullAmount(true);
			} else {
				apcom.sanction.IsNullAmount(false);
			}
		}
	}else{
		apcom.sanction.IsNullAmount(true);
	}
	
});

apcom.ROI.subscribe(function(value){
	// console.log(value)
	if(typeof value == "string"){
		var data = value.replace(/^$|\s+/g, "")
		if(data == ""){
		apcom.sanction.IsNullROI(false);
		}else{
			if(!isNaN(value)){
				apcom.sanction.IsNullROI(true);
			} else {
				apcom.sanction.IsNullROI(false);
			}
		}
	}else{
		apcom.sanction.IsNullROI(true);
	}
	
});


apcom.saveSanction = function(){
	apcom.sanction.Date(dcFinalSanctionDate(new Date(apcom.Date())))
	apcom.sanction.Amount(parseFloat(apcom.LeftAmount()))
	apcom.sanction.ROI(parseFloat(apcom.ROI()))
	apcom.sanction.PF(apcom.PF())
	apcom.sanction.PG(apcom.PG())
	apcom.sanction.Security(apcom.Security())
	apcom.sanction.OtherConditions(apcom.OtherConditions())
	apcom.sanction.CommitteeRemarks(apcom.CommitteeRemarks())
	apcom.sanction.Status(true)
	apcom.sanction.CustomerId(parseInt(r.customerId().split('|')[0]))
	apcom.sanction.DealNo(r.customerId().split('|')[1])
	var param = ko.mapping.toJS(apcom.sanction)
	if(r.customerId().split('|')[0] != "" && r.customerId().split('|')[1] != ""){
		ajaxPost("/approval/savedcfinalsanction", param, function(res){
			if(res.success != true){
				swal("Error", res.message, "error")
			}else{
				swal("Success", "Data Successfully Sanction", "success");
			}
		})
	}else{
		swal("Warning", "Select Customer Id and Deal Number First", "warning");
	}
}

apcom.saveHold = function(){
	apcom.sanction.Date(dcFinalSanctionDate(new Date(apcom.Date())))
	apcom.sanction.Amount(parseFloat(apcom.LeftAmount()))
	apcom.sanction.ROI(parseFloat(apcom.ROI()))
	apcom.sanction.PF(apcom.PF())
	apcom.sanction.PG(apcom.PG())
	apcom.sanction.Security(apcom.Security())
	apcom.sanction.OtherConditions(apcom.OtherConditions())
	apcom.sanction.CommitteeRemarks(apcom.CommitteeRemarks())
	apcom.sanction.Status(false)
	apcom.sanction.CustomerId(parseInt(r.customerId().split('|')[0]))
	apcom.sanction.DealNo(r.customerId().split('|')[1])
	var param = ko.mapping.toJS(apcom.sanction)
	if(r.customerId().split('|')[0] != "" && r.customerId().split('|')[1] != ""){
		ajaxPost("/approval/savedcfinalsanction", param, function(res){
			if(res.success != true){
				swal("Error", res.message, "error")
			}else{
				swal("Success", "Data Successfully Hold", "success");
			}
		})
	}else{
		swal("Warning", "Select Customer Id and Deal Number First", "warning");
	}
	
}

apcom.resetCreditAnalyst = function(){
	swal({
		title: "Are you sure you want to Reset?",
		text: "Reset will clear all the data entered",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: "Reset",
	}).then(function() {
		refreshFilter();
	}, function(dismiss) {
		if (dismiss === 'cancel') {
		}
	});
}

apcom.editorFieldInput = function(container, options){
	var index = container.parent().index()
	if(index == 0){
		$('<input data-bind="value:' + options.field + '"/>')
			.appendTo(container)
			.kendoDatePicker({
				format: 'dd-MMM-yyyy',
			})
	}else if(index == 1 || index == 2){
		$('<input data-bind="value:' + options.field + '"/>')
	        .appendTo(container)
	        .kendoNumericTextBox({
	            spinners : false,
	            min: 0,
        	});	
	}else if(index == 5 || index == 6 || index == 7){
		$('<textarea style="width: 98%" data-text-field="text" data-value-field="value" data-bind="value:' + options.field + '"></textarea>')
				.appendTo(container);
	}else{
		$('<input data-bind="value:' + options.field + '" style="width: 98%;"/>')
			.appendTo(container)
	}
}

apcom.editorField = function(container, options){
	var index = container.parent().index();
	if(index == 0){
		$('<input data-bind="value:' + options.field + '"/>')
	        .appendTo(container)
	        .kendoNumericTextBox({
	            spinners : false,
	            min: 0,
        	});	
    }else if(index == 1){
    	$('<textarea style="width: 98%" rows="5" data-text-field="text" data-value-field="value" data-bind="value:' + options.field + '"></textarea>')
			.appendTo(container);
    }else{
    	$('<input data-bind="value:' + options.field + '" style="width: 98%;"/>')
			.appendTo(container)
    }

}
apcom.loadSection = function(){
	$('#commentdate').kendoDatePicker({format: 'dd-MMM-yyyy'});

	for (let i = 1; i <= 3; i++) {
		$(".caret"+i).click(function(){
			if($("#content"+i).is(':visible')){
				$("#content"+i).hide()
				if($("#caret"+i).hasClass('fa-caret-down')){
					$("#caret"+i).removeClass('fa-caret-down');
					$("#caret"+i).addClass('fa-caret-right');
				}else{
	                $("#caret"+i).removeClass('fa-caret-right');
	                $("#caret"+i).addClass('fa-caret-down');
	            }
			}else{
				$("#content"+i).show()
				if($("#caret"+i).hasClass('fa-caret-right')){
	                $("#caret"+i).removeClass('fa-caret-right');
	                $("#caret"+i).addClass('fa-caret-down');
	            }else{
	                $("#caret"+i).removeClass('fa-caret-down');
	                $("#caret"+i).addClass('fa-caret-right');
	            }
			}
		})
	}

	var arr = [];
	var ind = 0;
	$("#grid1").html("");
	$("#grid1").kendoGrid({
		dataSource: {
			data: apcom.formCreditAnalyst.CreditAnalysRisks() != null && apcom.formCreditAnalyst.CreditAnalysRisks().length > 0 ? apcom.formCreditAnalyst.CreditAnalysRisks() : [{ Risks: "", Mitigants: "" }],
			schema: {
				model: {
					id: "Risks",
					fields: {
						Risks: { editable: true },
						Mitigants: { editable: true },
					}
				}
			}
		},
    	scrollable: false,
		resizable: true,
		editable: true,
		dataBound: function(){
			$("#grid1").find(".tooltipster").tooltipster({
                trigger: 'hover',
                theme: 'tooltipster-val',
                animation: 'grow',
                delay: 0,
            });

            $('#grid1 .k-grid-content tr:gt(0)').each(function (i, e) {
            	$(e).find('td:last button:first').css('visibility', 'hidden')
            })
		},
		navigatable: true,
		batch: true,
		columns:[{
			field: "Risks",
			title: "Risk / Concerns",
			headerAttributes: { "class": "sub-bgcolor" }, 
			width: 100,
			editor: apcom.LoadRiskInput,
			template: function(d){
				try {
					return d.Risks()
				} catch(e){
					return d.Risks
				}
            }
        }, {
            field: "Mitigants",
            title: "Mitigants",
            headerAttributes: { "class": "sub-bgcolor" }, 
            width: 100,
            editor: apcom.LoadMitigantInput,
            template: function(d){
				try {
					return d.Mitigants()
				} catch(e){
					return d.Mitigants
				}
            }
		}, {
			headerAttributes: { "class": "sub-bgcolor" }, 
			width: 30,
			template: function(d){
				ind ++;
				var index = $('#grid1 tr[data-uid="'+d.uid+'"]').index();

				// console.log("----------->>>>", index)
				if(ind == 1 || index == 0){
					return [
					'<center>',
						'<button class="btn btn-xs btn-primary tooltipster inbtn ca" title="Add" onclick="apcom.addRowRiskMitigants()"><i class="fa fa-plus"></i></button>',
					'</center>'
				].join('')
				}
				return [
					'<center>',
						'<button class="btn btn-xs btn-danger tooltipster inbtn ca" title="Remove" onclick="apcom.removeRowRiskMitigants(\''+d.uid+'\')"><i class="fa fa-trash"></i></button>',
					'</center>'
				].join('')
			}
		}], 
		edit: function(e){
			if(apcom.isfreezeCA() == true){
				this.closeCell();
			}
		}
	});

	$("#gridriskconcersnmitigants").html("");
    $("#gridriskconcersnmitigants").kendoGrid({
        dataSource: {
            data: apcom.formCreditAnalyst.CreditAnalysRisks() != null && apcom.formCreditAnalyst.CreditAnalysRisks().length > 0 ? apcom.formCreditAnalyst.CreditAnalysRisks() : [{ Risks: "", Mitigants: "" }]
        },
        scrollable: false,
        dataBound: function(){
            $("#gridriskconcersnmitigants").find(".tooltipster").tooltipster({
                trigger: 'hover',
                theme: 'tooltipster-val',
                animation: 'grow',
                delay: 0,
            });

            $('#gridriskconcersnmitigants .k-grid-content tr:gt(0)').each(function (i, e) {
                $(e).find('td:last button:first').css('visibility', 'hidden')
            })
        },
        batch: true,
        columns:[{
            field: "Risks",
            title: "Risk / Concerns",
            headerAttributes: { "class": "sub-bgcolor" }, 
            width: 100,
            editor: apcom.LoadRiskInput,
            template: function(d){
                return d.Risks == "" ? d.Risks : d.Risks()
            }
        }, {
            field: "Mitigants",
            title: "Mitigants",
            headerAttributes: { "class": "sub-bgcolor" }, 
            width: 100,
            editor: apcom.LoadMitigantInput,
            template: function(d){
                return d.Mitigants == "" ? d.Mitigants : d.Mitigants()
            }
        }]
    });
}

apcom.addRowRiskMitigants = function(){
	var allData = $("#grid1").data("kendoGrid").dataSource.data();
	var data = {
		Risks: "", 
		Mitigants: ""
	};
	allData.push(data)
}

apcom.showComments= function(){
	$('.chartscroll').animate({ scrollTop: $('.appComment').offset().top - 250 }, 'slow')
}

apcom.removeRowRiskMitigants = function(d){
	swal({
		title: 'Are you sure want to delete?',
		type: 'warning',
		showCancelButton: true,
		confirmButtonText: 'Yes',
		cancelButtonText: 'No',
	}).then(function() {
		var index = $('#grid1 tr[data-uid="'+d+'"]').index();
		var allData = $('#grid1').data('kendoGrid').dataSource.data();
		allData.splice(index, 1);
	}, function(dismiss) {

		if (dismiss === 'cancel') {
		}
	});
}

apcom.LoadMitigantInput = function(container, options){
	$('<textarea style="width: 96%;" data-text-field="text" data-value-field="value" data-bind="value:' + options.field + '"></textarea>')
		.appendTo(container);
}

apcom.LoadRiskInput = function(container, options){
	$('<textarea style="width: 96%;" data-text-field="text" data-value-field="value" data-bind="value:' + options.field + '"></textarea>')
		.appendTo(container);
}

function getComments(tayp){
	setTimeout(apcom.loadCommentData(tayp), 200)
}

apcom.addRecomendedCondition = function(){
	apcom.RecCondition.push("");
}

apcom.removeRecomendedCondition = function(index){
	var rec1 = apcom.RecCondition().filter(function(d, i){
		return i != index;
	})

	apcom.RecCondition(rec1)
}

// OtherConditions aka Sanction Conditions
apcom.addOtherCondition = function(){
	apcom.OtherConditions.push("");
}

apcom.removeOtherCondition = function(index){
	var ar = apcom.OtherConditions();
	ar.splice(index, 1)

	apcom.OtherConditions(ar);
}

apcom.setFreezeCommentCA = function(d){
	$("#send").prop("disabled", d)
	$(".ca").prop("disabled", d)
	setTimeout(function(){
		$(".inbtn").prop("disabled", d)
	}, 100);
}

$(document).ajaxComplete(function(){
	if(apcom.Date() != undefined && apcom.Date().toString().indexOf("1970") >-1){
		apcom.Date("")
	}

	setTimeout(function(){
		try{
			if(countUnconfirm() > 0){
				$("#send").prop("disabled", true)
			}
		}catch(e){
			console.log(e)
		}
	}
	
	,100)
})