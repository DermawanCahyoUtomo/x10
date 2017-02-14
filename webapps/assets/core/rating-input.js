model.Processing = ko.observable(true)

var ratingMaster = {}; var r = ratingMaster;
r.templateNewData = {
	Id: "",
	ParametersGroup: "",
	Parameters: "",
	Categories: "",
    TimePeriod: '',
    ValueType: "text",
	From : "",
	FieldId : "",
	MultipleCategories: [],
};
r.newRatingMode = ko.observable(false);
r.masterData = ko.observable({});
r.newData = ko.mapping.fromJS(r.templateNewData);
r.mode = ko.observable('main')
r.dataRatingMaster = ko.observableArray([])
r.dataRatingMasterpure = ko.observableArray([])
r.optionParametersGroup = ko.computed(function () {
	return _.map(_.groupBy(r.dataRatingMasterpure(), 'ParametersGroup'), function (v, k) {
		return k
	}).filter(function (d) {
		return d != '';
	})
}, r.dataRatingMaster);
r.optionValueTypes = ko.observableArray([
	{		text : "Default",
		value : ""
	},
	{
		text : "Percentage",
		value : "percentage"
	}
	]);
r.optionParameters = ko.computed(function () {
	return _.map(_.groupBy(r.dataRatingMaster(), 'Parameters'), function (v, k) {
		return k
	}).filter(function (d) {
		return d != '';
	})
}, r.dataRatingMaster);

r.getMasterAD = function (callback) {
	r.dataRatingMaster([])
	app.ajaxPost("/accountdetail/getmasteraccountdetail", {}, function (res) {
		var master = {}
		res.Data.forEach(function (each) {
			master[each.Field] = each.Items.map(function (d) { return d.name })
		})
		
		r.masterData(master);
		if (typeof callback == 'function') {
			callback()
		}
	}, function () {
		r.isLoading(false)
	})
}

r.getMasterAD();

r.getRatingMaster = function (callback) {
	r.dataRatingMaster([])
	r.isLoading(true)
	
	var param = {};

	if(r.newRatingMode())
		param.Id = r.lastId()
	else
		param.Id = r.selectedRatingModelId()

	app.ajaxPost("/rating/getratingmaster", param, function (res) {
		r.isLoading(false)
		r.dataRatingMaster(_.orderBy(res, 'Order'))
		r.dataRatingMasterpure(r.dataRatingMaster())
		if (typeof callback == 'function') {
			callback()
		}
	}, function () {
		r.isLoading(false)
	})
}
r.isLoading = function (what) {
	$('.apx-loading')[what ? 'show' : 'hide']()
	$('.app-content')[what ? 'hide' : 'show']()
}
r.data = ko.observableArray([])
r.placeholderData = ko.observableArray([{
	Id: 'new',
	Name: 'Rating Model New',
	ParametersGroupData: [],
	ParametersData: [],
	CategoriesData: []
}])
r.selectedData = ko.observableArray([])
r.constructData = function (res) {
	var flat = []

	var opSection1 = _.groupBy(res, 'ParametersGroup');
	var opSection2 = _.map(opSection1, function (v, k) {
		return { key: k, data: v, order: _.minBy(v, 'Order').Order };
	});
	var opSection3 = _.sortBy(opSection2, 'order');
	var i = 1, j = 1;
	opSection3.forEach(function (section) {
		var sectionId = 'section-' + i;
		flat.push({
			id: sectionId,
			parentId: null,
			Order: _.minBy(section.data, 'Order').Order,
			Name: section.key,
			Type: 'Section',
			TypeName: 'Parameter Group',
		});
		i++;

		var opSubSection1 = _.groupBy(section.data, 'Parameters');
		var opSubSection2 = _.map(opSubSection1, function (v, k) {
			return { key: k, data: v, order: _.minBy(v, 'Order').Order };
		});
		var opSubSection3 = _.sortBy(opSubSection2, 'order')
		opSubSection3.forEach(function (subSection) {
			var subSectionId = sectionId

			if (subSection.key != '') {
				subSectionId = 'sub-section-' + j;
				flat.push({
					id: subSectionId,
					parentId: sectionId,
					Order: _.minBy(subSection.data, 'Order').Order,
					ParentName: section.key,
					Name: subSection.key,
					Type: 'Sub Section',
					TypeName: 'Parameter',
				});
			}
			j++

			_.sortBy(subSection.data, 'Order').forEach(function (field) {
				flat.push({
					id: field.Id,
					parentId: subSectionId,
					Order: field.Order,
					Name: field.Categories,
					Section: section.key,
					SubSection: subSection.key,
					Type: 'Field',
					TypeName: 'Category',
				});
			});
		});
	});

	return flat;
}
r.lastId = ko.observable("");
r.expand = ko.observable(false);

r.expandfunction = function () {
	if (r.expand()){
		r.expand(false);
	}else{
		r.expand(true);
	}
	r.render();
}

r.delzero = function(e){
			var myval = $(e).val();
			if(myval==0){
				$(e).val("");
			}
		}

r.checkzero = function(e){
			var myval = $(e).val();
			if(myval==""){
				$(e).val(0);
			}
		} 

