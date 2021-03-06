setup.templateaccountsetup = {
    brhead : "",
    cityname: "",
    creditanalyst: "",
    dealno: "",
    leaddistributor: "",
    product: "",
    rmname: "",
    scheme: ""
}

setup.templateGeneral = {
	NatureOfBussiness : '',
	YearsInBusiness : '',
	NoOfEmployees: '',
	AnnualTurnOver: '',
	UserGroupCompanies: '',
}

setup.templateLoan ={
	proposedloanamount: 0,
	requestedlimitamount : 0,
	limittenor: 0,
	ifyeseistinglimitamount: 0,
	existingpf: 0,
	recenetagreementdate: '',
	proposedrateinterest: 0,
	ifexistingcustomer: '',
	existingroi: 0,
	firstagreementdate: '',
	vintagewithx10: 0,

}

setup.templateaddresscorrespondence = {
	AddressRegistered : '',
	AreaOfPlotRegistered: '',
	BuiltUpAreaRegistered: '',
	CityRegistered: '',
	ContactPersonRegistered: '',
	CorrespondeceAddress : '',
	EmailRegistered : '',
	LandmarkRegistered : '',
	MobileRegistered : '',
	NoOfYearsAtAboveAddressRegistered: 0,
	OfficeRegistered: '',
	Ownership : '',
	PhoneRegistered: '',
	PincodeRegistered: '',
	StateRegistered: '',
}

setup.templateregisteredaddress = {
	AddressRegistered : '',
	AreaOfPlotRegistered: '',
	BuiltUpAreaRegistered: '',
	CityRegistered: '',
	ContactPersonRegistered: '',
	CorrespondeceAddress : '',
	EmailRegistered : '',
	LandmarkRegistered : '',
	MobileRegistered : '',
	NoOfYearsAtAboveAddressRegistered: 0,
	OfficeRegistered: '',
	Ownership : '',
	PhoneRegistered: '',
	PincodeRegistered: '',
	StateRegistered: '',
}

setup.templatesiteworkaddress= {
	AddressRegistered : '',
	AreaOfPlotRegistered: '',
	BuiltUpAreaRegistered: '',
	CityRegistered: '',
	ContactPersonRegistered: '',
	CorrespondeceAddress : '',
	EmailRegistered : '',
	LandmarkRegistered : '',
	MobileRegistered : '',
	NoOfYearsAtAboveAddressRegistered: 0,
	OfficeRegistered: '',
	Ownership : '',
	PhoneRegistered: '',
	PincodeRegistered: '',
	StateRegistered: '',
}

setup.templateApp = {
	AmountLoan : 0,
	AnnualTurnOver :'',
	AnyOther: '',
	CIN : '',
	CapitalExpansionPlans : '',
	CustomerConstitution: '',
	CustomerID: 0,
	CustomerName: '',
	CustomerPan: '',
	CustomerRegistrationNumber: '',
	DateOfIncorporation: '',
	DealID: 0,
	DealNo: '',
	GroupTurnOver: '',
	NatureOfBussiness: '',
	NoOfEmployees: '',
	TAN: '',
	TIN: '',
	UserGroupCompanies: '',
	YearsInBusiness: '',
	addresscorrespondence: setup.templateaddresscorrespondence,
	registeredaddress: setup.templateregisteredaddress,
	siteworkaddress: setup.templatesiteworkaddress

}

setup.promotorTemplate = {
	Address: '',
	AnniversaryDate: '',
	CIBILScore: '',
	City: '',
	DateOfBirth: '',
	Designation: '',
	Director: '',
	Education: '',
	Email: '',
	FatherName: '',
	Gender: '',
	Guarantor: '',
	Landmark: '',
	MaritalStatus: '',
	Mobile: '',
	Name: '',
	NetWorth: '',
	NoOfYears: '',
	Ownership: '',
	PAN : '',
	Phone: '',
	Pincode: '',
	Position: '',
	Promotor: '',
	ShareHoldingPercentage: '',
	State: '',
	ValueOfPot: '',
	VehiclesOwned: '',
}

