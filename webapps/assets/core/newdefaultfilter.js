var filters = {}
filters.CustomerVal = ko.observableArray()
filters.CustomerVal.subscribe(function(values) {
	updateDealNoDS()
	updateCityDS()
	updateProductDS()
	updateBRHeadDS()
	updateSchemeDS()
	updateRMDS()
	updateCADS()

	databrowser.GetDataGrid();
})

filters.DealNoVal = ko.observableArray()
filters.DealNoVal.subscribe(function(values) {
	updateCustDS()
	updateCityDS()
	updateProductDS()
	updateBRHeadDS()
	updateSchemeDS()
	updateRMDS()
	updateCADS()

	databrowser.GetDataGrid();
})

filters.CityVal = ko.observableArray()
filters.CityVal.subscribe(function(values) {
	updateCustDS()
	updateDealNoDS()
	updateProductDS()
	updateBRHeadDS()
	updateSchemeDS()
	updateRMDS()
	updateCADS()

	databrowser.GetDataGrid();
})

filters.ProductVal = ko.observableArray()
filters.ProductVal.subscribe(function(values) {
	updateCustDS()
	updateDealNoDS()
	updateCityDS()
	updateBRHeadDS()
	updateSchemeDS()
	updateRMDS()
	updateCADS()

	databrowser.GetDataGrid();
})

filters.BRHeadVal = ko.observableArray()
filters.BRHeadVal.subscribe(function(values) {
	updateCustDS()
	updateDealNoDS()
	updateCityDS()
	updateProductDS()
	updateSchemeDS()
	updateRMDS()
	updateCADS()

	databrowser.GetDataGrid();
})

filters.SchemeVal = ko.observableArray()
filters.SchemeVal.subscribe(function(values) {
	updateCustDS()
	updateDealNoDS()
	updateCityDS()
	updateProductDS()
	updateBRHeadDS()
	updateRMDS()
	updateCADS()

	databrowser.GetDataGrid();
})

filters.RMVal = ko.observableArray()
filters.RMVal.subscribe(function(values) {
	updateCustDS()
	updateDealNoDS()
	updateCityDS()
	updateProductDS()
	updateBRHeadDS()
	updateSchemeDS()
	updateRMDS()
	updateCADS()

	databrowser.GetDataGrid();
})

filters.ddRLARangesVal = ko.observable("gt")
filters.ddRLARangesVal.subscribe(function(values) {
	updateCustDS()
	updateDealNoDS()
	updateCityDS()
	updateProductDS()
	updateBRHeadDS()
	updateSchemeDS()
	updateRMDS()
	updateCADS()

	databrowser.GetDataGrid();
})

filters.inputRLARangeVal = ko.observable()
filters.inputRLARangeVal.subscribe(function(values) {
	updateCustDS()
	updateDealNoDS()
	updateCityDS()
	updateProductDS()
	updateBRHeadDS()
	updateSchemeDS()
	updateRMDS()
	updateCADS()

	databrowser.GetDataGrid();
})

filters.CAVal = ko.observableArray()
filters.CAVal.subscribe(function(values) {
	updateCustDS()
	updateDealNoDS()
	updateCityDS()
	updateProductDS()
	updateBRHeadDS()
	updateSchemeDS()
	updateRMDS()

	databrowser.GetDataGrid();
})

filters.ddIRRangesVal = ko.observable("gt")
filters.ddIRRangesVal.subscribe(function(values) {
	updateCustDS()
	updateDealNoDS()
	updateCityDS()
	updateProductDS()
	updateBRHeadDS()
	updateSchemeDS()
	updateRMDS()
	updateCADS()

	databrowser.GetDataGrid();
})

filters.inputIRRangeVal = ko.observable(0)
filters.inputIRRangeVal.subscribe(function(values) {
	updateCustDS()
	updateDealNoDS()
	updateCityDS()
	updateProductDS()
	updateBRHeadDS()
	updateSchemeDS()
	updateRMDS()
	updateCADS()

	databrowser.GetDataGrid();
})

//--------------------------------------------------------------------

var critCustomer = function(fieldName, isString){
	var criteria = { logic: "or", filters: [] }
	_.each(filters.CustomerVal(), function(val){
		criteria.filters.push({ field: fieldName, operator: "eq", value: (isString ? val.toString() : val) })
	})
	return criteria
}