r.render = function () {
	if($(".grid").data("kendoTreeList")!=undefined)
	saveExpanded();

	var columnData = r.data()
	var data = r.constructData(r.dataRatingMaster())
	data.forEach(function (d) {
		d.columnData = columnData.map(function (e) {
			var o = {};
			o.RatingId = e.Id
			o.RatingName = e.Name

			if (d.Type == 'Section') {
				o.WeightageOfGroupInCreditScore = 0

				var parametersGroupInfo = e.ParametersGroupData.find(function (f) {
					return f.ParametersGroup == d.Name
				})
				if (typeof parametersGroupInfo != 'undefined') {
					o.WeightageOfGroupInCreditScore = parametersGroupInfo.WeightageOfGroupInCreditScore
				}
			} else

			if (d.Type == 'Sub Section') {
				o.WeightageWithinGroup = 0

				var parametersInfo = e.ParametersData.find(function (f) {
					return (f.ParametersGroup == d.ParentName) && (f.Parameters == d.Name)
				})
				if (typeof parametersInfo != 'undefined') {
					o.WeightageWithinGroup = parametersInfo.WeightageWithinGroup
				}
			} else

			if (d.Type == 'Field') {
				o.Score = 0

				var categoriesInfo = e.CategoriesData.find(function (f) {
					return (f.Id == d.id)
				})
				if (typeof categoriesInfo != 'undefined') {
					o.Score = categoriesInfo.Score
				}
			}

			return o
		})
	})
	setExpanded(data);
	var dataSource = new kendo.data.TreeListDataSource({
		data: data,
		schema: {
			model: {
				expanded: r.expand(),
			}
		}
	})

	var columns = [{
    	headerTemplate: 'Name',
    	headerAttributes: { style: 'vertical-align: middle;', class: 'k-header header-bgcolor' },
    	template: function (d) {
        	if (d.Type == 'Field') {
        		return '<span style="font-weight: normal;">' + d.Name + '</span>';
        	}

        	return d.Name;
    	}, // locked: true,
    	width: 300
    }]

    columns.push({
    	headerAttributes: { class: 'k-header header-bgcolor' },
    	attributes: { style: 'text-align: center;' },
    	template: function (d) {
	    	var className = 'btn-primary';

			switch (d.Type) {
				case 'Section': {
					className = 'btn-primary';
				} break;
				case 'Sub Section': {
					className = 'btn-warning';
				} break;
				case 'Field': {
					className = 'btn-success';
				} break;
			}

			return "<button class='btn btn-tag btn-xs " + className + "'>" + d.TypeName + "</button>";
	    },
	    width: 120
	})



    columnData.forEach(function (e, i) {
		// ====== THREE COLUMNS

		var columnSection = {};
		columnSection.headerTemplate = '<center>Weightage of<br />Parameter Group</center>'
		columnSection.headerAttributes = { style: 'vertical-align: middle; text-align: center;', class: 'k-header header-bgcolor' }
		columnSection.attributes = { style: 'position: relative' }
		columnSection.template = function (d) {
			if (d.Type !== 'Section') {
				return ''
			}

			var value = d.columnData[i].WeightageOfGroupInCreditScore
			return [
				'<div class="onright">',
				'<input onclick="r.delzero(this);" onblur="r.checkzero(this);" data-type="' + d.Type + '" data-rating="' + e.Id + '" data-section="' + d.Name + '" value="' + value + '" style="border: none; background-color: transparent; width: 86%; text-align: right; font-weight: normal; padding: 1px 4px;" class="align-right" />',
				'<span>%</span>',
				'</div>'
			].join('')
		}

		var columnSubSection = {};
		columnSubSection.headerTemplate = '<center>Weightage of<br />Parameter</center>'
		columnSubSection.headerAttributes = { style: 'vertical-align: middle; text-align: center;', class: 'k-header header-bgcolor' }
		// columnSubSection.width = 100
		columnSubSection.attributes = { style: 'position: relative' }
		columnSubSection.template = function (d) {
			if (d.Type !== 'Sub Section') {
				return ''
			}

			var value = d.columnData[i].WeightageWithinGroup
			return [
				'<div class="onright">',
				'<input onclick="r.delzero(this);" onblur="r.checkzero(this);" data-type="' + d.Type + '" data-rating="' + e.Id + '" data-section="' + d.ParentName + '" data-sub-section="' + d.Name + '" value="' + value + '" style="border: none; background-color: transparent; width: 86%; text-align: right; font-weight: normal; padding: 1px 4px;" class="align-right" />',
				'<span>%</span>',
				'</div>'
			].join('')
		}

		var columnField = {};
		columnField.headerTemplate = '<center>Score</center>'
		columnField.headerAttributes = { style: 'vertical-align: middle; text-align: center;', class: 'k-header header-bgcolor' }
		// columnField.width = 100
		columnField.attributes = { style: 'position: relative' }
		
		columnField.template = function (d) {
			if (d.Type !== 'Field') {
				return ''
			}

			var value = d.columnData[i].Score
			return '<input onclick="r.delzero(this);" onblur="r.checkzero(this);" data-type="' + d.Type + '" data-rating="' + e.Id + '" data-field-id="' + d.id + '" data-field="' + d.Name + '" data-sub-section="' + d.SubSection + '" data-section="' + d.Section + '" value="' + value + '" style="border: none; background-color: transparent; width: 60%; text-align: right; font-weight: normal; padding: 1px 4px;" class="align-right onright" />'
		}

		columns.push(columnField)
		columns.push(columnSubSection)
		columns.push(columnSection)
    })

    columns.push({
    	width: 100,
    	attributes: { class: 'align-center' },
		headerAttributes: { class: 'k-header header-bgcolor' },
    	headerTemplate: '<center>Use in<br>Rating Model</center>',
    	template: function (d) {
    		// console.log(d)
    		var info = '';

        var e = r.data().filter(function (e) {
          return e
        })

      	if (d.Type == 'Section') {
      		// var issue = r.data()[0].ParametersGroupData.filter(function (e) {
        //     return e.Use
        //   })

      		// if (issue) {
      		// 	info = 'checked'
      		// }

          $.each(r.data()[0].ParametersGroupData, function(i,v){
            if(v.ParametersGroup == d.Name && v.Use){
              info = 'checked'
            }
          })

      		info += " data-section='" + d.Name + "'"
      		return "<input data-type='Section checkbox' data-rating='" + e.Id + "' type='checkbox' " + info + " onchange='r.setVisibility(this, \"" + d.id + "\", \"" + d.Type + "\", \"" + d.Name + "\", \"" + d.ParentName + "\")' />";
      	} else if (d.Type == 'Sub Section') {
      		$.each(r.data()[0].ParametersData, function(i,v){
            if(v.ParametersGroup == d.ParentName && v.Parameters == d.Name && v.Use){
              info = 'checked'
            }
          })

      		info += " data-section='" + d.ParentName + "' data-sub-section='" + d.Name + "'"
      		return "<input data-type='Sub Section checkbox' data-rating='" + e.Id + "' type='checkbox' " + info + " onchange='r.setVisibility(this, \"" + d.id + "\", \"" + d.Type + "\", \"" + d.Name + "\", \"" + d.ParentName + "\")' />";
      	}
    		// if (d.Type == 'Section') {
	    	// 	return [
	     //    		"<input type='checkbox' data-rating='" + d.id + "' data-section='" + d.Name + "'>"
	     //    	].join('&nbsp;')
    		// }

    		// if (d.Type == 'Sub Section') {
	    	// 	return [
	     //    		"<input type='checkbox' data-rating='" + d.id + "' data-section='" + d.ParentName + "' data-sub-section='" + d.Name + "'>"
	     //    	].join('&nbsp;')
    		// }

    		// if (d.Type == 'Field') {
	    	// 	return [
	     //    		"<button class='btn btn-xs btn-primary tooltipster' title='Move up' data-direction='up' onclick=\"r.moveTo(this, '" + d.id + "')\"><i class='fa fa-arrow-up'></i></button>",
	     //    		"<button class='btn btn-xs btn-success tooltipster' title='Move down' data-direction='down' onclick=\"r.moveTo(this, '" + d.id + "')\"><i class='fa fa-arrow-down'></i></button>",
	     //    		"&nbsp;",
	     //    		"<button class='btn btn-xs btn-warning tooltipster' title='Show History' onclick=\"r.getFilledFields(this, '" + d.id + "')\"><i class='fa fa-history'></i></button>",
	     //    		"&nbsp;",
	     //    		"<button class='btn btn-xs btn-primary tooltipster' title='Edit' onclick=\"r.edit(this, '" + d.id + "')\"><i class='fa fa-edit'></i></button>",
	     //    		"<button class='btn btn-xs btn-danger tooltipster' title='Remove' onclick=\"r.remove(this, '" + d.id + "')\"><i class='fa fa-trash'></i></button>",
	     //    	].join('&nbsp;')
    		// }

    		return "&nbsp;"
    	}
    })

    columns.push({
		headerAttributes: { class: 'k-header header-bgcolor' },
    	template: function (d) {
    		if (d.Type == 'Section') {
	    		return [
	        		"<button class='btn btn-xs btn-primary tooltipster moveup-userrights' title='Move up' data-direction='up' onclick=\"r.moveSectionTo(this, '" + d.Name + "')\"><i class='fa fa-arrow-up'></i></button>",
	        		"<button class='btn btn-xs btn-success tooltipster movedown-userrights' title='Move down' data-direction='down' onclick=\"r.moveSectionTo(this, '" + d.Name + "')\"><i class='fa fa-arrow-down'></i></button>",
	        		// "<button class='btn btn-xs btn-primary tooltipster' title='Edit' onclick=\"r.edit(this, '" + d.id + "')\"><i class='fa fa-edit'></i></button>",
	        		"<button class='btn btn-xs btn-danger tooltipster delete-userrights' title='Remove' onclick=\"r.remove(this, '" + d.id + "', '"+d.Name+"', '')\"><i class='fa fa-trash'></i></button>",
	        	].join('&nbsp;')
    		}

    		if (d.Type == 'Sub Section') {
	    		return [
	        		"<button class='btn btn-xs btn-primary tooltipster moveup-userrights' title='Move up' data-direction='up' onclick=\"r.moveSubSectionTo(this, '" + d.ParentName + "', '" + d.Name + "')\"><i class='fa fa-arrow-up'></i></button>",
	        		"<button class='btn btn-xs btn-success tooltipster movedown-userrights' title='Move down' data-direction='down' onclick=\"r.moveSubSectionTo(this, '" + d.ParentName + "', '" + d.Name + "')\"><i class='fa fa-arrow-down'></i></button>",
	        		"<button class='btn btn-xs btn-primary tooltipster edit-userrights' title='Edit' onclick=\"r.edit(this, '" + d.Name + "')\"><i class='fa fa-edit'></i></button>",
	        		"<button class='btn btn-xs btn-danger tooltipster delete-userrights' title='Remove' onclick=\"r.remove(this, '" + d.id + "', '"+d.ParentName+"','"+d.Name+"')\"><i class='fa fa-trash'></i></button>",
	        	].join('&nbsp;')
    		}

    		if (d.Type == 'Field') {
	    		return [
	        		"<button class='btn btn-xs btn-primary tooltipster moveup-userrights' title='Move up' data-direction='up' onclick=\"r.moveTo(this, '" + d.id + "')\"><i class='fa fa-arrow-up'></i></button>",
	        		"<button class='btn btn-xs btn-success tooltipster movedown-userrights' title='Move down' data-direction='down' onclick=\"r.moveTo(this, '" + d.id + "')\"><i class='fa fa-arrow-down'></i></button>",
	        		// "&nbsp;",
	        		// "<button class='btn btn-xs btn-warning tooltipster' title='Show History' onclick=\"r.getFilledFields(this, '" + d.id + "')\"><i class='fa fa-history'></i></button>",
	        		// "&nbsp;",
	        		// "<button class='btn btn-xs btn-primary tooltipster' title='Edit' onclick=\"r.edit(this, '" + d.id + "')\"><i class='fa fa-edit'></i></button>",
	        		// "<button class='btn btn-xs btn-danger tooltipster' title='Remove' onclick=\"r.remove(this, '" + d.id + "', '', '')\"><i class='fa fa-trash'></i></button>",
	        	].join('&nbsp;')
    		}

    		return "&nbsp;"
    	},
    	width: 160
    })

	var config = {
		dataSource: dataSource,
		columns: columns,
		dataBound: function () {
			var $container1 = $('.grid .k-grid-header .k-grid-header-wrap table thead')
			var $tr = $('<tr />').prependTo($container1)
			$('<td >').appendTo($tr)
				.html('&nbsp;')
				.attr('colspan', 2)
				.attr('style', 'background-color: #fafafa; border: none;')

			columnData.forEach(function (e, i) {
				var $td = $('<th />').appendTo($tr)
					.attr('colspan', 4) // #a8a8a8
					.attr('style', 'padding: 5px; color: #27ae60; text-align: center; border-bottom: 1px solid white; border-left: 1px solid #dbdbdb;')

				var $input = $('<input />').appendTo($td)
					.attr('style', 'padding: 5px; width: 97%;') // width: 200px;')
					.attr('data-rating-id', e.Id)
					.val(e.Name)
			})

			// $('.grid .k-grid-content input[data-rating]').each(function (i, e) {
			// 	$(e).number(true, 2)
			// })

			// $('.grid .k-grid-content input[data-type="Field"]').each(function (i, e) {
			// 	$(e).number(true, 0)
			// })

			// $('.grid .k-grid-content input').each(function (i, e) {
			// 	console.log($(e))
			// })

			var dataView = this.dataSource.view();
			for(var i = 0; i < dataView.length; i++){
				// console.log(dataView);
				if (dataView[i].Type === "Section") {
		            var uid = dataView[i].uid;
		            var tr = $(".grid tbody").find("tr[data-uid=" + uid + "]");
		            tr.find('td').eq(4);
		            tr.find('td').eq(0).addClass('section header-bgcolor');
		            tr.find('td').eq(1).addClass('section header-bgcolor');
		            tr.find('td').eq(2).addClass('section header-bgcolor');
		            tr.find('td').eq(3).addClass('section header-bgcolor');
		            tr.find('td').eq(4).addClass('section header-bgcolor');
		            tr.find('td').eq(5).addClass('section header-bgcolor');
		        }
		        else {
		            var uid = dataView[i].uid;
		            var tr = $(".grid tbody").find("tr[data-uid=" + uid + "]");
		            tr.find('td').eq(4).addClass('coba')
		        }

		        if (dataView[i].Type === "Sub Section") {
		            var uid = dataView[i].uid;
		            var tr = $(".grid tbody").find("tr[data-uid=" + uid + "]");
		            tr.find('td').eq(3);
		            tr.find('td').eq(0).addClass('sub-section sub-bgcolor');
		            tr.find('td').eq(1).addClass('sub-section sub-bgcolor');
		            tr.find('td').eq(2).addClass('sub-section sub-bgcolor');
		            tr.find('td').eq(3).addClass('sub-section sub-bgcolor');
		            tr.find('td').eq(4).addClass('sub-section sub-bgcolor');
		            tr.find('td').eq(5).addClass('sub-section sub-bgcolor');
		        }
		        else {
		            var uid = dataView[i].uid;
		            var tr = $(".grid tbody").find("tr[data-uid=" + uid + "]");
		            tr.find('td').eq(3).addClass('coba')
		        }

		        if (dataView[i].Type === "Field") {
		            var uid = dataView[i].uid;
		            var tr = $(".grid tbody").find("tr[data-uid=" + uid + "]");
		            tr.find('td').eq(2)
		            tr.addClass('three');
		        }
		        else {
		            var uid = dataView[i].uid;
		            var tr = $(".grid tbody").find("tr[data-uid=" + uid + "]");
		            tr.find('td').eq(2).addClass('coba')
		        }
			}



        	// $('.grid tr [data-direction="up"]:first').css('visibility', 'hidden');
			// $('.grid tr [data-direction="down"]:last').css('visibility', 'hidden');

			app.gridBoundTooltipster('.grid')()
		}
	}

	$('.grid').replaceWith('<div class="grid"></div>')
	$('.grid').kendoTreeList(config)
}
r.getFilledData = function () {
	var columnData = r.data()
	var els = $('.grid input[data-rating]')
	var newData = columnData.map(function (d) {
		var o = {}
		o.Id = d.Id
		o.Name = $('[data-rating-id="' + d.Id + '"]').val()
		o.CreatedAt = columnData[0].CreatedAt
		o.ParametersGroupData = []
		o.ParametersData = []
		o.CategoriesData = []

    els.filter('[data-type="Section"][data-rating="' + d.Id + '"][data-section]').each(function (i, e) {
    	var value = parseFloat($(e).val())
    	// if (value == 0) {
    	// 	return
    	// }

  		o.ParametersGroupData.push({
  			ParametersGroup: $(e).attr('data-section'),
  			WeightageOfGroupInCreditScore: value,
        Use: false
  		})
    })

    els.filter('[data-type="Sub Section"][data-rating="' + d.Id + '"][data-sub-section]').each(function (i, e) {
    	var value = parseFloat($(e).val())
    	// if (value == 0) {
    	// 	return
    	// }

  		o.ParametersData.push({
  			ParametersGroup: $(e).attr('data-section'),
  			Parameters: $(e).attr('data-sub-section'),
  			WeightageWithinGroup: value,
        Use: false
  		})
    })

    els.filter('[data-type="Field"][data-rating="' + d.Id + '"][data-field]').each(function (i, e) {
    	var value = parseFloat($(e).val())
    	// if (value == 0) {
    	// 	return
    	// }

  		o.CategoriesData.push({
  			Id:  $(e).attr('data-field-id'),
  			Definition: '',
  			Profile: '',
  			Score: value
  		})
    })

    els.filter('[data-type="Section checkbox"]').each(function (i, e) {
      o.ParametersGroupData[i].Use = e.checked;
    })

    els.filter('[data-type="Sub Section checkbox"]').each(function (i, e) {
      o.ParametersData[i].Use = e.checked;
    })

    // if (data.length > 0 ){
    //   if (data[1] == "Section"){

    //   } else if(data[1] == "Sub Section"){
    //     $.each(o.ParametersData, function(i,v){
    //       if (v.Parameters == data[3] && v.ParametersGroup == data[4]){
    //         o.ParametersData[i].Use =
    //       }
    //     })
    //   }
    // }

    return o
	})

	var otherData = r.data().filter(function (d) {
		return newData.map(function (e) { return e.Id }).indexOf(d.Id) == -1
	})

	return newData // .concat(otherData)
}
r.needToSaveMaster = ko.observable(false)
r.saveRatingMaster = function (callback,datamaster) {
	var param = {}
	param.Data =  datamaster; 

	r.isLoading(true)
	app.ajaxPost("/rating/saveratingmaster", param, function (res) {
		r.dataRatingMaster(res)

		if (typeof callback == 'function') {
			callback()
		}
	}, function () {
		r.isLoading(false)
	})
}