setup.refrenceTemplate = {
	Name: '',
	Address: '',
	ContactNo: '',
	RelationAplicant: '',
}

setup.applicantdetail = ko.mapping.fromJS(setup.templateApp);
setup.AccounDetails = ko.mapping.fromJS(setup.templateaccountsetup);
setup.LoanDetails = ko.mapping.fromJS(setup.templateLoan);
setup.financialreport = ko.observableArray([]);
setup.deallist = ko.observableArray([]);
setup.snapshot = ko.observableArray([]);
setup.dataCurrentStatus = ko.observableArray([]);
setup.detailofpromoters = ko.observable([]);
setup.detailOfRefrence = ko.observable([setup.refrenceTemplate]);
setup.detailIsShow = ko.observable(false);
setup.custIdDealNo = ko.observable('')

setup.onClickDealNo = function(d, id){
	setup.custIdDealNo(id);
	var param = {Id : d}
	ajaxPost("/dealsetup/getselecteddatadealsetup", param, function(res){
		if((res.Data).length != 0){
			// console.log(res.Data[0].Info.myInfo)
			var dt = res.Data[0].Info.myInfo;
			var index = dt.length -1;
			if(dt[index].status != "In queue"){
				$("#accept").prop("disabled", true)
				$("#sendback").prop("disabled", true)
			}else{
				$("#accept").prop("disabled", false)
				$("#sendback").prop("disabled", false)
			}
			setup.detailIsShow(true)
			var data = res.Data[0];
			setup.AccounDetails.brhead(data.AccountDetails.accountsetupdetails.brhead)
			setup.AccounDetails.cityname(data.AccountDetails.accountsetupdetails.cityname)
			setup.AccounDetails.creditanalyst(data.AccountDetails.accountsetupdetails.creditanalyst)
			setup.AccounDetails.dealno(data.AccountDetails.accountsetupdetails.dealno)
			setup.AccounDetails.leaddistributor(data.AccountDetails.accountsetupdetails.leaddistributor)
			setup.AccounDetails.product(data.AccountDetails.accountsetupdetails.product)
			setup.AccounDetails.rmname(data.AccountDetails.accountsetupdetails.rmname)
			setup.AccounDetails.scheme(data.AccountDetails.accountsetupdetails.scheme)

			setup.LoanDetails.proposedloanamount(data.AccountDetails.loandetails.proposedloanamount/100000)
			setup.LoanDetails.requestedlimitamount(data.AccountDetails.loandetails.requestedlimitamount)
			setup.LoanDetails.limittenor(data.AccountDetails.loandetails.limittenor)
			setup.LoanDetails.ifyeseistinglimitamount(data.AccountDetails.loandetails.ifyeseistinglimitamount)
			setup.LoanDetails.existingpf(data.AccountDetails.loandetails.existingpf)
			setup.LoanDetails.recenetagreementdate(kendo.toString(new Date(data.AccountDetails.loandetails.recenetagreementdate),"dd-MMM-yyyy"));
			setup.LoanDetails.proposedrateinterest(data.AccountDetails.loandetails.proposedrateinterest);
			if(data.AccountDetails.loandetails.ifexistingcustomer != false){
				setup.LoanDetails.ifexistingcustomer("Yes")
			}else{
				setup.LoanDetails.ifexistingcustomer("No")
			}
			setup.LoanDetails.existingroi(data.AccountDetails.loandetails.existingroi)
			setup.LoanDetails.firstagreementdate(kendo.toString(new Date(data.AccountDetails.loandetails.firstagreementdate), "dd-MMM-yyyy"));
			setup.LoanDetails.vintagewithx10(data.AccountDetails.loandetails.vintagewithx10)

			ko.mapping.fromJS(data.CustomerProfile.applicantdetail, setup.applicantdetail)
			setup.applicantdetail.DateOfIncorporation(kendo.toString(new Date(data.CustomerProfile.applicantdetail.DateOfIncorporation), 'dd-MMM-yyyy'))
			setup.financialreport(data.CustomerProfile.financialreport.existingrelationship)
			console.log(data.CustomerProfile.detailofpromoters.biodata)
			var promotor = data.CustomerProfile.detailofpromoters.biodata;
			if(promotor.length > 0){
				setup.detailofpromoters([]);
				setup.detailofpromoters(data.CustomerProfile.detailofpromoters.biodata);
				$.each(promotor, function(i, d){
				console.log(d.Position)
					if(d.Designation.length > 0){
						var str = d.Designation.join(', ');
						$("#design"+i).val(str);
						// setup.detailofpromoters()[i].Designation = str;
					}
					
					if(d.Position != undefined){
						var pos = d.Position.join(', ');
						$("#position"+i).val(pos)
						// setup.detailofpromoters()[i].Position = pos
					}

					$("#promotor"+i).val(kendo.toString(new Date(d.DateOfBirth), "dd-MMM-yyyy"));
					
				})
			}else{	
				setup.detailofpromoters([]);
				setup.detailofpromoters().push(ko.mapping.toJS(setup.promotorTemplate));
			}
			// setup.detailofrefrence().push(ko.mapping.toJS(setup.refrenceTemplate));
			var ref = data.CustomerProfile.detailofpromoters.detailofreference;
			if(ref.length > 0){
				setup.detailOfRefrence([])
				setup.detailOfRefrence(ref)
			}else{
				// alert("masuk sini")
				setup.detailOfRefrence([])
				setup.detailOfRefrence([setup.refrenceTemplate])
			}
			setup.deallist(data.InternalRtr.deallist)
			setup.snapshot(data.InternalRtr.snapshot)
			setup.loadDetailGrid();
			setup.loadExGrid()
		}
		
	});

}