var critDealNo = function(fieldName){
	var criteria = { logic: "or", filters: [] }
	_.each(filters.DealNoVal(), function(val){
		criteria.filters.push({ field: fieldName, operator: "eq", value: val })
	})
	return criteria
}

var critCity = function(fieldName){
	var criteria = { logic: "or", filters: [] }
	_.each(filters.CityVal(), function(val){
		ajaxPost("/databrowser/getcustomerprofiledata", { 
			filter: { 
				logic: "or", 
				filters: [{ field: "applicantdetail.registeredaddress.CityRegistered", operator: "eq", value: val }] 
			} 
		}, function(res){
			_.each(res.data, function(data){
				criteria.filters.push({ field: fieldName, operator: "eq", value: data.applicantdetail.DealNo })
			})
		})
	})
	return criteria
}

var critProduct = function(fieldName){
	var criteria = { logic: "or", filters: [] }
	_.each(filters.ProductVal(), function(val){
		ajaxPost("/databrowser/getaccountdetaildata", { 
			filter: { 
				logic: "or", 
				filters: [{ field: "accountsetupdetails.product", operator: "eq", value: val }] 
			} 
		}, function(res){
			_.each(res.data, function(data){
				criteria.filters.push({ field: fieldName, operator: "eq", value: data.dealno })
			})
		})
	})
	return criteria
}

var critBRHead = function(fieldName){
	var criteria = { logic: "or", filters: [] }
	_.each(filters.BRHeadVal(), function(val){
		ajaxPost("/databrowser/getaccountdetaildata", { 
			filter: { 
				logic: "or", 
				filters: [{ field: "accountsetupdetails.brhead", operator: "eq", value: val }] 
			} 
		}, function(res){
			_.each(res.data, function(data){
				criteria.filters.push({ field: fieldName, operator: "eq", value: data.dealno })
			})
		})
	})
	return criteria
}

var critScheme = function(fieldName){
	var criteria = { logic: "or", filters: [] }
	_.each(filters.SchemeVal(), function(val){
		ajaxPost("/databrowser/getaccountdetaildata", { 
			filter: { 
				logic: "or", 
				filters: [{ field: "accountsetupdetails.scheme", operator: "eq", value: val }] 
			} 
		}, function(res){
			_.each(res.data, function(data){
				criteria.filters.push({ field: fieldName, operator: "eq", value: data.dealno })
			})
		})
	})
	return criteria
}

var critRM = function(fieldName){
	var criteria = { logic: "or", filters: [] }
	_.each(filters.RMVal(), function(val){
		ajaxPost("/databrowser/getaccountdetaildata", { 
			filter: { 
				logic: "or", 
				filters: [{ field: "accountsetupdetails.rmname", operator: "eq", value: val }] 
			} 
		}, function(res){
			_.each(res.data, function(data){
				criteria.filters.push({ field: fieldName, operator: "eq", value: data.dealno })
			})
		})
	})
	return criteria
}

var critRLA = function(fieldName){
	var criteria = { logic: "or", filters: [] }
	
	ajaxPost("/databrowser/getcustomerprofiledata", { 
		filter: { 
			logic: "or", 
			filters: [{ field: "applicantdetail.AmountLoan", operator: filters.ddRLARangesVal(), value: filters.inputRLARangeVal() }] 
		} 
	}, function(res){
		_.each(res.data, function(data){
			criteria.filters.push({ field: fieldName, operator: "eq", value: data.applicantdetail.DealNo })
		})
	})
	console.log(criteria);
	return criteria
}

var critCA = function(fieldName){
	var criteria = { logic: "or", filters: [] }
	_.each(filters.CAVal(), function(val){
		ajaxPost("/databrowser/getaccountdetaildata", { 
			filter: { 
				logic: "or", 
				filters: [{ field: "accountsetupdetails.creditanalyst", operator: "eq", value: val }] 
			} 
		}, function(res){
			_.each(res.data, function(data){
				criteria.filters.push({ field: fieldName, operator: "eq", value: data.dealno })
			})
		})
	})
	return criteria
}

var critIR = function(fieldName){
	var criteria = { logic: "or", filters: [] }
	
	ajaxPost("/databrowser/getcreditscorecarddata", { 
		filter: { 
			logic: "or", 
			filters: [{ field: "FinalScoreDob", operator: filters.ddIRRangesVal(), value: filters.inputIRRangeVal() }] 
		} 
	}, function(res){
		_.each(res.data, function(data){
			criteria.filters.push({ field: fieldName, operator: "eq", value: data.DealNo })
		})
	})
	
	return criteria
}