r.checkValid = function(value){
	var val = 100
	if(value != val) {
		return false
	}

	return true
}

r.validateLev2 = function(key, val) {
	var dataMasterLev2 = _.groupBy(val, 'Parameters')
	var filledData = r.getFilledData()
	var totalLev2 = 0

	$.each(dataMasterLev2, function(key1, val1){
		$.each(filledData[0].ParametersData, function(key2, val2){
			if(key1 == val2.Parameters && key == val2.ParametersGroup) {
				totalLev2 += val2.WeightageWithinGroup
			}
		})
	})

	if(r.checkValid(totalLev2)) {
		return true
	}

	return false
}

r.validateBeforeSave = function() {
	var dataMaster = _.groupBy(r.dataRatingMaster(), 'ParametersGroup')
	var filledData = r.getFilledData()
	var valid = true
	var text = ""

	var totalLev1 = 0
	$.each(dataMaster, function(key, val){
		$.each(filledData[0].ParametersGroupData, function(key2, val2){
			if(key == val2.ParametersGroup) {
				totalLev1 += val2.WeightageOfGroupInCreditScore
			}
		})

		valid = r.validateLev2(key, val)

		if(!valid) {
			text = "Total “Weightage of Parameter” on “"+key+"” is not 100%"
			return valid
		}
	})

	if(valid && !r.checkValid(totalLev1)) {
		valid = false
		text = "Total \"Weightage of Parameter Group\" is not 100%"
	}

	console.log(text)
	return text
}

