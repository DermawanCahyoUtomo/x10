var trans = {};
trans.AllData = ko.observableArray([]);
trans.CurrentData = ko.observable(null);

trans.RenderGrid = function(){
	var searchKey = $("#filter").val().toLowerCase();

	$("#transgrid").html("");
	$("#transgrid").kendoGrid({
		dataSource: new kendo.data.DataSource({
	        transport: {
	            read: function(o) {
	            	ajaxPost("/cibiltransitory/getdatacibilpromotor", { 
               			searchkey: searchKey,
	               		additional: function(){
	               			if(searchKey != ""){
		               			var foundCust = _.uniq(
		               				_.map(
		               					_.filter(filter().CustomerSearchAll(), function(cust){
		               						return cust.customer_name.toLowerCase().indexOf(searchKey.toLowerCase()) > -1
		               					}), function(cust){
		               						return cust.customer_id
		               					})
		               				);
								return JSON.stringify(foundCust)
		               		} else {
		               			return -1
		               		}
	               		}(),
	               		page: o.data.page,
	               		pageSize: o.data.pageSize,
	               		skip: o.data.skip,
	               		take: o.data.take
	               	}, function(res){
	               		o.success(res);
	               	})
	            }
	        },
	        schema: {
	        	parse: function(data){
	        		trans.AllData([])
	        		trans.AllData(data.Res.Data)
	        		
	        		_.each(trans.AllData(), function(x){
				 		_.extend(x, function(cust){
				 			return { CustomerName: cust != undefined ? cust.customer_name : "" }
				 		}(_.find(filter().CustomerSearchAll(), function(xi){
				 				return xi.customer_id == x.ConsumersInfos.CustomerId
				 			})));
				 	})
	        		return {
	        			Data: data.Res.Data,
	        			Total: data.Total
	        		}
	        	},
	            data: "Data",
	            total: "Total"
	        },
	        serverPaging: true,
	        pageSize: 10,
	    }),
		pageable: true,
		scrollable:false,
		columns :[{
		 	field : "FileName", 
		 	title : "File Name",
			headerAttributes: { class: 'k-header header-bgcolor' },
			width: 200
		}, {
		 	field : "ConsumersInfos.ConsumerName", 
		 	title : "Promoter Name",
		 	headerAttributes: { class: 'k-header header-bgcolor' },
		 	width: 200
		}, {
		 	field : "CustomerName", 
		 	title : "Customer Name",
			headerAttributes: { class: 'k-header header-bgcolor' },
			width: 200
		}, {
			field : "ConsumersInfos.DealNo", 
		 	title : "Deal Number",
			headerAttributes: { class: 'k-header header-bgcolor' },
			width: 150
		}, {
			field : 'DateOfReport',
			title : 'Report Generated Date',
			headerAttributes: { class: 'k-header header-bgcolor' },
			width : 150,
			attributes : { "style" : "text-align:center" },
			template : function(x){
				var date = moment(x.DateOfReport).format("DD-MMM-YYYY")
				var time = moment(new Date(x.TimeOfReport)).utc().format("HH:mm:ss")
		 		return date + " " + time
		 	},
		}, {
		 	field : "ConsumersInfos.DateOfBirth", 
		 	title : "Date of Birth",
		 	template : function(x){
		 		return moment(x.ConsumersInfos.DateOfBirth).format("DD-MMM-YYYY")
		 	},
		 	attributes : { "style" : "text-align:center" },
		 	headerAttributes: { class: 'k-header header-bgcolor' },
			width : 150
		}, {
		 	field : "CibilScore", 
		 	title : "CIBIL Score",
			width : 100,
		 	attributes : { "style" : "text-align:right" },
			headerAttributes: {class: 'k-header header-bgcolor'},
		}, {
		 	field : "IncomeTaxIdNumber", 
		 	title : "Income Tax Id",
		 	headerAttributes: { class: 'k-header header-bgcolor' },
			width : 100
		}, {
		 	template : function(x){
		 		return "<button class='btn btn-xs btn-primary add-userrights confirm-userrights tooltipster' onclick='trans.showProm(\""+ x.Id + "\")'><i class='fa fa-edit'></i></button>"
		 	},
		 	width : 50,
		 	     headerAttributes: { class: 'k-header header-bgcolor' },
		}]
	});
}