var updateCustDS = function(){
	var initFilter = { logic: "and", filters: [] }
	initFilter.filters.push(critDealNo("deal_no"))
	initFilter.filters.push(critCity("deal_no"))
	initFilter.filters.push(critProduct("deal_no"))
	initFilter.filters.push(critBRHead("deal_no"))
	initFilter.filters.push(critScheme("deal_no"))
	initFilter.filters.push(critRM("deal_no"))
	initFilter.filters.push(critIR("deal_no"))
	initFilter.filters.push(critCA("deal_no"))
	initFilter.filters.push(critRLA("deal_no"))

	//benakno
	setTimeout(function(){
		multiCustomerDS.filter(initFilter)
	}, 1000)
}

var updateDealNoDS = function(){
	var initFilter = { logic: "and", filters: [] }
	initFilter.filters.push(critCustomer("customer_id", false))
	initFilter.filters.push(critCity("deal_no"))
	initFilter.filters.push(critProduct("deal_no"))
	initFilter.filters.push(critBRHead("deal_no"))
	initFilter.filters.push(critScheme("deal_no"))
	initFilter.filters.push(critRM("deal_no"))
	initFilter.filters.push(critIR("deal_no"))
	initFilter.filters.push(critCA("deal_no"))
	initFilter.filters.push(critRLA("deal_no"))

	//benakno
	setTimeout(function(){
		multiDealNoDS.filter(initFilter);
	}, 1000)
}

var updateCityDS = function(){
	var initFilter = { logic: "and", filters: [] }
	initFilter.filters.push(critCustomer("applicantdetail.CustomerID", false))
	initFilter.filters.push(critDealNo("applicantdetail.DealNo"))
	initFilter.filters.push(critProduct("applicantdetail.DealNo"))
	initFilter.filters.push(critBRHead("applicantdetail.DealNo"))
	initFilter.filters.push(critScheme("applicantdetail.DealNo"))
	initFilter.filters.push(critRM("applicantdetail.DealNo"))
	initFilter.filters.push(critIR("applicantdetail.DealNo"))
	initFilter.filters.push(critCA("applicantdetail.DealNo"))
	initFilter.filters.push(critRLA("applicantdetail.DealNo"))

	//benakno
	setTimeout(function(){
		multiCityDS.filter(initFilter)
	}, 1000)
}

var updateProductDS = function(){
	var initFilter = { logic: "and", filters: [] }
	initFilter.filters.push(critCustomer("customerid", true))
	initFilter.filters.push(critDealNo("dealno"))
	initFilter.filters.push(critCity("dealno"))
	initFilter.filters.push(critBRHead("dealno"))
	initFilter.filters.push(critScheme("dealno"))
	initFilter.filters.push(critRM("dealno"))
	initFilter.filters.push(critIR("dealno"))
	initFilter.filters.push(critCA("dealno"))
	initFilter.filters.push(critRLA("dealno"))

	//benakno
	setTimeout(function(){
		multiProductDS.filter(initFilter)
	}, 1000)
}

var updateBRHeadDS = function(){
	var initFilter = { logic: "and", filters: [] }
	initFilter.filters.push(critCustomer("customerid", true))
	initFilter.filters.push(critDealNo("dealno"))
	initFilter.filters.push(critCity("dealno"))
	initFilter.filters.push(critProduct("dealno"))
	initFilter.filters.push(critScheme("dealno"))
	initFilter.filters.push(critRM("dealno"))
	initFilter.filters.push(critIR("dealno"))
	initFilter.filters.push(critCA("dealno"))
	initFilter.filters.push(critRLA("dealno"))

	//benakno
	setTimeout(function(){
		multiBRHeadDS.filter(initFilter)
	}, 1000)
}

var updateSchemeDS = function(){
	var initFilter = { logic: "and", filters: [] }
	initFilter.filters.push(critCustomer("customerid", true))
	initFilter.filters.push(critDealNo("dealno"))
	initFilter.filters.push(critCity("dealno"))
	initFilter.filters.push(critProduct("dealno"))
	initFilter.filters.push(critBRHead("dealno"))
	initFilter.filters.push(critRM("dealno"))
	initFilter.filters.push(critIR("dealno"))
	initFilter.filters.push(critRLA("dealno"))

	//benakno
	setTimeout(function(){
		multiSchemeDS.filter(initFilter)
	}, 1000)
}