r.newFilleData = ko.observableArray([]);

r.save = function () {
	result = r.validateBeforeSave()
	if( result != "") {
		swal({
		title: "Data Not Valid",
		text: result,
		type: "warning",
		})
	} else {
		var datamaster = JSON.parse(JSON.stringify(r.dataRatingMaster()))
		r.newFilleData([]);
		var datapre = JSON.parse(JSON.stringify(r.getFilledData()[0].CategoriesData));
		datamaster.forEach(function(dt){
			var pre = _.find(datapre,function(x){ return x.Id == dt.Id});
			var Id =  r.selectedRatingModelId() + dt.ParametersGroup + dt.Parameters + dt.Categories + dt.Operator + dt.Value1 + dt.Value2;
			if(pre!=undefined){
				pre.Id = Id;
			}
			dt.Id = Id;
		});

		var datafinal = JSON.parse(JSON.stringify(r.getFilledData()[0]));
		datafinal.CategoriesData = datapre;
		r.newFilleData().push(datafinal);

		var doSave = function () {
			var param = {}
			param.Data = r.newFilleData();

			r.isLoading(true)
			app.ajaxPost('/rating/saveratingdata', param, function (res) {
				if (res.Message != '') {
					r.isLoading(false)
					return
				}
				r.newRatingMode(false);

				if (res.Data.length > 0) {
					r.selectedRatingModelId(res.Data[0])
				}

				r.isLoading(false)
				// r.refresh()
				r.openRating(r.selectedRatingModelId());
			}, function () {
				r.isLoading(false)
			})
		}

		// if (r.needToSaveMaster()) {
			r.saveRatingMaster(doSave,datamaster);
		// } else {
			// doSave()
		// }
	}
}
r.refresh = function (callback) {
	r.needToSaveMaster(false)
	r.getRatingMaster(function () {
		r.isLoading(true)

		var param = {}
		param.Id = r.selectedRatingModelId()
		app.ajaxPost('/rating/getratingdata', param, function (res) {
			if (res.Message != '') {
				r.isLoading(false)
				return
			}

			var data = r.placeholderData().slice(0)
			if (res.Data.length > 0) {
				data = res.Data
			}

			if (typeof callback == 'function') {
				callback(data)
			}

			r.isLoading(false)
			r.data(data)
			r.render()
		})
	}, function () {
		r.isLoading(false)
	})
}
r.test = function () {
	r.getRatingMaster(function () {
		r.selectedData(r.data().map(function (d) { return d.Id }))
		r.render()
	})
}

r.selectedRatingModelId = ko.observable('')
r.refreshMain = function () {
	r.isLoading(true)
	app.ajaxPost('/rating/getratingdata', {}, function (res) {
		if (res.Message != '') {
			sweetAlert("Oops...", res.Message, "error");
			r.isLoading(false)
			return
		}

		r.isLoading(false)
		r.renderMain(res.Data)
	})
}

r.renderMain = function (data) {
	var config = {
		dataSource: {
			data: data
		},
		columns: [{
			field: 'Name',
			title: 'Model Name',
			headerAttributes: { "class": "header-bgcolor" }
		}, {
			width: 160,
			headerAttributes: { "class": "header-bgcolor" },
			attributes: { style: 'text-align: center;' },
			template: function (d) {
				return [
					'<button class="btn btn-xs btn-confirm open-userrights" onclick="r.openRating(\'' + d.Id + '\')"><i class="fa fa-eye"></i> Open</button>',
					'<button class="btn btn-xs btn-reset delete-userrights" onclick="r.deleteRating(\'' + d.Id + '\')"><i class="fa fa-trash"></i> Delete</button>',
				].join('&nbsp;')
			}
		}]
	}

	if (data.length == 0) {
		config = {
			dataSource: {
				data: [{ message: 'No data found' }]
			},
			column: [{
				title: '&nbsp;',
				field: 'message'
			}]
		}
	}

	$('.main').replaceWith('<div class="main"></div>')
	$('.main').kendoGrid(config)
}
r.openRating = function (id) {
	r.mode('detail')

	r.selectedRatingModelId(id)
	r.refresh()
};
r.newRatingModel = function () {
	r.mode('detail')
	r.newRatingMode(true);

	// r.getRatingMaster(function () {
		r.isLoading(true);

		ajaxPost('/rating/newratingdata', {}, function (res) {
			r.lastId(res.lastId)
			r.selectedRatingModelId(res.data.Id)
			r.data([res.data])
			r.getRatingMaster(r.render)

			// r.isLoading(false)
		}, function () {
			r.isLoading(false)
		})
	// })
};
r.backToMain = function () {
	r.mode('main')
	r.newRatingMode(false);
	r.selectedRatingModelId('')

	r.refreshMain()
}
r.deleteRating = function (id) {
	swal({
		title: "Are you sure?",
		text: "Rating model will be deleted",
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Yes, delete it",
	}).then(function() {
		var param = {}
		param.Id = id

	    app.ajaxPost("/rating/deleteratingdata", param, function (res) {
	        if (res.Message != '') {
	            sweetAlert("Oops...", res.Message, "error");
	            return;
	        }

	        swal("Success", "Item deleted", "success");
	    	r.refreshMain()
	    });
	});
}

