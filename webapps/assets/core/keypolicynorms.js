var formula = {}
var url = "/normmaster";
formula.data = ko.observableArray([])
formula.dataInternalRating = ko.observableArray([])
formula.dataFormula = ko.observableArray([])
formula.templateFinancial = {
    Id: '',
    From: '',
    FieldId: '',
    Criteria: '',
    InternalRating: 'all',
    TimePeriod: '',
    ValueType: '',
    Product: '',
    Order: 0,
    ShowInLoanApprovalReport: true,
    ShowInLoanApprovalScreen: true,
    Operator: '',
    Value1: '',
    Value2: '',
    NormLabel: ''
}

formula.freezeText = ko.observable("Freeze")
formula.isFreeze = ko.observable(true)

formula.optionValueTypes = ko.observableArray([
	{		text : "Default",
		value : ""
	},
	{
		text : "Percentage",
		value : "percentage"
	}
	]);
formula.optionTimePeriod = ko.observableArray([
	{ value: "estimated preferred", text: "Estimated Preferred" },
	{ value: "provisional preferred", text: "Provisional Preferred" },
	{ value: "last audited", text: "Last Audited Year Available" },
	{ value: "not applicable", text: "Not Applicable" },
])
formula.optionProducts = ko.observableArray([
	"Purchase Invoice Finance"
])
formula.financial = ko.mapping.fromJS(formula.templateFinancial)
formula.optionNormTypes = ko.observableArray([
	{ value: "min", text: 'Min' },
	{ value: "max", text: 'Max' },
	{ value: "greater than or equal", text: 'Greater Than or Equal to' },
	{ value: "lower than or equal", text: 'Lower Than or Equal to' },
	{ value: "equal", text: 'Equal' },
	{ value: "between", text: 'Between' },
])
formula.selectNormType = function () {
	formula.financial.Value1('')
	formula.financial.Value2('')
}
formula.financialIsNew = ko.observable(false)
formula.optionFrom = ko.computed(function () {
	var others = [
		{ name: 'Account Details' },
		{ name: 'Banking Analysis' },
		{ name: 'CIBIL' },
		{ name: 'RTR' }
	]
	var allData = formula.data()
		.filter(function (d) { return d.category == "Section" })
		.map(function (d) { return { name: d.name, type: 'balance sheet' } })
		.concat(others)
	return _.orderBy(allData)
}, formula.data)

formula.changeFrom = function () {
	var value = this.value()
	if (value == '') {
		formula.financial.TimePeriod('')
		return
	}

	var row = formula.optionFrom().find(function (d) {
		return d.name == value
	})
	if (row != undefined) {
		if (row.type == 'balance sheet') {
			formula.financial.TimePeriod('last audited')
			return
		}
	}

	formula.financial.TimePeriod('not applicable')
}

formula.optionSubSection = ko.computed(function () {
	if (formula.financial.From() == '') {
		return []
	}

	return formula.data()
		.filter(function (d) { return d.sectionName == formula.financial.From() })
        .filter(function (d) { return d.category == 'Sub Section' })
		.map(function (d) { return d.name })
}, formula.financial.From)
formula.selectedSubSection = ko.observable('')

formula.optionFields = ko.computed(function () {
	if (formula.financial.From() == '') {
		return [];
	}

	var row = formula.optionFrom().find(function (d) {
		return d.name == formula.financial.From()
	})
	if (row == undefined) {
		return []
	}

	if (row.type == 'balance sheet') {
		var result = formula.data()

		result = result.filter(function (d) {
			return d.sectionName == row.name
		}).filter(function (d) {
			return ["Field", "Formula"].indexOf(d.category) > -1
		})

		if (formula.selectedSubSection() != '') {
			result = result.filter(function (d) {
				return d.subSectionName == formula.selectedSubSection()
			})
		}

		return _.orderBy(result, 'name')
	} else {
		if (row.name == 'RTR') {
			var result = app.masterRTR

			return _.orderBy(result, 'name')
		} else if (row.name == 'Banking Analysis') {
			var result = app.masterBank

			return _.orderBy(result, 'name')
		} else if (row.name == 'CIBIL') {
			var result = app.masterCIBIL

			return _.orderBy(result, 'name')
		} else if (row.name == 'Account Details') {
			var result = app.masterAccount

			return _.orderBy(result, 'name')
		}
	}

	return []
}, formula);