trans.showProm = function(Id){
	if (Id != undefined) {
		    ajaxPost( "/cibiltransitory/getdatacibilpromotorcurrent" ,{"Id" : Id},function(res){
            if(res.Data[0] !=undefined){
            trans.CurrentData(ko.mapping.fromJS(res.Data[0]));


		// var cur = _.find(trans.AllData(),function(x){
		// 	return x.Id == Id;
		// })

		// if(cur != undefined){
		// 	trans.CurrentData(ko.mapping.fromJS(cur));

			if(trans.CurrentData().StatusCibil() != 0){
				swal("Warning","Selected Data Already Confirmed, Please Re Enter First","warning");
				return;
			}

			dateOfBirth = moment(trans.CurrentData().ConsumersInfos.DateOfBirth()).format("DD-MMM-YYYY");
			trans.CurrentData().ConsumersInfos.DateOfBirth(dateOfBirth)

			DateOfReport = moment(trans.CurrentData().DateOfReport()).format("DD-MMM-YYYY");
			trans.CurrentData().DateOfReport(DateOfReport)

			TimeOfReport = moment(trans.CurrentData().TimeOfReport()).format("hh:mm:ss");
			trans.CurrentData().TimeOfReport(TimeOfReport)

			email = _.filter(trans.CurrentData().EmailAddress(),function(x){ return x != "" });
			email = email.join("\n")

			scorfac = _.filter(trans.CurrentData().ScoringFactor(),function(x){ return x != "" });
			scorfac = scorfac.join("\n")

			tele = _.map(trans.CurrentData().Telephones(),function(x){ return  x.Type() + " - " + x.Number()});
			tele = tele.join("\n")

			trans.CurrentData().ScoringFactor(scorfac)
			trans.CurrentData().Telephones(tele)
			trans.CurrentData().EmailAddress(email)
			trans.loadAddress(trans.CurrentData().AddressData())

			$(".modal-edit-bro").modal({
		backdrop: 'static',
		keyboard: false,
		show: true
	});

	if($("#dateofreport").getKendoDatePicker() == undefined){
		$("#dateofreport").kendoDatePicker({ format : "dd-MMM-yyyy" });
		$("#dateofbirth").kendoDatePicker({ format : "dd-MMM-yyyy" });
	}

	$("#timeofreportinp").kendoMaskedTextBox({
	    mask: "00:00:00",
	    width:"100%"
	});
		}
	})

	} else {
		trans.CurrentData({
			ConsumersInfos: {
				ConsumerName: ko.observableArray(),
				CustomerId: ko.observableArray(),
				DateOfBirth: ko.observableArray(),
				DealNo: ko.observableArray(),
				Gender: ko.observableArray(),
			},
			DateOfReport: ko.observable(),
			TimeOfReport: ko.observable(),
			CibilScore: ko.observable(),
			ScoringFactor: ko.observable(),
			IncomeTaxIdNumber: ko.observable(),
			PassportNumber: ko.observable(),
			EmailAddress: ko.observable(),
			TotalAccount: ko.observable(),
			TotalOverdues: ko.observable(),
			TotalZeroBalanceAcc: ko.observable(),
			HighCreditSanctionAmount: ko.observable(),
			CurrentBalance: ko.observable(),
			OverdueBalance: ko.observable(),
			Telephones: ko.observableArray(),
			AddressData: ko.observableArray([]),
			Id: ko.observable(),
			FilePath: ko.observable(),
			FileName: ko.observable(),
			ReportType: ko.observable(),
			IsMatch: ko.observable(),
			CibilScoreVersion: ko.observable(),
			DateOpenedRecent: ko.observable(),
			DateOpenedOldest: ko.observable(),
			TotalEnquiries: ko.observable(),
			TotalEnquiries30Days: ko.observable(),
			RecentEnquiriesDates: ko.observable(),
			StatusCibil: ko.observable(),
			CustomerName: ko.observable()
		})

		trans.loadAddress(trans.CurrentData().AddressData())

		$(".modal-edit-bro").modal({
		backdrop: 'static',
		keyboard: false,
		show: true
	});

	if($("#dateofreport").getKendoDatePicker() == undefined){
		$("#dateofreport").kendoDatePicker({ format : "dd-MMM-yyyy" });
		$("#dateofbirth").kendoDatePicker({ format : "dd-MMM-yyyy" });
	}

	$("#timeofreportinp").kendoMaskedTextBox({
	    mask: "00:00:00",
	    width:"100%"
	});
	}

	
	
}

trans.loadAddress = function(data){
	var getData = ko.mapping.toJS(data)
	$("#cibilAddress").html('');
	$("#cibilAddress").kendoGrid({
		dataSource: {
			data: getData,
			schema:{
				model:{
					id: "AddressPinCode",
					fields: {
						AddressPinCode: {editable : true},
						Category: {editable : true},
						DateReported: {editable: true}
					}
				}
			}
		},
		dataBound: function () {
			app.gridBoundTooltipster('#cibilAddress')()	
		},
		editable: true,
		navigatable: true,
		batch: true,
		columns:[
			{
				field: "AddressPinCode",
				title: "Address (With Pincode)",
				headerAttributes: { "class": "sub-bgcolor" },
				// width: 200,
			},
			{
				field: "Category",
				title: "Address Category",
				headerAttributes: { "class": "sub-bgcolor" },
				// width: 200,
			},
			{
				field: "DateReported",
				title: "Address Date Reported",
				headerAttributes: { "class": "sub-bgcolor" },
				template: function(d){
					if(d.DateReported == ""){
						return ""
					}
					return kendo.toString(new Date(d.DateReported), "dd-MMM-yyyy")
				},
				editor: trans.loadDateInput
				// width: 200,
			},
			{
				title: "<button class='btn btn-xs btn-flat btn-success tooltipster' title='Add Address' onclick='trans.addAddress()'><i class='fa fa-plus'></i></button>",
				headerAttributes: { "class": "sub-bgcolor" },
				template: function(d){
					return "<button class='btn btn-xs btn-flat btn-danger tooltipster' title='Remove Address' onclick='trans.removeAddress(\""+d.uid+"\")'><i class='fa fa-trash'></i></button>"
				},
				width: 30,
			}
		]
	})
}