r.moveSectionTo = function (o, Section) {
	r.needToSaveMaster(true)
	var direction = $(o).attr('data-direction');

	var op1 = _.groupBy(r.dataRatingMaster(), 'ParametersGroup')
	var op2 = _.map(op1, function (v, k) {
		return { key: k, Order: _.minBy(v, 'Order').Order }
	})
	var op3 = _.orderBy(op2, 'Order')
	var now = []

	var target = op3.find(function (d) { return d.key == Section })
	var targetPrev, targetNext;

	try {
		targetPrev = op3[op3.indexOf(target) - 1]
	} catch (err) {}

	try {
		targetNext = op3[op3.indexOf(target) + 1]
	} catch (err) {}

	if (direction == 'up' && (typeof targetPrev !== 'undefined')) {
		now = op3.filter(function (d, i) {
			return i < op3.indexOf(targetPrev)
		})
		.concat([target, targetPrev])
		.concat(op3.filter(function (d, i) {
			return i > op3.indexOf(target)
		}))
	}

	if (direction == 'down' && (typeof targetNext !== 'undefined')) {
		now = op3.filter(function (d, i) {
			return i < op3.indexOf(target)
		})
		.concat([targetNext, target])
		.concat(op3.filter(function (d, i) {
			return i > op3.indexOf(targetNext)
		}))
	}

	if (now.length == 0) {
		return
	}

	var reorderedData = []
	now.forEach(function (d) {
		var oc1 = r.dataRatingMaster().filter(function (e) {
			return e.ParametersGroup == d.key
		})
		var oc2 = _.orderBy(oc1, 'Order')

		reorderedData = reorderedData.concat(oc2)
	})
	reorderedData = _.map(reorderedData, function (d, i) {
		d.Order = (i + 1)
		return d
	})

	r.dataRatingMaster(reorderedData);
	r.render();
}

r.moveSubSectionTo = function (o, Section, SubSection) {
	r.needToSaveMaster(true)
	var direction = $(o).attr('data-direction');
	var targetKey = [Section, SubSection].join('_')

	var op1 = _.groupBy(r.dataRatingMaster(), function (d) {
		return [d.ParametersGroup, d.Parameters].join('_')
	})
	var op2 = _.map(op1, function (v, k) {
		return { key: k, Order: _.minBy(v, 'Order').Order }
	})
	var op3 = _.orderBy(op2, 'Order')
	var now = []

	var target = op3.find(function (d) { return d.key == targetKey })
	var targetPrev, targetNext;

	try {
		targetPrev = op3[op3.indexOf(target) - 1]
	} catch (err) {}

	try {
		targetNext = op3[op3.indexOf(target) + 1]
	} catch (err) {}

	if (direction == 'up' && (typeof targetPrev !== 'undefined')) {
		now = op3.filter(function (d, i) {
			return i < op3.indexOf(targetPrev)
		})
		.concat([target, targetPrev])
		.concat(op3.filter(function (d, i) {
			return i > op3.indexOf(target)
		}))
	}

	if (direction == 'down' && (typeof targetNext !== 'undefined')) {
		now = op3.filter(function (d, i) {
			return i < op3.indexOf(target)
		})
		.concat([targetNext, target])
		.concat(op3.filter(function (d, i) {
			return i > op3.indexOf(targetNext)
		}))
	}

	if (now.length == 0) {
		return
	}

	var reorderedData = []
	now.forEach(function (d) {
		var oc1 = r.dataRatingMaster().filter(function (e) {
			return [e.ParametersGroup, e.Parameters].join('_') == d.key
		})
		var oc2 = _.orderBy(oc1, 'Order')

		reorderedData = reorderedData.concat(oc2)
	})
	reorderedData = _.map(reorderedData, function (d, i) {
		d.Order = (i + 1)
		return d
	})

	r.dataRatingMaster(reorderedData);
	r.render();
}
r.moveTo = function (o, id) {
	r.needToSaveMaster(true)
	var direction = $(o).attr('data-direction');

	var rowData = r.dataRatingMaster().find(function (d) { return d.Id == id });
	var rowDataPrev, rowDataNext;

	try {
		rowDataPrev = r.dataRatingMaster()[r.dataRatingMaster().indexOf(rowData) - 1];
	} catch (err) { }

	try {
		rowDataNext = r.dataRatingMaster()[r.dataRatingMaster().indexOf(rowData) + 1];
	} catch (err) { }

	console.log('direction', direction)
	console.log('rowDataPrev', rowDataPrev)
	console.log('rowDataNext', rowDataNext)

	if (direction == 'up' && (typeof rowDataPrev !== 'undefined')) {
		var rowDataPrevCloned = $.extend(true, {}, rowDataPrev);
		var rowDataCloned = $.extend(true, {}, rowData);

		rowDataPrev.Order = rowDataCloned.Order;

		rowData.Order = rowDataPrevCloned.Order;
		rowData.ParametersGroup = rowDataPrevCloned.ParametersGroup;
		rowData.Parameters = rowDataPrevCloned.Parameters;
	}

	if (direction == 'down' && (typeof rowDataNext !== 'undefined')) {
		var rowDataNextCloned = $.extend(true, {}, rowDataNext);
		var rowDataCloned = $.extend(true, {}, rowData);

		rowDataNext.Order = rowDataCloned.Order;

		rowData.Order = rowDataNextCloned.Order;
		rowData.ParametersGroup = rowDataNextCloned.ParametersGroup;
		rowData.Parameters = rowDataNextCloned.Parameters;
	}

	var opRes1 = _.orderBy(r.dataRatingMaster(), 'Order')
	var opRes2 = _.map(opRes1, function (d, i) {
		d.Order = (i + 1)
		return d
	})

	r.dataRatingMaster(opRes2);
	r.render();
}

r.removeCategory = function(index,id){
	return function () {
		
		if(id !=undefined)
		r.remove(undefined,id(),'','');
		else{
			var realEsates = r.newData.MultipleCategories().filter(function (d, i) {
				return i !== index
			});
			r.newData.MultipleCategories(realEsates)
		}
	}
}

r.normalisasi = function(){
	addcategorymen();
	var index = r.newData.MultipleCategories().length - 1;
	var realEsates = r.newData.MultipleCategories().filter(function (d, i) {
			return i !== index
		});
	r.newData.MultipleCategories(realEsates);
}

r.edit = function (o, id) {
	if(r.newRatingMode()){
		swal("Warning","Please save this new rating first","warning");
		return
	}

	var rowData = r.dataRatingMaster().filter(function (d) { return d.Parameters == id });
	$('.modal-add-new').modal('show');
	ko.mapping.fromJS(rowData[0], r.newData);
	r.newData.MultipleCategories([]);
	r.newDataBackup = [];
	rowData.forEach(function(x){
		r.newData.MultipleCategories.push(ko.mapping.fromJS(x));
		r.newDataBackup.push(x); 	
	});
	r.dropDownModeChange(r.newData.FieldId(),false);
	r.normalisasi();
	formula.changeFrom()
}

r.emptyDropDown = function (o) {
	var $target = $(o).closest('.col-sm-12').next().find('select')
	$target.data('kendoDropDownList').value('')
	r.dataRatingMaster(r.dataRatingMasterpure());
}