setup.getBack = function(){
	setup.detailIsShow(false)
	setup.custIdDealNo('');
	setup.loadExGrid()
}

setup.loadExGrid = function(){
	$("#grid-ex").html("");
	$("#grid-ex").kendoGrid({
		dataSource: setup.financialreport(),
        scrolable : true,
        columns: [{
             field: "LoanNo",
             headerAttributes: {
                 "class": "sub-bgcolor"
             },
             title: "Loan No.",
             format: "{0:c}",
             width: "120px"
         },
         {
             field: "TypeOfLoan",
             headerAttributes: {
                 "class": "sub-bgcolor"
             },
             title: "Type of Loan",
             width: "120px"
         },
         {
             field: "LoanAmount",
             headerAttributes: {
                 "class": "sub-bgcolor"
             },
             title: "Loan Amount (Rs.)",
             format: "{0:n0}",
             width: "120px",
             "attributes": {
                 class: "align-right",
                 style: "text-align: right;"
             },
             template:function(dt){
              if(dt.LoanAmount == null){
                return "";
              }
              return app.formatnum(dt.LoanAmount)
            },
         },
         {
             field: "Payment",
             headerAttributes: {
                 "class": "sub-bgcolor"
             },
             title: "Payment (Rs.)",
             format: "{0:n0}",
             width: "120px",
             "attributes": {
                 class: "align-right",
                 style: "text-align: right;"
             },
             template:function(dt){
              if(dt.Payment == null){
                return "";
              }
              return app.formatnum(dt.Payment)
            },
         },
     ],
        editable: "inline",
    });

    
}