formula.financial.FieldId.subscribe(function(newValue){
	field = _.filter(formula.optionFields(), function(o){
		return o.alias == newValue
	})

	if(typeof field != "undefined" && field.length > 0 && typeof field[0].name != "undefined") {
		formula.financial.Criteria(field[0].name)
	}
})

formula.FieldIdSelect = function(e) {
	formula.financial.FieldId(e.sender._old)
	field = _.filter(formula.optionFields(), function(o){
		return o.alias == e.sender._old
	})

	if(typeof field != "undefined" && field.length > 0 && typeof field[0].name != "undefined") {
		formula.financial.Criteria(field[0].name)
	}
}
// formula.selectField = function () {
// 	var name = this.value()
// 	var field = formula.optionFields().find(function (d) {
// 		return d.alias == name
// 	})

// 	if (field != undefined) {
// 		formula.financial.Criteria(field.name)
// 	}
// }

formula.isLoading = function (what) {
    $('.apx-loading')[what ? 'show' : 'hide']()
    $('.app-content')[what ? 'hide' : 'show']()
}

formula.refresh = function () {
	formula.isLoading(true)

	app.ajaxPost("/ratio/GetFormulaData", { ForModule: "" }, function (res) {
		formula.constructData(res)
		formula.isLoading(false)
		formula.render()
	}, function () {
		formula.isLoading(false)
	})

	app.ajaxPost("/normmaster/GetInternalRatingCategory", { }, function (res) {
		formula.dataInternalRating(res.Data)
		formula.isLoading(false)
		formula.render()
	}, function () {
		formula.isLoading(false)
	})

	app.ajaxPost("/normmaster/GetNorms", {}, function (res) {
		formula.isLoading(false)
		formula.dataFormula(res.Data)
		formula.render()
		formula.checkFreezeDB(res.Data)
	}, function () {
		formula.isLoading(false)
	})
}

formula.checkFreezeDB = function(data) {
	if(data.length > 0) {
		formula.isFreeze(data[0].IsFreeze)
	}
}

formula.toggleCheckbox = function (o, field, id) {
	var row = formula.dataFormula().find(function (d) {
		return d.Id == id
	})

	if (row != undefined) {
		ko.mapping.fromJS(row, formula.financial)
		formula.financial[field](o.checked)
		formula.saveFinancial()
	}
}