r.saveNewData = function (e) {
	e.preventDefault();

	r.restructureNewMaster();
	// var info = ko.mapping.toJS(r.newData)

	// if (info.Id == '') {
	// 	var rowByParametersGroup = r.dataRatingMaster().filter(function (d) {
	// 		return d.ParametersGroup == info.ParametersGroup
	// 	})
	// 	if (rowByParametersGroup.length > 0) {
	// 		var rowByParameters = rowByParametersGroup.filter(function (d) {
	// 			return d.SubSection == info.SubSection
	// 		})
	// 		if (rowByParameters.length > 0) {
	// 			rowByParametersGroup = rowByParameters
	// 		}
	// 	}

	// 	if (rowByParametersGroup.length > 0) {
	// 		info.Order = _.maxBy(rowByParametersGroup, 'Order').Order + 1
	// 	} else {
	// 		info.Order = _.maxBy(r.dataRatingMaster(), 'Order').Order + 1
	// 	}
	// }

 //  //check parameter group
 //  $.each(r.data(), function(i,v){
 //    Id = $('[data-rating-id]').attr('data-rating-id');
 //    addnewparametergroup = true;
 //    addnewparameter = true;

 //    if(v.Id == Id){
 //      $.each(v.ParametersGroupData, function(i2,v2){
 //        if(info.ParametersGroup == v2.ParametersGroup){
 //          addnewparametergroup = false;
 //        }
 //      })

 //      if (addnewparametergroup){
 //        r.data()[i].ParametersGroupData.push({
 //          ParametersGroup: info.ParametersGroup,
 //          Use: true,
 //          WeightageOfGroupInCreditScore: 0,
 //        })
 //      }

 //      $.each(v.ParametersData, function(i2,v2){
 //        if(info.Parameters == v2.Parameters && info.ParametersGroup == v2.ParametersGroup){
 //          addnewparameter = false;
 //        }
 //      })

 //      if (addnewparameter){
 //        r.data()[i].ParametersData.push({
 //          Parameters: info.Parameters,
 //          ParametersGroup: info.ParametersGroup,
 //          Use: true,
 //          WeightageOfGroupInCreditScore: 0,
 //        })
 //      }

 //    }

 //  })

 //  var param = {}
 //  param.Data = r.data()
 //  // console.log(param)
 //  app.ajaxPost('/rating/saveratingdata', param, function (res) {
 //  });

 //  app.ajaxPost("/rating/addratingmaster", info, function (res) {
 //    if (res.Message != '') {
 //        sweetAlert("Oops...", res.Message, "error");
 //        return;
 //    }
 //  });

	// if(info.MultipleCategories.length > 0){
	// 	// var Categories = info.Categories;
	// 	$.each(info.MultipleCategories, function(k,v){
	// 		info.Categories = v.Categories;
	// 		app.ajaxPost("/rating/addratingmaster", info, function (res) {
	//       if (res.Message != '') {
	//           sweetAlert("Oops...", res.Message, "error");
	//           return;
	//       }
	// 	  });
	// 	});

	//   swal("Success!", "New item saved!", "success");
 //  	r.refresh();
 //  	$('.modal-add-new').modal('hide');
	// } else{
    // swal("Success", "New item saved", "success");
  	// r.refresh();
  	// $('.modal-add-new').modal('hide');
	// }
};

r.showFormAdd = function () {
	$('.modal-add-new').find('select').each(function (i, e) {
		$(e).data('kendoDropDownList').value('')
	})
	ko.mapping.fromJS(r.templateNewData, r.newData)
	r.newData.MultipleCategories([]);
	r.dropDownMode(false);
	r.newDataBackup = [];
	$('.modal-add-new').modal('show')
}

r.getFilledFields = function (o, id) {
	$('.modal-history').modal('show')
	$('.modal-history .grid-history').html('Loading ...')

	var param = {}
	param.Id = id

	var fieldInfo = r.dataRatingMaster().find(function (e) {
		return e.Id == id
	})
	if (typeof fieldInfo == 'undefined') {
		fieldInfo = {
			ParametersGroup: '',
			Parameters: '',
			Categories: '',
		}
	}

    app.ajaxPost("/rating/getfilledratingmaster", param, function (res) {
        if (res.Message != '') {
            sweetAlert("Oops...", res.Message, "error");
            return;
        }

    	let rowData = [];
    	res.Data.forEach(function (d) {
			let o = {}
			o.ParametersGroup = fieldInfo.ParametersGroup;
			o.Parameters = fieldInfo.Parameters;
			o.Categories = fieldInfo.Categories;
			o.RatingName = d.name
			o.key = [o.ParametersGroup, o.Parameters, o.Categories, o.RatingName].join('_')
			o.Value = d.categoriesdata.score

			rowData.push(o)
		});

		var columns = [
			{ field: 'RatingName', title: 'Rating Model', width: 100 },
			{ field: 'ParametersGroup', title: 'Parameter Group', width: 250 },
			{ field: 'Parameters', title: 'Parameter' },
			{ field: 'Categories', title: 'Category' },
			{ field: 'Value', title: 'Score', width: 100, attributes: { style: 'text-align: right; font-weight: normal;' } },
		]

		var gridConfig = {
			dataSource: {
				data: rowData
			},
			columns: columns
		}

		console.log('gridConfig', gridConfig)
		console.log('columns', columns)

		setTimeout(function () {
			$('.modal-history .modal-title').html('History of categories ' + fieldInfo.Categories)
			$('.modal-history .grid-history').replaceWith('<div class="grid-history"></div>')
			$('.modal-history .grid-history').kendoGrid(gridConfig)
		}, 200)
    });
}

r.removeBeforeSave = function(param){
    app.ajaxPost("/rating/removebeforesave", param, function (res) {
      if (res.Message != '') {
          sweetAlert("Oops...", res.Message, "error");
          return;
      }
  });
}

r.remove = function (o, id, sec, subsec) {
	if(r.newRatingMode()){
		swal("Warning","Please save this new rating first","warning");
		return
	}


  var text = '';
  if (subsec != "" && sec != ""){
    text = "Category Inside This will be deleted too"
  } else if (sec != ""){
    text = "Parameter and Category Inside This will be deleted too"
  } else{
    text = "Categories will be deleted"
  }
  swal({
    title: "Are you sure?",
    text: text,
    type: "warning",
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    confirmButtonText: "Yes, delete it"
  }).then(function() {
    if (subsec != "" && sec != ""){
      //subsec
      $.each(r.dataRatingMaster(), function(i,v){
        if(v.ParametersGroup == sec && v.Parameters == subsec){
          var param = {}
          param.Id = v.Id
          app.ajaxPost("/rating/removeratingmaster", param, function (res) {
              if (res.Message != '') {
                  sweetAlert("Oops...", res.Message, "error");
                  return;
              }
          });
        }
      });
    } else if (sec != ""){
      //sec
      $.each(r.dataRatingMaster(), function(i,v){
        if(v.ParametersGroup == sec){
          var param = {}
          param.Id = v.Id
          app.ajaxPost("/rating/removeratingmaster", param, function (res) {
              if (res.Message != '') {
                  sweetAlert("Oops...", res.Message, "error");
                  return;
              }
          });
        }
      });
    } else{
      //other
      var param = {}
      param.Id = id
      app.ajaxPost("/rating/removeratingmaster", param, function (res) {
          if (res.Message != '') {
              sweetAlert("Oops...", res.Message, "error");
              return;
          }
          r.removeBackUp(id);
          var realEsates = r.newData.MultipleCategories().filter(function (d, i) {
				return d.Id() != id;
			});
		  r.newData.MultipleCategories(realEsates);
      });
    }
    swal("Success", "Item deleted", "success");
    r.refresh(r.saveFinishing());
  });
}

r.setVisibility = function (o, id, type, name, parentName) {
  // r.getFilledData()
	if (type == 'Section') {
		// var rowDataSection = r.getFilledData().filter(function (d) { return d.ParametersGroupData })
		// rowDataSection.forEach(function (d) {
		// 	if(d.ParametersGroup == name){
		// 		d.Use = o.checked;
		// 	}
		// })

		$('.grid input[type="checkbox"][data-section="' + name + '"]').prop('checked', o.checked)
	} else if (type == 'Sub Section') {
		// var rowDataSubSection = r.getFilledData().filter(function (d) {
		// 	return (d.Section == parentName) && (d.SubSection == name)
		// })
		// rowDataSubSection.forEach(function (d) {
		// 	d.Use = o.checked;
		// })

		$('.grid input[type="checkbox"][data-section="' + parentName + '"][data-sub-section="' + name + '"]').prop('checked', o.checked)
	}
	// else if (type == 'Field') {
	// 	var rowData = r.data().find(function (d) { return d.Id == id });
	// 	rowData.Use = o.checked;
	// }
	// console.log('arguments', arguments)
}