setup.loadDetailGrid = function(){
	$("#topgrid").html("");
	$("#topgrid").kendoGrid({
		dataSource: setup.snapshot(),
		scrollable:true,
		columns:[
			{
				title: "Internal RTR Snapshot",
				headerAttributes: {"class": "header-bgcolor"},
				columns:[
					{
                		field:"NoActiveLoan",
                		title: "No. of Active Loans",
                		width: 100,
                		attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
                	},
                	{
			        	field:"AmountOutstandingAccured",
			        	title: "Amt Ounstanding (Accured)",
			        	width:  100,
			        	attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
			        },
			        {
			        	field:"AmountOutstandingDelinquent",
			        	title: "Amt Ounstanding (Deliquent)",
			        	width: 100,
			        	attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
			        },
			        {
			        	field:"TotalAmount",
			        	title: "Total Amt Outstanding (Accrued and Deliquent)",
			        	width: 150,
			        	attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
			        },
			        {
			        	field:"NPRDelays",
			        	title: "No.Of Principal Repayment Delays",
			        	width: 125,
			        	attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
			        },
			        {
			        	field:"NPREarlyClosures",
			        	title: "No. Of Principal Repayment Early Closures",
			        	width: 145,
			        	attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
			        },
			        {
			        	field:"NoOfPaymentDueDate",
			        	title: "Number of Payment on due date",
			        	width: 125,
			        	attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
			        },
				],
			},
			{
				title: "Utilization",
				headerAttributes: {"class": "header-bgcolor"},
				columns:[
					{
                		field:"Average",
                		title: "Average",
                		width: 65,
                		attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
                	},
			        {
			        	field:"Maximum",
			        	title: "Maximum",
			        	width: 65,
			        	attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
			        },
			      	{
			        	field:"Minimum",
			        	title: "Minimum",
			        	width: 65,
			        	attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
			        },
				]
			},
			{
				title: "DPD Track",
				headerAttributes: {"class": "header-bgcolor"},
				columns:[
					{
                		field:"MaxDPDDays",
                		title: "Max. DPD in Closed Loan in Days",
                		width: 125,
                		attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
                	},
			        {
			        	field:"MaxDPDDAmount",
			        	title: "Max. DPD in Closed Loan in Amount",
			        	width: 125,
			        	attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
			        },
			        {
			        	field:"AVGDPDDays",
			        	title: "Avg DPD Days",
			        	width: 70,
			        	attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
			        },
				]
			}
		], 

	});
  

	$("#unselect").html("");
    $("#unselect").kendoGrid({
        dataSource : setup.deallist(),
        columns:[
        		{
        	 	title:"Deal List",
                headerAttributes: { class: "header-bgcolor" },
                scrollable:true,
                columns:[
           //      	{
			        // 	title: "",
			        // 	width: 100,
			        // 	template: function(d){
			        // 		var a ='';
			        // 		if(intrtr.showDetails() == false){
			        // 			a = "<button class='btn btn-sm btn-flat btn-primary' onclick='intrtr.getDetails()'>Show Details</button>"
			        // 		}else{
			        // 			a = "<button class='btn btn-sm btn-flat btn-primary' onclick='intrtr.getHideDetails()'>Hide Details</button>"
			        // 		}
			        // 		return "<button class='btn btn-sm btn-flat btn-primary' onclick='intrtr.getDetails()'>Show Details</button>"
			        // 	}
			        // },
                	{
                		field:"DealNo",
                		title: "Deal No",
                		width:150,
                		attributes: { style: 'background: rgb(238, 238, 238)' },
                	},
			        {
			        	field:"Product",
			        	title: "Product",
			        	width:150,
			        	attributes: { style: 'background: rgb(238, 238, 238)' },
			        },
			        {
			        	field:"Scheme",
			        	title: "Scheme",
			        	width:150,
			        	attributes: { style: 'background: rgb(238, 238, 238)' },
			        },
			        {
			        	field:"AgreementDate",
			        	title: "Deal Approval Date",
			        	width:150,
			        	attributes: { style: 'background: rgb(238, 238, 238)' },
			        	template:function(e){ return kendo.toString(new Date(e.AgreementDate), "dd-MMM-yyyy");}
			        },
			        {
			        	field:"DealSanctionTillValidate",
			        	title: "Deal Validity Date",
			        	width:150,
			        	attributes: { style: 'background: rgb(238, 238, 238)' },
			        	template:function(e){ return kendo.toString(new Date(e.DealSanctionTillValidate), "dd-MMM-yyyy");}
			        },
			        {
			        	field:"TotalLoanAmount",
			        	title: "Loan Amount",
			        	width:150,
			        	attributes: { style: 'background: rgb(238, 238, 238);text-align: right;' },
			        	template: function(e){
			        		return app.formatnum(e.TotalLoanAmount)
			        	}
			        },

                ]
	        }

        ],

    });
}