var updateRMDS = function(){
	var initFilter = { logic: "and", filters: [] }
	initFilter.filters.push(critCustomer("customerid", true))
	initFilter.filters.push(critDealNo("dealno"))
	initFilter.filters.push(critCity("dealno"))
	initFilter.filters.push(critProduct("dealno"))
	initFilter.filters.push(critBRHead("dealno"))
	initFilter.filters.push(critScheme("dealno"))
	initFilter.filters.push(critIR("dealno"))
	initFilter.filters.push(critRLA("dealno"))

	//benakno
	setTimeout(function(){
		multiRMDS.filter(initFilter)
	}, 1000)
}

var updateCADS = function(){
	var initFilter = { logic: "and", filters: [] }
	initFilter.filters.push(critCustomer("customerid", true))
	initFilter.filters.push(critDealNo("dealno"))
	initFilter.filters.push(critCity("dealno"))
	initFilter.filters.push(critProduct("dealno"))
	initFilter.filters.push(critBRHead("dealno"))
	initFilter.filters.push(critScheme("dealno"))
	initFilter.filters.push(critRM("dealno"))
	initFilter.filters.push(critIR("dealno"))
	initFilter.filters.push(critRLA("dealno"))

	//benakno
	setTimeout(function(){
		multiCADS.filter(initFilter)
	}, 1000)
}

var generateDataSource = function(url, param, c){
	return new kendo.data.DataSource({
		serverFiltering: true,
	    transport: {
	        read: function(o) {
	        	if (o.data.filter != undefined){
	        		param.filter = o.data.filter
	        	} else {
		        	param.filter = { filters: [] }
		        }

	        	ajaxPost(url, param, function(res){
	           		o.success(res);
	           	})
	        }
	    },
	    schema: {
	    	parse: function(res){
	    		return _.reject(
	    			_.map(
	    				_.groupBy(
	    					_.sortBy(
	    						_.map(res.data, c), function(d){
	    							return d.value
	    						}), 
	    					function(d){
	    						return d.text;
	    					}), 
	    				function(d){
	    					return d[0];
	    				}), 
	    			function(d) {
	    				return _.isEmpty(d.text)
	    			})
	    	}
	    },
	    filter: function(a){
	    	console.log("-------", a);
	    }
	})
}

var getMasterCustomerDS = function(c) {
	return generateDataSource("/databrowser/getmastercustomerdata", {}, c)
}

var multiCustomerDS = getMasterCustomerDS(function(d){
	return {
		"text": d.customer_id + " - " + d.customer_name,
		"value": d.customer_id
	}
})

var multiDealNoDS = getMasterCustomerDS(function(d){
	return {
		"text": d.deal_no,
		"value": d.deal_no
	}
})

// --------------------------------------------------------------------

var multiCityDS = generateDataSource("/databrowser/getcustomerprofiledata", {}, function(d){
	return {
		"text": d.applicantdetail.registeredaddress.CityRegistered,
		"value": d.applicantdetail.registeredaddress.CityRegistered
	}
})

//--------------------------------------------------------------------

var getAccountDetailDS = function(c) {
	return generateDataSource("/databrowser/getaccountdetaildata", {}, c)
}

var multiProductDS = getAccountDetailDS(function(d){
	return {
		"text": d.accountsetupdetails.product,
		"value": d.accountsetupdetails.product
	}
})

var multiBRHeadDS = getAccountDetailDS(function(d){
	return {
		"text": d.accountsetupdetails.brhead,
		"value": d.accountsetupdetails.brhead
	}
})

var multiSchemeDS = getAccountDetailDS(function(d){
	return {
		"text": d.accountsetupdetails.scheme,
		"value": d.accountsetupdetails.scheme
	}
})

var multiRMDS = getAccountDetailDS(function(d){
	return {
		"text": d.accountsetupdetails.rmname,
		"value": d.accountsetupdetails.rmname
	}
})

var dddata = [
    { text: "Greater Than", value: "gt" },
    { text: "Greater Than or Equal", value: "gte" },
    { text: "Equal", value: "eq" },
    { text: "Lower Than or Equal", value: "lte" },
    { text: "Lower Than", value: "lt" }
]
$("#inputRLARange").kendoNumericTextBox();
$("#inputIRRange").kendoNumericTextBox();

var multiCADS = getAccountDetailDS(function(d){
	return {
		"text": d.accountsetupdetails.creditanalyst,
		"value": d.accountsetupdetails.creditanalyst
	}
})