formula.render = function () {
	var data = JSON.parse(JSON.stringify(_.orderBy(formula.dataFormula(), 'Order')));
	var idx = 0;
	var count = JSON.parse(JSON.stringify(_.countBy(data, function(x) {
				  return x.Criteria;
				})));

	_.forEach(data,function(d){
		d.id = idx;
		d.parentId = null;
		d.editable = true;
		idx++;
	});

	_.forEach(count,function (d,key) {
		var dx = _.filter(data,function(x){
			return x.Criteria == key
		});
		dx = _.orderBy(dx, 'Order');

		var parentx =  {
	         "Id":"",
	         "From":"",
	         "Criteria":key,
	         "FieldId":"",
	         "InternalRating":"",
	         "TimePeriod":"",
	         "Product":"",
	         "Order":dx[0].Order,
	         "ShowInLoanApprovalReport":false,
	         "ShowInLoanApprovalScreen":false,
	         "Operator":"",
	         "Value1":0,
	         "Value2":0,
	         "NormLabel":"",
	         "parentId" : null,
	         "id":idx,
	         "editable":false
      	};

		if(dx.length>1){
			for(var i = 0; i < dx.length; i++){
				dx[i].parentId = parentx.id;
				dx[i].Criteria = dx[i].InternalRating+" - "+dx[i].Product;
			}
	      	data.push(parentx);
		}
		idx++;
	});

	data = _.orderBy(data, 'Order');


	if ($('.grid').hasClass('k-grid')) {
		$('.grid').data('kendoTreeList').setDataSource(new kendo.data.TreeListDataSource({
			data: data
		}))

		return
	}

	var columns = [
		// { field: 'FieldId', title: 'Alias', headerAttributes: { class: "k-header header-bgcolor" }, width: 100 },
		{ field: 'Criteria', headerAttributes: { class: "k-header header-bgcolor" } },
		// { field: 'InternalRating', title: 'Internal Rating', headerAttributes: { class: "k-header header-bgcolor" } },
		{ title: 'Operator', headerAttributes: { class: "k-header header-bgcolor" }, template: function (d) {
			var what = ''
			var label = d.Operator

			switch (d.Operator) {
				case 'between' : what = 'success'; break;
				case 'equal'   : what = 'primary'; break;
				case 'min'     : what = 'warning'; break;
				case 'max'     : what = 'info'; break;
				case 'greater than or equal' : what = 'warning'; label = 'gte'; break;
				case 'lower than or equal'   : what = 'info'; label = 'lte'; break;
			}

			return '<button class="btn btn-tag btn-xs btn-' + what + '">' + label + '</button>'
		}, attributes: { style: 'text-align: center;' }, width: 100 },
		{ title: 'Norm', headerAttributes: { class: "k-header header-bgcolor" }, template: function (d) {
			switch (d.Operator) {
				case 'between' : return [d.Value1, '> value <', d.Value2].join(' '); break;
				case 'equal'   : return ['value =', d.Value1].join(' '); break;
				case 'min'     : return ['value >', d.Value1].join(' '); break;
				case 'max'     : return ['value <', d.Value1].join(' '); break;
				case 'greater than or equal' : return ['value >=', d.Value1].join(' '); break;
				case 'lower than or equal'   : return ['value <=', d.Value1].join(' '); break;
			}

			return ''
		}, attributes: { style: 'text-align: center;' } },
		{ field: 'NormLabel', title: 'Norm Label', headerAttributes: { class: "k-header header-bgcolor" } },
		{ headerTemplate: 'Show in<br />Loan Approval Report', template: function (d) {
			if(!d.editable){
				return "";
			}

			var isChecked = (d.ShowInLoanApprovalReport) ? 'checked="checked"' : ''
			return '<input type="checkbox" ' + isChecked + ' onchange="formula.toggleCheckbox(this, \'ShowInLoanApprovalReport\', \'' + d.Id + '\')" />'
		}, attributes: { style: 'text-align: center;' }, headerAttributes: { class: "k-header header-bgcolor" } },
		{ headerTemplate: 'Show in<br />Loan Approval Screen', template: function (d) {
			if(!d.editable){
				return "";
			}

			var isChecked = (d.ShowInLoanApprovalScreen) ? 'checked="checked"' : ''
			return '<input type="checkbox" ' + isChecked + ' onchange="formula.toggleCheckbox(this, \'ShowInLoanApprovalScreen\', \'' + d.Id + '\')" />'
		}, attributes: { style: 'text-align: center;' }, headerAttributes: { class: "k-header header-bgcolor" } },
		{ headerAttributes: { class: "k-header header-bgcolor" }, attributes: { style: 'text-align: center;' }, template: function (d) {
			if(!d.editable){
				return "";
			}

			return [
				'<button class="btn btn-xs btn-primary btn-up tooltipster moveup-userrights" title="Move up" onclick="formula.move(\'up\', \'' + d.Id + '\')"><i class="fa fa-arrow-up"></i></button>',
				'<button class="btn btn-xs btn-success btn-down tooltipster movedown-userrights" title="Move down" onclick="formula.move(\'down\', \'' + d.Id + '\')"><i class="fa fa-arrow-down"></i></button>',
				'&nbsp;',
				'<button class="btn btn-xs btn-primary tooltipster edit-userrights" title="Edit formula" onclick="formula.editFinancial(\'' + d.Id + '\')"><i class="fa fa-edit"></i></button>',
				'<button class="btn btn-xs btn-danger tooltipster delete-userrights" title="Delete formula" onclick="formula.deleteFinancial(\'' + d.Id + '\')"><i class="fa fa-trash"></i></button>',
			].join(' ')
		}, width: 140 }
	]

	var dataSource = new kendo.data.TreeListDataSource({
		data: data,
		schema: {
			model: {
				expanded: false,
			}
		}
	});

	var config = {
		dataSource: dataSource,
		columns: columns,
		dataBound: function () {
			app.gridBoundTooltipster('.grid')()
			$('.k-grid .k-grid-content tr:first .btn-up').addClass('disabled')
			$('.k-grid .k-grid-content tr:last .btn-down').addClass('disabled')

			if(formula.isFreeze()) {
				$('.form-container').find('button').prop('disabled', true)
				$('.form-container').find('input').prop('disabled', true)
				formula.freezeText("Unfreeze")
			} else {
				$('.form-container').find('button').prop('disabled', false)
				$('.form-container').find('input').prop('disabled', false)
				formula.freezeText("Freeze")
			}
		}
	}

	$('.grid').kendoTreeList(config)
}