setup.setAccept = function(param){
	ajaxPost("/dealsetup/accept", param, function(res){
		console.log(res)
		if(res.Status != "NOK"){
			swal({
				title: '',
				text: "Data Sucessfully Accepted",
				type: 'success',
				showCancelButton: false,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
			}).then(function () {
				setup.createGrid()
				setup.detailIsShow(false)
			})
		}else{
			swal(res.Message, "", "error");
		}
	})
}

setup.getAccept = function(){
	var on = setup.custIdDealNo().split("|");
	var param ={
		custid : on[0],
		dealno : on[1]
	}

	ajaxPost("/dealsetup/checkdata", param, function(res){
		console.log(res.Data.count)
		if(res.Status != "NOK"){
			if(res.Data.count > 1){
				swal({
					title: "",
					text: "Deal already exists in CAT, accept new Omnifin Data?",
					type: "warning",
					showCancelButton: true,
					confirmButtonCollor: '#3085d6',
					cancelButtonColor: '#d33',
					cancelButtonText: 'No',
					confirmButtonText: 'Yes',
					confirmButtonClass: 'btn btn-success',
					cancelButtonClass: 'btn btn-danger',
				}).then(function(){
					setup.setAccept(param)
				}, function(dismiss){
					console.log("dismiss")
				});
			}else if(res.Data.count == 1){
				setup.setAccept(param)
			}
		}else{
			swal("", res.Message, "error");
		}
	})
}

setup.getSendBack = function(){
	var on = setup.custIdDealNo().split("|");
	var param ={
		custid : on[0],
		dealno : on[1]
	}

	ajaxPost("/dealsetup/sendback", param, function(res){
		console.log(res)
		if(res.Message == "" && res.Status != "NOK"){
			swal({
				title: '',
				text: "Send Back Succesfully",
				type: 'success',
				showCancelButton: false,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
			}).then(function () {
				setup.detailIsShow(false)
				setup.createGrid()
			})
		}else{
			swal({
				title: '',
				text: res.Message,
				type: 'error',
				showCancelButton: false,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
			}).then(function () {
				setup.detailIsShow(false)
			})
		}
	})
}

setup.getCurrenStatusDetails = function(d){
	var param = {Id : d}
	ajaxPost("/dealsetup/getselecteddatadealsetup", param, function(res){
		if(res.IsError != true){
			var data = res.Data[0].Info.myInfo;
			setup.dataCurrentStatus(data)
			$("#current").modal("show");
			$("#currentStatus").html("")
			$("#currentStatus").kendoGrid({
				dataSource: setup.dataCurrentStatus(),
				 scrolable : true,
				 width: 200,
				 columns:[
				 	{
				 		field: "status",
				 		title: "Status",
				 		headerAttributes: {"class": "sub-bgcolor"},
				 	},
				 	{
				 		field: "updateTime",
				 		title: "Update Time",
				 		headerAttributes: {
							"class": "sub-bgcolor"
						},
						template: function(d){
							return kendo.toString(new Date(d.updateTime), "dd-MMM-yyyy h:mm:ss tt")
						}
					}
				 ]

			})

		}
	});
}

setup.dataForm = ko.mapping.fromJS(toolkit.clone(setup.dataTemplate))

$(function(){
	$('.collapsibleDeal').collapsible({
      accordion : true
    });
     
   // setTimeout(function(){
   		// console.log(setup.detailofrefrence())
   // }, 100)
    
    setup.detailofpromoters().push(ko.mapping.toJS(setup.promotorTemplate));
    // setup.loadExGrid();
})