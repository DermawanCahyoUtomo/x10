var formula = {}
formula.data = ko.observableArray([])
formula.templateFinancial = {
    Id: '',
    Title: '',
    PutAfter: '',
    Formula: '',
    ValueType: '',
}
formula.devMode = ko.observable(false)
formula.optionValueTypes = ko.observableArray([
	{ value: '', text: 'Number' },
	{ value: 'percentage', text: 'Percentage' },
])
formula.optionSection = ko.observableArray([
	{ value: "PROFIT & LOSS ACCOUNT", from: 'balance sheet', text: "PROFIT & LOSS ACCOUNT" },
	{ value: "BALANCE SHEET", from: 'balance sheet', text: "BALANCE SHEET" },
	{ value: "RATIO", from: "", text: "RATIO" },
	{ value: "CASH FLOW STATEMENT", from: "", text: "CASH FLOW STATEMENT" }
])
formula.selectedSection = ko.observable(formula.optionSection()[0].value)
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
formula.selectedFrom = ko.observable('')
formula.optionSubSection = ko.computed(function () {
	if (formula.selectedFrom() == '') {
		return []
	}

	return formula.data()
		.filter(function (d) { return d.sectionName == formula.selectedFrom() })
        .filter(function (d) { return d.category == 'Sub Section' })
		.map(function (d) { return d.name })
}, formula.selectedFrom)
formula.selectedSubSection = ko.observable('')
formula.optionPeriods = ko.observableArray([
	{ value: '', text: 'Last Audited' },
	{ value: 'N1', text: 'Next 1 Year' },
	{ value: 'N2', text: 'Next 2 Year' },
	{ value: 'N3', text: 'Next 3 Year' },
	{ value: 'P1', text: 'Previous 1 Year' },
	{ value: 'P2', text: 'Previous 2 Year' },
	{ value: 'P3', text: 'Previous 3 Year' },
])
formula.usePeriod = ko.computed(function () {
	if (formula.selectedFrom() == '') {
		return false
	}

	var row = formula.optionFrom().find(function (d) {
		return d.name == formula.selectedFrom()
	})
	if (row == undefined) {
		return false
	}

	return (row.type == 'balance sheet')
}, formula.selectedFrom)
formula.selectedPeriod = ko.observable('')
formula.optionFields = ko.computed(function () {
	if (formula.selectedFrom() == '') {
		return [];
	}

	var row = formula.optionFrom().find(function (d) {
		return d.name == formula.selectedFrom()
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
formula.changeSource = function () {
	var text = this.value()
	var check = formula.optionSection().slice(0, 2).find(function (d) {
		return d.text == text
	})

	if (check == undefined) {
		formula.selectedPeriod('')
	}
}
formula.parseTextPeriod = function (arg) {
	if (arg.indexOf('.') == -1) {
		return arg
	}

	var parts = arg.split('.')
	var namespace = parts[0]
	var value = parts[1]

	if (parts.length == 1) {
		return arg
	} else if (parts.length == 2) {
		return value
	} else if (parts.length == 3) {
		var period = parts[2]
		if (period.indexOf('P') > -1) {
			return '(' + value + ' ' + period.replace(/P/g, 'Previous ') + ' Year)'
		} else {
			return '(' + value + ' ' + period.replace(/N/g, 'Next ') + ' Year)'
		}
	}

	return ''
}
formula.selectField = function (d) {
	var self = this
	var value = self.value()
	var rowField = formula.optionFields().find(function (d) { return d.alias == value })
	if (rowField == '') {
		return
	}

	var value = rowField.alias
	if (formula.selectedPeriod() != '') {
		value = ['balancesheet', value, formula.selectedPeriod()].join('.')
	} else {
		if (formula.selectedFrom() == 'RTR') {
			value = ['rtr', value].join('.')
		} else if (formula.selectedFrom() == 'Banking Analysis') {
			value = ['bank', value].join('.')
		} else if (formula.selectedFrom() == 'Account Details') {
			value = ['accountdetails', value].join('.')
		} else if (formula.selectedFrom() == 'CIBIL') {
			value = ['cibil', value].join('.')
		}
	}

	var text = formula.parseTextPeriod(value)
	var token = { id: value, name: text }
	$('#formula-text').tokenInput('add', token)

	setTimeout(function () {
		self.value('')
	}, 100)
}

formula.financial = ko.mapping.fromJS(formula.templateFinancial)
formula.dataFormula = ko.observableArray([])
formula.optionFieldsForPutAfter = ko.computed(function () {
	return formula.data().filter(function (d) {
	    return d.sectionName == formula.selectedSection()
	}).filter(function (d) {
		return ['Field', 'Formula'].indexOf(d.category) > -1
	}).slice(0).map(function (d) {
		d.text = d.alias + ' - ' + d.name
		return d
	})
}, formula)
formula.financialIsNew = ko.observable(false)

formula.isLoading = function (what) {
    $('.apx-loading')[what ? 'show' : 'hide']()
    $('.app-content')[what ? 'hide' : 'show']()
}

formula.refresh = function (noLoader) {
	if (noLoader === true) {
		formula.isLoading(true)
	}

	param = {"ForModule" : "ratio report"}
	app.ajaxPost("/ratio/GetFormulaData", param, function (res) {
		formula.isLoading(false)
		$('.form-container').removeClass('mini-loading')
		formula.dataFormula(res.Data.Formula)
		formula.constructData(res)
		formula.render()
	}, function () {
		formula.isLoading(false)
		$('.form-container').removeClass('mini-loading')
	})

	formula.renderGlosaary()
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
	console.log(fields)

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

formula.render = function () {
	var data = formula.data()
	var selectedSection = formula.optionSection().find(function (d) {
		return d.value == formula.selectedSection()
	})
	if (selectedSection != undefined) {
		data = formula.data().filter(function (d) {
			return (d.sectionName == selectedSection.value)
				|| ((d.category == "Section") && (d.name == selectedSection.value))
		})
	}

	if ($('.grid').hasClass('k-grid')) {
		$('.grid').data('kendoGrid').setDataSource(new kendo.data.DataSource({
			data: data
		}))

		return
	}

	var columns = [
		{ field: 'Name', headerAttributes: {class: 'k-header header-bgcolor'}, width: 300, template: function (d) {
			return '<span data-category="' + d.category + '">' + d.name + '</span>'
		} },
		{ field: 'alias', title: 'Field alias', headerAttributes: {class: 'k-header header-bgcolor'}, template: function (d) {
			if (['Field', 'Formula'].indexOf(d.category) == -1) {
				return ''
			}

			return d.alias
		}, width: 200, attributes: { style: 'text-align: center;' } },
		{ field: 'formula', title: 'Formula', headerAttributes: {class: 'k-header header-bgcolor'}, template: function (d) {
			if (d.category !== 'Formula') {
				return ''
			}

			if (formula.devMode()) {
				return d.formula
			}

			return formula.extractFormula(d.formula)
				.map(function (e) { return e.name })
				.join('')
				.replace(/\//g, ' / ')
				.replace(/\-/g, ' - ')
				.replace(/\+/g, ' + ')
				.replace(/\*/g, ' * ')
				.replace(/\(/g, ' (')
				.replace(/\)/g, ') ')
		} },
		{ headerAttributes: {class: 'k-header header-bgcolor'}, attributes: { style: 'text-align: center;' }, template: function (d) {
			if (d.category !== 'Formula') {
				return ''
			}

			return [
				'<button class="btn btn-xs btn-primary tooltipster moveup-userrights" title="Move up" data-direction="up" onclick="formula.moveTo(this, \'' + d.alias + '\')"><i class="fa fa-arrow-up"></i></button>',
				'<button class="btn btn-xs btn-success tooltipster movedown-userrights" title="Move down" data-direction="down" onclick="formula.moveTo(this, \'' + d.alias + '\')"><i class="fa fa-arrow-down"></i></button>',
				'<button class="btn btn-xs btn-primary tooltipster edit-userrights" title="Edit formula" onclick="formula.editFinancial(\'' + d.alias + '\')"><i class="fa fa-edit"></i></button>',
				'<button class="btn btn-xs btn-danger tooltipster delete-userrights" title="Delete formula" onclick="formula.deleteFinancial(\'' + d.alias + '\')"><i class="fa fa-trash"></i></button>',
			].join(' ')
		}, width: 170 }
	]

	var config = {
		dataSource: {
			data: data
		},
		columns: columns,
		dataBound: function () {
			app.gridBoundTooltipster('.grid')()
			$('.grid [data-category]').each(function (i, e) {
				var $row = $(e).closest('tr')
				var category = $(e).attr('data-category')

				if (category == 'Section') {
					$row.addClass('row-section')
				} else if (category == 'Sub Section') {
					$row.addClass('row-sub-section header-bgcolor')
				} else if (category == 'Formula') {
					$row.addClass('row-formula sub-bgcolor')
				}
			})

			$('.grid tr [data-direction="up"]:first').addClass('disabled');
			$('.grid tr [data-direction="down"]:last').addClass('disabled')
		}
	}

	$('.grid').kendoGrid(config)
}

formula.moveTo = function(o, id) {
	$('.form-container').addClass('mini-loading')
	
	var direction = $(o).attr('data-direction');
	var rowNow = _.find(formula.data(), { alias: id })
	var dataAfter = formula.data().slice(0).filter(function (d) {
		return ['Field', 'Formula'].indexOf(d.category) > -1
	})

	try {
		if (direction == 'up') {
			var rowPrev = dataAfter[dataAfter.indexOf(rowNow) - 1]

			if (rowNow.subSectionName != rowPrev.subSectionName) {
				formula.reorder(dataAfter, rowNow.alias, rowPrev.alias, 'to', function () {
					formula.refresh(false)
				})
			} else {
				var rowPrevOfPrev = dataAfter[dataAfter.indexOf(rowPrev) - 1]

				formula.reorder(dataAfter, rowNow.alias, rowPrevOfPrev.alias, 'from', function () {
					formula.refresh(false)
				})
			}
		} else {
			var rowNext = dataAfter[dataAfter.indexOf(rowNow) + 1]

			formula.reorder(dataAfter, rowNow.alias, rowNext.alias, 'to', function () {
				formula.refresh(false)
			})
		}
	} catch (err) { }
}

formula.changePutAfter = function (data, callback) {
	var param = { Data: data }
	ajaxPost('/ratio/changeputafter', param, callback, callback)
}

formula.deleteFinancial = function (id) {
	swal({
		title: "Are you sure?",
		text: "Field will be deleted.",
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Yes, delete it!"
	}).then(function() {
		formula.isLoading(true)

		var param = { id: id }
		ajaxPost('/ratio/deleteformula', param, function (res) {
			if (res.Message != "") {
	        	sweetAlert("Oops...", res.Message, "error");
				formula.isLoading(false)
				return;
			}

			var callback = function () {
				formula.isLoading(false)
				formula.refresh()

	        	swal("Success!", "Data deleted!", "success");
			}

			var rowNow = _.find(formula.data(), { alias: id })
			var dataAfter = formula.data().filter(function (d) {
				return d.alias != id
			})

			formula.reorder(dataAfter, undefined, undefined, 'to', function (d) {
				callback()
			})
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

	ko.mapping.fromJS(row, formula.financial)
	formula.financialIsNew(false)
	$('.modal-financial').modal('show')
	formula.selectedFrom('')
	formula.selectedSubSection('')
	formula.selectedPeriod('')

	$('#formula-text').tokenInput('clear')

	var formulaPart = formula.extractFormula(formula.financial.Formula())
		.forEach(function (token) {
			$('#formula-text').tokenInput('add', token)
		})
}
formula.extractFormula = function (f) {
	if ($.trim(f) == '') {
		return []
	}

	return f.replace(/\./g, 'DOTTTTTTT')
		.replace(/\ /g, '')
		.match(/(-\d+(?:\.\d+)?|[-+\/&*.()]|\w+)/g)
		.map(function (d) {
			var id = d.replace(/DOTTTTTTT/g, '.')
			var label = formula.parseTextPeriod(id)
			if (id == '*') {
				label = ' x '
			}

			var token = { id: id, name: label }
			return token
		})
}
formula.highlightFormula = function () {
	var operand = ['(', ')', '+', '-', '/', '*', 'x', 'X']
	var selector = operand
		.map(function (d) { return 'span.token-label:contains("' + d + '")' })
		.join(',')

	$(selector).each(function (i, e) {
		var $self = $(e)
		if (operand.indexOf($self.html()) == -1) {
			return
		}

		$self.parent().addClass('operand')

		if (['(', ')'].indexOf($self.html()) > -1) {
			$self.parent().addClass('paranthesess')
		}
	})
}

formula.addOperator = function (operator) {
	return function () {
		var label = (operator == '*') ? 'X' : operator
		var token = { id: operator, name: label }

		$('#formula-text').tokenInput('add', token)
	}
}

formula.showModalFinancial = function () {
	ko.mapping.fromJS(formula.templateFinancial, formula.financial)
	formula.financialIsNew(true)
	$('.modal-financial').modal('show')
	formula.selectedFrom('')
	formula.selectedSubSection('')
	formula.selectedPeriod('')
	$('#formula-text').tokenInput('clear')
}

formula.getFinancialParam = function () {
	var param = ko.mapping.toJS(formula.financial)
	param.IsNew = formula.financialIsNew()
	param.Formula = $('#formula-text').tokenInput('get')
		.map(function (d) {
			if (d.id.length > 0) {
				if (d.id[d.id.length - 1] == '%') {
					return parseFloat(d.id.replace(/\%/g, '')) / 100
				}
			}

			return d.id
		})
		.join('')
	param.Section = formula.selectedSection()
	param.SubSection = ""

	var prevRow = formula.data().find(function (d) {
	    return d.alias == param.PutAfter
	})
	if (prevRow != undefined) {
		param.Section = prevRow.sectionName
		param.SubSection = prevRow.subSectionName
	}

	return param
}

formula.saveFinancial = function () {
	formula.isLoading(true)
	var param = formula.getFinancialParam()

	if ($.trim(param.Id) == '') {
		swal("Error!", "Alias cannot be empty!", "error").then(function(){
			formula.isLoading(false)
		});
		return
	}
	if ($.trim(param.Title) == '') {
		swal("Error!", "Name cannot be empty!", "error").then(function(){
			formula.isLoading(false)
		});
		return
	}
	if ($.trim(param.PutAfter) == '') {
		swal("Error!", "Put after cannot be empty!", "error").then(function(){
			formula.isLoading(false)
		});
		return
	}

	var callback = function () {
		$('.modal-financial').modal('hide')
		formula.isLoading(false)
		formula.refresh()

        swal("Success!", "Changes saved!", "success");
	}

	var rowNextFirst = ""
	var rowPrevFirst = ""

	if (!formula.financialIsNew()) {
		var callbackTemp = function () {
		}

		var rowIndex = _.findIndex(formula.data(), { alias: param.Id })
		rowNextFirst = formula.data()[rowIndex + 1]
		rowPrevFirst = formula.data()[rowIndex - 1]
	}

	param.ForModule = "ratio report"
	ajaxPost('/ratio/saveformula', param, function (res) {
		if (res.Message != "") {
        	sweetAlert("Oops...", res.Message, "error");
			formula.isLoading(false)
			return;
		}

		if (formula.financialIsNew()) {
			var newData = formula.data().slice(0).concat([{
				alias: param.Id,
				category: 'Formula',
				sectionName: param.Section,
				subSectionName: param.SubSection
			}])

			formula.reorder(newData, param.Id, param.PutAfter, 'to', function () {
				callback()
			})

			return
		} else {
			var row = formula.data().find(function (d) {
				return d.alias == param.Id
			})

			if (row.putAfter != param.PutAfter) {
				formula.reorder(formula.data(), param.Id, param.PutAfter, 'to', function () {
					callback()
				})
				return
			}
		}

		callback()
	}, function () {
		$('.modal-financial').modal('hide')
		formula.isLoading(true)
	})
}

formula.initTokenField = function () {
	$('#formula-text').tokenInput([], {
    	theme: 'facebook',
    	allowFreeTagging: true,
    	allowCustomEntry: true,
    	onResult: function (item) {
    		var text = $("formula-text").text()

	        if($.isEmptyObject(item)){
	            return [{ id: text, name: text }];   
	        } else {
	            item.unshift({ id: text, name: text });
	            return item; 
	        }
	    },
    });
}

window.refreshFilter = function () {
	formula.refresh()
}

formula.reorder = function (source, from, to, subSectionNeedToFollow, callback) {
	var data = source.slice(0).filter(function (d) {
	    return ['Field', 'Formula'].indexOf(d.category) > -1
	})

	var resOrdered = []

	if (from == undefined && to == undefined) {
		resOrdered = data.map(function (d) {
			return {
				category: d.category,
				alias: d.alias,
				putAfter: undefined,
				sectionName: d.sectionName,
				subSectionName: d.subSectionName
			}
		})
	} else {
		var oFrom = data.find(function (d) { return d.alias == from })
		var oFromIndex = data.indexOf(oFrom)
		var oTo = data.find(function (d) { return d.alias == to })
		var oToIndex = data.indexOf(oTo)

		if (oFromIndex == oToIndex) {
			return
		}

		var isJustNeedToChangeTheSubSection = false
		if (oFromIndex + 1 == oToIndex || oFromIndex - 1 == oToIndex) {
			if (oFrom.subSectionName != oTo.subSectionName) {
				isJustNeedToChangeTheSubSection = true
			}
		}

		console.log('from', oFromIndex, 'to', oToIndex)
		console.log('from', from, 'to', to)
		console.log('isJustNeedToChangeTheSubSection', isJustNeedToChangeTheSubSection)

		if (isJustNeedToChangeTheSubSection) {
			resOrdered = data.map(function (d) {
				var o = {
					category: d.category,
					alias: d.alias,
					putAfter: undefined,
					sectionName: d.sectionName,
					subSectionName: d.subSectionName
				}

				if (d == oFrom) {
					o.subSectionName = oTo.subSectionName
				}

				return o
			})
		} else {
			data.forEach(function (d, i) {
				if (d == oFrom) {
					return
				}

				resOrdered.push({
					category: d.category,
					alias: d.alias,
					putAfter: undefined,
					sectionName: d.sectionName,
					subSectionName: d.subSectionName
				})

				if (d == oTo) {
					var sectionName = oFrom.sectionName
					var subSectionName = oFrom.subSectionName

					if (subSectionNeedToFollow == 'to') {
						sectionName = oTo.sectionName
						subSectionName = oTo.subSectionName
					}

					resOrdered.push({
						category: oFrom.category,
						alias: oFrom.alias,
						putAfter: undefined,
						sectionName: sectionName,
						subSectionName: subSectionName
					})
				}
			})
		}
	}

	var resFinal = resOrdered.map(function (d, i) {
		if (i == 0) {
			return d
		}

		d.putAfter = resOrdered[i - 1].alias
		return d
	}).filter(function (d) {
		return d.category == 'Formula'
	})

	var param = { Data: resFinal }
	app.ajaxPost('/ratio/reorder', param, function (res) {
		callback()
	}, function () {
		callback()
	})
}

formula.exportExcel = function(target, title){
	// alert(title)
	$('.apx-loading').show()
	setTimeout(function(){
		var body = $('body');
		var fakeTable = $('<div/>').attr('id', 'fake-table').appendTo(body).css('margin-top', '-19px')

	 	var data = formula.data()

		if ($('#fake-table').hasClass('k-grid')) {

			$('#fake-table').data('kendoGrid').setDataSource(new kendo.data.DataSource({
				data: data
			}))

			return
		}

		var columns = [
			{ field: 'Name', headerAttributes: {class: 'k-header header-bgcolor', style: 'background-color: #313d50 !important;color: white !important;'}, width: 300, template: function (d) {
				return '<span data-category="' + d.category + '">' + d.name + '</span>'
			} },
			{ field: 'alias', title: 'Field alias', headerAttributes: {class: 'k-header', style: 'background-color: #313d50 !important;color: white !important;'}, template: function (d) {
				if (['Field', 'Formula'].indexOf(d.category) == -1) {
					return ''
				}

				return d.alias
			}, width: 200, attributes: { style: 'text-align: center;' } },
			{ field: 'formula', title: 'Formula (Alias)', headerAttributes: {class: 'k-header', style: 'background-color: #313d50 !important;color: white !important;'}, template: function (d) {
				if (d.category !== 'Formula') {
					return ''
				}

				if (formula.devMode()) {
					return d.formula
				}
				var ret = formula.extractFormula(d.formula)
					.map(function (e) { return e.name })
					.join('')
					.replace(/\//g, ' / ')
					.replace(/\-/g, ' - ')
					.replace(/\+/g, ' + ')
					.replace(/\*/g, ' * ')
					.replace(/\(/g, ' ( ')
					.replace(/\)/g, ' ) ')

				// if(ret.indexOf("(") > -1 && ret.indexOf(")") > -1){
				// 	ret.replace(/\(/g, " ( ").replace(/\)/g, " ) ");
				// 	console.log(ret)
				// }
				// console.log("------->>>", d.formula)
				// var ar = ret.split(/\s+/);
				// var disc = '';
				// $.each(ar, function(i, items){
		    		// $.each(formula.data(), function(i, ondis){
		    		// 	console.log(items.indexOf(ondis.alias))
		    		// 	if(items.indexOf(ondis.alias) > -1){
		    		// 		disc += ondis.name 
		    		// 	}
		    		// })
		    		// var temp = _.find(formula.data(),function(ondis){ return ondis.alias == items });
		    		// var temp = formula.data()	.find(function(ondis){ return ondis.alias == items})
		   //  		if(temp!=undefined){
		   //  			disc+=temp.name;
		   //  		}else if(items.indexOf("+") > -1){
		   //  				disc += " + " 
					// }else if(items.indexOf("-") > -1){
					// 	disc += " - " 
					// }else if(items.indexOf(" ( ") > -1){
					// 	disc += " ( " 
					// 	// alert(disc)
					// }else if(items.indexOf(" ) ") > -1){
					// 	disc += " ) " 
					// 	// alert(disc)
					// }else if(items.indexOf("*") > -1){
					// 	disc += " * " 
					// }else if(items.indexOf("/") > -1){
					// 	disc += " / " 
					// }
				// });	
				return ret
			}},
			{
				 field: 'formula', title: 'Formula', headerAttributes: {class: 'k-header', style: 'background-color: #313d50 !important;color: white !important;'}, template: function (d) {
				if (d.category !== 'Formula') {
					return ''
				}

				if (formula.devMode()) {
					return d.formula
				}
				var ret = formula.extractFormula(d.formula)
					.map(function (e) { return e.name })
					.join('')
					.replace(/\//g, ' / ')
					.replace(/\-/g, ' - ')
					.replace(/\+/g, ' + ')
					.replace(/\*/g, ' * ')
					.replace(/\(/g, ' ( ')
					.replace(/\)/g, ' ) ')
				// if(ret.indexOf("(") > -1 && ret.indexOf(")") > -1){
				// 	ret.replace(/\(/g, " ( ").replace(/\)/g, " ) ");
				// 	console.log(ret)
				// }
				// console.log("------->>>", d.formula)
				var ar = ret.split(/\s+/);
				var disc = '';
				$.each(ar, function(i, items){
		    		// $.each(formula.data(), function(i, ondis){
		    		// 	console.log(items.indexOf(ondis.alias))
		    		// 	if(items.indexOf(ondis.alias) > -1){
		    		// 		disc += ondis.name 
		    		// 	}
		    		// })
		    		var temp = _.find(formula.data(),function(ondis){ return ondis.alias == items });
		    		// var temp = formula.data()	.find(function(ondis){ return ondis.alias == items})
		    		console.log(temp)
		    		if(temp!=undefined){
		    			disc+=temp.name;
		    		}else if(items.indexOf("+") > -1){
		    				disc += " + " 
					}else if(items.indexOf("-") > -1){
						disc += " - " 
					}else if(items.indexOf(" ( ") > -1){
						disc += " ( " 
						// alert(disc)
					}else if(items.indexOf(" ) ") > -1){
						disc += " ) " 
						// alert(disc)
					}else if(items.indexOf(" x ") > -1){
						disc += " * " 
					}else if(items.indexOf("/") > -1){
						disc += " / " 
					}else{
						disc += " "+items+" "
					}
				});	
				return "<span style='color: black; font-weight: normal;'>"+disc+"<span>"
			} },
		]

		var config = {
			dataSource: {
				data: data
			},
			columns: columns,
			dataBound: function () {
				app.gridBoundTooltipster('.grid')()
				$('#fake-table [data-category]').each(function (i, e) {
					var $row = $(e).closest('tr')
					var category = $(e).attr('data-category')

					if (category == 'Section') {
						$row.addClass('row-section')
						$row.css('font-weight','bold').css('font-size', '20px').css('background-color', '#c6e0b4')
					} else if (category == 'Sub Section') {
						// $row.css('row-sub-section header-bgcolor')
						$row.css('font-weight','bold').css('font-size', '20px').css('background-color', "#f2f2f2")
					} else if (category == 'Formula') {
						$row.addClass('row-formula sub-bgcolor')
						$row.css('font-weight','bold').css('background-color', '#a7adcd !important').css('color', 'white !important')
					}
				})

				$('#fake-table tr [data-direction="up"]:first').addClass('disabled');
				$('#fake-table tr [data-direction="down"]:last').addClass('disabled')
			}
		}

		$('#fake-table').kendoGrid(config)
		$('#fake-table.k-grid tr td').css('border','0.5px solid black')
		var ondate = kendo.toString(new Date(),"dd-MM-yyyy HH mm");
	    // var ind = title.indexOf("-") + 2;
	    // title = title.slice(ind);
	    // var name = title+" "+ ondate.toString();
	    var downloader = $('<a />').attr('href', '#')
	        .attr('download', title+"_"+ondate + '.xls')
	        .attr('onclick', 'return ExcellentExport.excel(this, \'fake-table\', \'sheet1\')')
	        .html('export')
	        .appendTo(body);

	    fakeTable.find('td').css('height', 'inherit');
	    downloader[0].click();

	    setTimeout(function () {
	        fakeTable.remove();
	        downloader.remove();
	        $('.apx-loading').hide()
	    }, 400);

	}, 500)
	

}

formula.renderGlosaary = function(){
	var data = formula.data()

	if ($('.grid-glossary').hasClass('k-grid')) {

		$('.grid-glossary').data('kendoGrid').setDataSource(new kendo.data.DataSource({
			data: data
		}))

		return
	}

	var columns = [
		{ field: 'Name', headerAttributes: {class: 'k-header header-bgcolor', style: 'background-color: #313d50 !important;color: white !important;'}, width: 300, template: function (d) {
			return '<span data-category="' + d.category + '">' + d.name + '</span>'
		} },
		{ field: 'alias', title: 'Field alias', headerAttributes: {class: 'k-header', style: 'background-color: #313d50 !important;color: white !important;'}, template: function (d) {
			if (['Field', 'Formula'].indexOf(d.category) == -1) {
				return ''
			}

			return d.alias
		}, width: 200, attributes: { style: 'text-align: center;' } },
		{ field: 'formula', title: 'Formula (Alias)', headerAttributes: {class: 'k-header', style: 'background-color: #313d50 !important;color: white !important;'}, template: function (d) {
			if (d.category !== 'Formula') {
				return ''
			}

			if (formula.devMode()) {
				return d.formula
			}
			var ret = formula.extractFormula(d.formula)
					.map(function (e) { return e.name })
					.join('')
					.replace(/\//g, ' / ')
					.replace(/\-/g, ' - ')
					.replace(/\+/g, ' + ')
					.replace(/\*/g, ' * ')
					.replace(/\(/g, ' ( ')
					.replace(/\)/g, ' ) ')

			
			return ret
		}},
		{
			 field: 'formula', title: 'Formula', headerAttributes: {class: 'k-header', style: 'background-color: #313d50 !important;color: white !important;'}, template: function (d) {
			if (d.category !== 'Formula') {
				return ''
			}

			if (formula.devMode()) {
				return d.formula
			}
			var ret = formula.extractFormula(d.formula)
					.map(function (e) { return e.name })
					.join('')
					.replace(/\//g, ' / ')
					.replace(/\-/g, ' - ')
					.replace(/\+/g, ' + ')
					.replace(/\*/g, ' * ')
					.replace(/\(/g, ' ( ')
					.replace(/\)/g, ' ) ')

			
			var ar = ret.split(/\s+/);
			var disc = '';
			$.each(ar, function(i, items){
	    		var temp = _.find(formula.data(),function(ondis){ return ondis.alias == items });
	    		// var temp = formula.data()	.find(function(ondis){ return ondis.alias == items})
	    		console.log(temp)
	    		if(temp!=undefined){
	    			disc+=temp.name;
	    		}else if(items.indexOf("+") > -1){
	    				disc += " + " 
				}else if(items.indexOf("-") > -1){
					disc += " - " 
				}else if(items.indexOf(" ( ") > -1){
					disc += " ( " 
					// alert(disc)
				}else if(items.indexOf(" ) ") > -1){
					disc += " ) " 
					// alert(disc)
				}else if(items.indexOf("*") > -1){
					disc += " * " 
				}else if(items.indexOf("/") > -1){
					disc += " / " 
				}else{
					disc += " "+items+" "
				}
			});	
			return "<span style='color: black; font-weight: normal;'>"+disc+"<span>"
		} },
	]

	var config = {
		dataSource: {
			data: data
		},
		columns: columns,
		dataBound: function () {
			app.gridBoundTooltipster('.grid')()
			$('.grid-glossary [data-category]').each(function (i, e) {
				var $row = $(e).closest('tr')
				var category = $(e).attr('data-category')

				if (category == 'Section') {
					$row.addClass('row-section')
					$row.css('font-weight','bold').css('font-size', '14px').css('background-color', '#c6e0b4')
				} else if (category == 'Sub Section') {
					// $row.css('row-sub-section header-bgcolor')
					$row.css('font-weight','bold').css('font-size', '14px').css('background-color', "#f2f2f2")
				} else if (category == 'Formula') {
					$row.addClass('row-formula sub-bgcolor')
					$row.css('font-weight','bold').css('background-color', '#a7adcd !important').css('color', 'white !important')
				}
			})

			$('.grid-glossary tr [data-direction="up"]:first').addClass('disabled');
			$('.grid-glossary tr [data-direction="down"]:last').addClass('disabled')
		}
	}

	$('.grid-glossary').kendoGrid(config)
	$('.grid-glossary.k-grid tr td').css('border','0.5px solid black')

}

formula.exportPDF = function(){
	// return function(){
		var ondate = kendo.toString(new Date(),"dd-MM-yyyy HH mm");
		var draw = kendo.drawing;
        draw.drawDOM($("#content"), {
            avoidLinks: true,
            //paperSize: "A4"
        })
        .then(function(root) {
            return draw.exportPDF(root);
        })
        .done(function(data) {
            kendo.saveAs({
                dataURI: data,
                fileName: "Formula_"+ ondate+".pdf"
            });
        })
	// }
}

$(function () {
	$('.modal').each(function (i, e) {
		$(e).appendTo($('body'))
	})

	formula.initTokenField()
	setTimeout(function(){
		formula.renderGlosaary()
	},500)
	window.refreshFilter()
})