formula.move = function (direction, id) {
	var data = _.orderBy(formula.dataFormula(), 'Order')

	var row = data.find(function (d) { return d.Id == id })
	var rowIndex = data.findIndex(function (d) { return d.Id == id })
	var rowPrev = data[rowIndex - 1]
	var rowNext = data[rowIndex + 1]

	var param = { data: [] }

	if (direction == 'up' && rowPrev != undefined) {
		param.data.push({ Id: row.Id, Order: rowPrev.Order })
		param.data.push({ Id: rowPrev.Id, Order: row.Order })
	} else if (direction == 'down' && rowNext != undefined) {
		param.data.push({ Id: row.Id, Order: rowNext.Order })
		param.data.push({ Id: rowNext.Id, Order: row.Order })
	}

	if (param.data.length > 0) {
		ajaxPost('/normmaster/changeordernorms', param, function (res) {
			if (res.Message != "") {
	        	sweetAlert("Oops...", res.Message, "error");
				formula.isLoading(false)
				return;
			}

			formula.isLoading(false)
			formula.refresh()
		})
	}
}

formula.deleteFinancial = function (id) {
	swal({
		title: "Are you sure?",
		text: "Formula will be deleted.",
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Yes, delete it"
	}).then(function() {
		formula.isLoading(true)

		var param = { id: id }
		ajaxPost('/normmaster/deletenorms', param, function (res) {
			if (res.Message != "") {
	        	sweetAlert("Oops...", res.Message, "error");
				formula.isLoading(false)
				return;
			}

			formula.isLoading(false)
			formula.refresh()

        	swal("Success!", "Data deleted", "success");
		}, function () {
			$('.modal-financial').modal('hide')
			formula.isLoading(true)
		})
    })
}

formula.editFinancial = function (id) {
	var row = formula.dataFormula().find(function (d) {
		return d.Id == id
	})
	if (row == undefined) {
    	sweetAlert("Oops...", "Data not found", "error");
		return
	}

	formula.financialIsNew(false)
	$('.modal-financial').modal('show')
	ko.mapping.fromJS(row, formula.financial)
}

formula.showModalFinancial = function () {
		$('.modal-financial').modal('show')

	formula.financialIsNew(true)

	ko.mapping.fromJS(formula.templateFinancial, formula.financial)
}