$(function () {
	r.refreshMain()
	// r.test()
	// r.refresh(function (data) {
	// 	r.selectedData(data.map(function (d) { return d.Id }))
	// })
	$('.modal').appendTo($('body'))
	$('.form-add').on('submit', r.saveNewData)
	$('.box-footer').hide();
});

function changeparamgroup(e){
	var dataItem = this.dataItem(e.item);
	console.log(dataItem);
	if(dataItem.toLowerCase() == "select one"){
		r.newData.ParametersGroup("");
	}
	r.dataRatingMaster([]);
	$.each(r.dataRatingMasterpure(), function(k,v){
		if (v.ParametersGroup == dataItem){
			r.dataRatingMaster.push(v)
		}
	})
}

function changeparam(e){
	var dataItem = this.dataItem(e.item);
	if(dataItem.toLowerCase() == "select one"){
		r.newData.Parameters("");
	}
}

var formula = {}
formula.data = ko.observableArray([])

formula.templateFinancial = {
    Categories: '',
    Product: '',
    Operator: '',
    Value1: '',
    Value2: '',
}

// formula.financial = ko.mapping.fromJS(formula.templateFinancial)

function addcategorymen(){
	$(".modal-dialog").css("overflow", "auto")
	r.newData.MultipleCategories.push(ko.mapping.fromJS(formula.templateFinancial))
}

r.dropDownMode = ko.observable(false);

formula.selectField = function(){
	var name = this.value();
	r.dropDownModeChange(name,true);
}

r.dropDownModeChange = function(name,reset){
	var field = formula.optionFields().find(function (d) {
		return d.alias == name
	});
	var deletedfield = 0;
	if(reset){
				r.newData.MultipleCategories([]);
		}

	if(field.master != undefined){
		r.dropDownMode(true);
		r.masterData()[field.master].forEach(function(x){
			if(reset){
				r.newData.MultipleCategories.push(ko.mapping.fromJS({
					Categories : x,
					Operator : "equal",
					Value1 : x,
					Value2 : "",
				}))
			}else{
				var dt = _.find(r.newData.MultipleCategories(),function(cx){
					return cx.Value1() === x;
				});
				if(dt == undefined){
						r.newData.MultipleCategories.push(ko.mapping.fromJS({
						Categories : x,
						Operator : "equal",
						Value1 : x,
						Value2 : "",
					}))
					deletedfield++;
				}
			}
		});
		r.newData.MultipleCategories(_.filter(r.newData.MultipleCategories(),function(cv){ return r.masterData()[field.master].indexOf(cv.Value1()) > -1 }));
		if(deletedfield>0){
			Materialize.toast("System automatically delete " + deletedfield + " saved categories that not match with dropdown values", 5000);
            $('.toast').css("background-color","#F26419").css("color","white")
		}
	}else{
		r.dropDownMode(false);
	}
};

formula.optionTimePeriod = ko.observableArray([
	{ value: "estimated preferred", text: "Estimated Preferred" },
	{ value: "provisional preferred", text: "Provisional Preferred" },
	{ value: "last audited", text: "Last Audited Year Available" },
	{ value: "not applicable", text: "Not Applicable" },
])
formula.optionProducts = ko.observableArray([
	"Purchase Invoice Finance"
])
// formula.financial = ko.mapping.fromJS(formula.templateFinancial)
formula.optionNormTypes = ko.observableArray([
	{ value: "min", text: 'Min' },
	{ value: "max", text: 'Max' },
	{ value: "greater than or equal", text: 'Greater Than or Equal to' },
	{ value: "lower than or equal", text: 'Lower Than or Equal to' },
	{ value: "equal", text: 'Equal' },
	{ value: "between", text: 'Between' },
])
formula.selectNormType = function (idx) {
	return function(){
		formula.financial = r.newData.MultipleCategories()[idx]
		formula.financial.Value1('')
		formula.financial.Value2('')
	}
}
formula.selectedSubSection = ko.observable('')
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

		var value = ""

		if (typeof this.value === "function")
		value = this.value()
		else
		value = r.newData.From();
	
		if (value == '') {
				r.newData.TimePeriod('')
			return
		}

		var row = formula.optionFrom().find(function (d) {
			return d.name == value
		})
		if (row != undefined) {
			if (row.type == 'balance sheet') {
					r.newData.TimePeriod('last audited')
				return
			}
		}

		r.newData.TimePeriod('not applicable')
}