trans.loadDateInput = function(container, options){
	$('<input data-text-field="text" data-value-field="value" data-bind="value:' + options.field + '"/>')
		.appendTo(container)
		.kendoDatePicker({
			format: 'dd-MMM-yyyy',
	})
}

trans.addAddress = function(){
	var data = $('#cibilAddress').data('kendoGrid').dataSource.data();
	var newRow = {
		AddressPinCode: "",
		Category: "",
		DateReported: "",
	}

	data.push(newRow);
}

trans.removeAddress = function(d){
	var index = $('.cibilAddress tr[data-uid="'+d+'"]').index();
	var allData = $('#cibilAddress').data('kendoGrid').dataSource.data();
	allData.splice(index, 1);
}

// trans.UpdateGrid = function(datas){
// 	var url = "/cibiltransitory/updatecibilpromotor"
// 	var param = {};
// 	param = datas;
// 	 ajaxPost(url, param, function(data) {
// 		trans.RenderGrid(data.Data);
// 	})
// }

trans.SaveCibil = function(){
	var url = "/cibiltransitory/updatecibilpromotor"
	var param = {};
	
	var info = ko.mapping.toJS(trans.CurrentData)
	var gridData = $("#cibilAddress").data("kendoGrid").dataSource.data()
	param = info;
	param.EmailAddress = param.EmailAddress.split("\n");
	param.ScoringFactor = param.ScoringFactor.split("\n");
	param.Telephones = param.Telephones.split("\n");
	param.CibilScore = parseFloat(param.CibilScore);
	param.CurrentBalance = parseFloat(param.CurrentBalance);
	param.HighCreditSanctionAmount = parseFloat(param.HighCreditSanctionAmount);
	param.TotalAccount = parseFloat(param.TotalAccount);
	param.OverdueBalance = parseFloat(param.OverdueBalance);
	// param.TotalEnquiries30Days = parseFloat(param.TotalEnquiries30Days);
	param.TotalOverdues = parseFloat(param.TotalOverdues);
	param.TotalZeroBalanceAcc = parseFloat(param.TotalZeroBalanceAcc);
	param.AddressData = [];

	if (param.Id == undefined) {
		param.ConsumersInfos.CustomerId = parseInt(filter().CustomerSearchVal())
		param.ConsumersInfos.DealNo = filter().DealNumberSearchVal()
	}

	$.each(gridData, function(i, items){
		var date = items.DateReported;
		if( typeof date == "string"){
			param.AddressData.push(
				{
					AddressPinCode: items.AddressPinCode,
					Category: items.Category,
					DateReported: items.DateReported,
				}
			)
		}else{
			param.AddressData.push(
				{
					AddressPinCode: items.AddressPinCode,
					Category: items.Category,
					DateReported: moment(items.DateReported,"hh:mm:ss").toDate().toISOString(),
				}
			)
		}
		
	})
	var tel = [];
	param.Telephones.forEach(function(x){
		var temp = x.split("-");
		if(temp.length>1){
			tel.push({
				Type : temp[0].trim(),
				Number : temp[1].trim()
			})
		}else{
			tel.push({
				Type : temp[0],
				Number : ""
			})
		}
	})
	param.Telephones = tel;
	param.ConsumersInfos.DateOfBirth = moment(trans.CurrentData().ConsumersInfos.DateOfBirth()).toDate().toISOString()
	param.DateOfReport = moment(trans.CurrentData().DateOfReport()).toDate().toISOString()
	param.TimeOfReport = moment(trans.CurrentData().TimeOfReport(),"hh:mm:ss").toDate().toISOString()

	ajaxPost(url, param, function(data) {
	    if(data.Message!=""){
	    	swal("Error",data.Message,"error");
	    	return;
	    }
	    swal("Data Update Succefully", "", "success")
	    $(".modal-edit-bro").modal("hide");
	    trans.RenderGrid();
	})
}


function GetCustomer(){
	var url = "/datacapturing/getcustomerprofilelist";
	  ajaxPost(url, "", function(data) {
	    filter().CustomerSearchAll(data);
		trans.RenderGrid();
	});
}


$(document).ready(function(){

	GetCustomer();

	$("#filter").keydown(function(){
		setTimeout(function(){
			trans.RenderGrid();
		},500);  
	})
	
})