formula.saveFinancial = function () {
	formula.isLoading(true)
	var param = ko.mapping.toJS(formula.financial)

	if ($.trim(param.From) == '') {
		swal("Error!", "Section cannot be empty", "error");
		return
	}
	if ($.trim(param.FieldId) == '') {
		swal("Error!", "Field cannot be empty", "error");
		return
	}
	if ($.trim(param.Criteria) == '') {
		swal("Error!", "Criteria cannot be empty", "error");
		return
	}
	if ($.trim(param.InternalRating) == '') {
		swal("Error!", "Internal Rating cannot be empty", "error");
		return
	}
	if ($.trim(param.Product) == '') {
		swal("Error!", "Product Category cannot be empty", "error");
		return
	}
	if ($.trim(param.TimePeriod) == '') {
		swal("Error!", "Actuals as per Time Period cannot be empty", "error");
		return
	}
	if ($.trim(param.Operator) == '') {
		swal("Error!", "Operator cannot be empty", "error");
		return
	}
	if ($.trim(param.NormLabel) == '') {
		swal("Error!", "Norm Label cannot be empty", "error");
		return
	}
	if ($.trim(param.Value1) == '') {
		swal("Error!", "Value cannot be empty", "error");
		return
	}
	if (param.Operator == 'between') {
		if ($.trim(param.Value2) == '') {
			swal("Error!", "Value cannot be empty", "error");
			return
		}
	}

	param.Value1 = parseFloat(param.Value1)
	param.Value2 = parseFloat(param.Value2)
	param.IsNew = formula.financialIsNew()

	if (param.IsNew) {
		var order = _.max(formula.dataFormula().map(function (d) {
			return d.Order
		}))
		if (order == undefined) {
			order = 0
		} else {
			order += 1
		}

		param.Order = order
	}

	ajaxPost('/normmaster/savenorms', param, function (res) {
		if (res.Message != "") {
        	sweetAlert("Oops...", res.Message, "error");
			formula.isLoading(false)
			return;
		}
		formula.financialIsNew(false)
		$('.modal-financial').modal('hide')
		formula.isLoading(false)
		formula.refresh()

        swal("Success", "Changes saved", "success");
	}, function () {
		$('.modal-financial').modal('hide')
		formula.isLoading(true)
	})
}

formula.constructData = function (res) {
	var fields = res.Data.Fields.map(function (d, i) {
		var o = {}
		o.alias = d.FieldId
		o.order = i

		if (d.Type == 'formula') {
			o.category = 'Formula'
			o.name = d.FormulaData.Title
			o.formula = d.FormulaData.Formula
			o.sectionName = d.FormulaData.Section
			o.subSectionName = d.FormulaData.SubSection
			o.putAfter = d.FormulaData.PutAfter
		} else {
			o.category = 'Field'
			o.name = d.FieldData.FieldName
			o.sectionName = d.FieldData.SectionName
			o.subSectionName = d.FieldData.SubSectionName
		}

		return o
	})

	var res = []

	_.map(_.groupBy(_.orderBy(fields, 'order'), 'sectionName'), function (sectionData, sectionName) {
		var section = {}
		section.name = sectionName
		section.category = "Section"
		if (sectionName != '') {
			res.push(section)
		}

		_.map(_.groupBy(_.orderBy(sectionData, 'order'), 'subSectionName'), function (subSectionData, subSectionName) {
			var subSection = {}
			subSection.sectionName = sectionName
			subSection.name = subSectionName
			subSection.category = "Sub Section"
			if (subSectionName != '') {
				res.push(subSection)
			}

			_.orderBy(subSectionData, 'order').forEach(function (each) {
				var field = {}
				field.sectionName = sectionName
				field.subSectionName = subSectionName
				field.name = each.name
				field.category = each.category
				field.alias = each.alias
				field.formula = each.formula
				field.putAfter = each.putAfter
				res.push(field)
			})
		})
	})

	formula.data(res)
}


formula.setFreeze = function() {
	var param = {}
  param.IsFreeze = !formula.isFreeze()

  ajaxPost(url+"/setfreeze", param, function(){
      formula.isFreeze(!formula.isFreeze())
  });
}

formula.checkFreeze = ko.computed(function(){
	if(formula.isFreeze()) {
		$('.form-container').find('button').prop('disabled', true)
		$('.form-container').find('input').prop('disabled', true)
		formula.freezeText("Unfreeze")
	} else {
		$('.form-container').find('button').prop('disabled', false)
		$('.form-container').find('input').prop('disabled', false)
		formula.freezeText("Freeze")
	}
})

var checkBtnFreeze = ko.pureComputed(function(){
    return (formula.isFreeze())? "btn-unfreeze":"btn-freeze"
})

window.refreshFilter = function () {
	formula.refresh()
}

$(function () {
	$('.modal').each(function (i, e) {
		$(e).appendTo($('body'))
	})

	window.refreshFilter()
})