formula.optionFields =  ko.computed(function () {
		if (r.newData.From() == '') {
			return [];
		}

		var row = formula.optionFrom().find(function (d) {
			return d.name == r.newData.From()
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

r.normalisasiData = function(infox){
	var info = ko.mapping.toJS(infox);

	if (info.Id == '') {
		var rowByParametersGroup = r.dataRatingMaster().filter(function (d) {
			return d.ParametersGroup == info.ParametersGroup
		})
		if (rowByParametersGroup.length > 0) {
			var rowByParameters = rowByParametersGroup.filter(function (d) {
				return d.SubSection == info.SubSection
			})
			if (rowByParameters.length > 0) {
				rowByParametersGroup = rowByParameters
			}
		}

		if (rowByParametersGroup.length > 0) {
			info.Order = _.maxBy(rowByParametersGroup, 'Order').Order + 1
		} else {
			info.Order = _.maxBy(r.dataRatingMaster(), 'Order').Order + 1
		}
	}

  //check parameter group
  $.each(r.data(), function(i,v){
    Id = $('[data-rating-id]').attr('data-rating-id');
    addnewparametergroup = true;
    addnewparameter = true;

    if(v.Id == Id){
      $.each(v.ParametersGroupData, function(i2,v2){
        if(info.ParametersGroup == v2.ParametersGroup){
          addnewparametergroup = false;
        }
      })

      if (addnewparametergroup){
        r.data()[i].ParametersGroupData.push({
          ParametersGroup: info.ParametersGroup,
          Use: true,
          WeightageOfGroupInCreditScore: 0,
        })
      }

      $.each(v.ParametersData, function(i2,v2){
        if(info.Parameters == v2.Parameters && info.ParametersGroup == v2.ParametersGroup){
          addnewparameter = false;
        }
      })

      if (addnewparameter){
        r.data()[i].ParametersData.push({
          Parameters: info.Parameters,
          ParametersGroup: info.ParametersGroup,
          Use: true,
          WeightageOfGroupInCreditScore: 0,
        })
      }

    }

  })



  app.ajaxPost("/rating/addratingmaster", info, function (res) {
    if (res.Message != '') {
        sweetAlert("Oops...", res.Message, "error");
        return;
    }
  });
}

r.saveFinishing = function(){
	// var info = ko.mapping.toJS(infox);

	// if (info.Id == '') {
	// 	var rowByParametersGroup = r.dataRatingMaster().filter(function (d) {
	// 		return d.ParametersGroup == info.ParametersGroup
	// 	})
	// 	if (rowByParametersGroup.length > 0) {
	// 		var rowByParameters = rowByParametersGroup.filter(function (d) {
	// 			return d.SubSection == info.SubSection
	// 		})
	// 		if (rowByParameters.length > 0) {
	// 			rowByParametersGroup = rowByParameters
	// 		}
	// 	}

	// 	if (rowByParametersGroup.length > 0) {
	// 		info.Order = _.maxBy(rowByParametersGroup, 'Order').Order + 1
	// 	} else {
	// 		info.Order = _.maxBy(r.dataRatingMaster(), 'Order').Order + 1
	// 	}
	// }

 //  //check parameter group
 //  $.each(r.data(), function(i,v){
 //    Id = $('[data-rating-id]').attr('data-rating-id');
 //    addnewparametergroup = true;
 //    addnewparameter = true;

 //    if(v.Id == Id){
 //      $.each(v.ParametersGroupData, function(i2,v2){
 //        if(info.ParametersGroup == v2.ParametersGroup){
 //          addnewparametergroup = false;
 //        }
 //      })

 //      if (addnewparametergroup){
 //        r.data()[i].ParametersGroupData.push({
 //          ParametersGroup: info.ParametersGroup,
 //          Use: true,
 //          WeightageOfGroupInCreditScore: 0,
 //        })
 //      }

 //      $.each(v.ParametersData, function(i2,v2){
 //        if(info.Parameters == v2.Parameters && info.ParametersGroup == v2.ParametersGroup){
 //          addnewparameter = false;
 //        }
 //      })

 //      if (addnewparameter){
 //        r.data()[i].ParametersData.push({
 //          Parameters: info.Parameters,
 //          ParametersGroup: info.ParametersGroup,
 //          Use: true,
 //          WeightageOfGroupInCreditScore: 0,
 //        })
 //      }

 //    }

 //  })

  //   var param = {}
  // param.Data = r.data()
  // // console.log(param)
  // app.ajaxPost('/rating/saveratingdata', param, function (res) {
  // 	r.save();
  // });

  var callme = function(){  
	  	setTimeout(function(){
	  		var datamaster = JSON.parse(JSON.stringify(r.dataRatingMaster()))
			r.newFilleData([]);
			var datapre = JSON.parse(JSON.stringify(r.getFilledData()[0].CategoriesData));
			datamaster.forEach(function(dt){
				var pre = _.find(datapre,function(x){ return x.Id == dt.Id});
				var Id =  r.selectedRatingModelId() + dt.ParametersGroup + dt.Parameters + dt.Categories + dt.Operator + dt.Value1 + dt.Value2;
				if(pre!=undefined){
					pre.Id = Id;
				}
				dt.Id = Id;
			});

			var datafinal = JSON.parse(JSON.stringify(r.getFilledData()[0]));
			datafinal.CategoriesData = datapre;
			r.newFilleData().push(datafinal);

			var doSave = function () {
				var param = {}
				param.Data = r.newFilleData();

				r.isLoading(true)
				app.ajaxPost('/rating/saveratingdata', param, function (res) {
					if (res.Message != '') {
						r.isLoading(false)
						return
					}
					r.newRatingMode(false);

					if (res.Data.length > 0) {
						r.selectedRatingModelId(res.Data[0])
					}

					r.isLoading(false)
					// r.refresh()
					r.openRating(r.selectedRatingModelId());
				}, function () {
					r.isLoading(false)
				})
			}
			doSave();
		},1500);
	}

  	r.refresh(callme);
}

r.newDataValidation = function(){
	if(r.newData.ParametersGroup() == "" || r.newData.Parameters() == "" || r.newData.ParametersGroup() == r.newData.Parameters() || r.newData.MultipleCategories().length == 0 ){
		return true;
	}
	return false;
}

r.restructureNewMaster = function(){
	var dt =  r.dataRatingMaster();
	var dts = [];

	if(r.newDataValidation()){
		swal("Warning","Data not valid","warning");
		return;
	}

	if(r.newDataBackup.length>0)
	dts = _.orderBy(_.filter(r.dataRatingMaster(),function(d){ 
			return d.Parameters === r.newDataBackup[0].Parameters && d.ParametersGroup === r.newDataBackup[0].ParametersGroup
		}),'Order');

	var startorder = 0;

	var data = _.find(r.data(),function	(x){ return	 x.Id == r.selectedRatingModelId() });
	var categories	= data.CategoriesData;

	dts.forEach(function(x,idx){
			var idx = _.findIndex(r.newDataBackup, function(o) { return o.Id == x.Id; });
			var idnew = "";
			if(idx >-1){
				var cate = _.find(categories,function(xdt){ return	xdt.Id == x.Id });
				if(cate != undefined)
				cate.Id = idnew;
			}
			r.removeBeforeSave({Id : x.Id});
	});

	r.dataRatingMaster(_.reject(r.dataRatingMaster(),function(d){ 
			return d.Parameters === r.newData.Parameters()  
		}));

	startorder = r.findOrder();
	
	r.newData.MultipleCategories().forEach(function(x,key){
		var newDt = {
			Categories : x.Categories(),
			FieldId : r.newData.FieldId(),
			From : r.newData.From(),
			Operator : x.Operator(),
			Parameters : r.newData.Parameters(),
			ParametersGroup : r.newData.ParametersGroup(),
			TimePeriod : r.newData.TimePeriod(),
			Value1 : x.Value1(),
			ValueType : r.newData.ValueType(),
			Value2 : x.Value2(),
			Order :startorder,
			Id : r.selectedRatingModelId()  + r.newData.ParametersGroup() + r.newData.Parameters() + x.Categories() + x.Operator() + x.Value1() + x.Value2()
		};

		r.dataRatingMaster().push(newDt);
		r.normalisasiData(newDt);

		if(key==r.newData.MultipleCategories().length-1)
		r.saveFinishing();
	});
	
	swal("Success", "New item saved", "success");
  	$('.modal-add-new').modal('hide');
}

app.ajaxPost("/ratio/GetFormulaData", { ForModule: "" }, function (res) {
		formula.constructData(res)
	}, function () {
	});

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

r.newDataBackup = [];
r.removeBackUp	= function (id){
	r.newDataBackup = _.filter(r.newDataBackup,function	(x){ return	x.Id != id });
}

r.findOrder = function(){
	if(r.newDataBackup.length > 0){
		var section = r.newDataBackup[0].ParametersGroup;
		var subSection = r.newDataBackup[0].Parameters;
		//check tanpa edit parameter group dan parameter
		var idx = _.findIndex($('[data-field-id]'),function(x){ return $(x).attr("data-sub-section") == subSection && $(x).attr("data-section") == section}); 
		var valid = _.find($('[data-field-id]'),function(x){ return $(x).attr("data-sub-section") == subSection && $(x).attr("data-section") == section}); 
		var filter = _.find($('[data-field-id]'),function(x){ return $(x).attr("data-sub-section") == subSection && $(x).attr("data-section") == section}); 

		if(section != r.newData.ParametersGroup()){
			return $('[data-field-id]').length+1;
		}

		if(valid != undefined){
			return idx
		}
	}

	var section = r.newData.ParametersGroup();
	//cek jika ganti nama parameter
	idx = _.findIndex($('[data-field-id]'),function(x){ return $(x).attr("data-section") == section}); 
	valid = _.find($('[data-field-id]'),function(x){ return $(x).attr("data-section") == section});
	var validall = _.filter($('[data-field-id]'),function(x){ return $(x).attr("data-section") == section});
	if(valid != undefined){
			return (idx+1)+validall.length;
	}

	return $('[data-field-id]').length+1;
}


 function saveExpanded() {
      var treeview = $(".grid").data("kendoTreeList");
      var expandedItemsIds = {};
      treeview.element.find("[aria-expanded='true']").each(function () {
        var item = treeview.dataItem(this);
        if (item.expanded) {
            expandedItemsIds[item.id] = true;
        }
      });
      createCookie('expanded', kendo.stringify(expandedItemsIds));
    }

    function setExpanded(data) {
    	var expanded = readCookie('expanded');
    	eraseCookie('expanded');
    	   if (expanded) {
		      expanded = JSON.parse(expanded);
		      for (var i = 0; i < data.length; i++) {
		        if (expanded[data[i].id]) {
		          data[i].expanded = true;
		        }
		      }
		  }
    }