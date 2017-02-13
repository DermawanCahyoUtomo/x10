var uat = {}

uat.AllDataFile = ko.observableArray([]);
uat.FilterFile = ko.observableArray('');
uat.dataListFile = ko.observableArray([]);
uat.filter = ko.observableArray([]);
uat.linkdata = ko.observableArray([]);
uat.path = ko.observable("");
uat.visible= ko.observable(false);

uat.onfilter = function(){
	$("#filter").keydown(function(){
	setTimeout(function(){

		var str = $("#filter").val();
		str = (str).toLowerCase();
		if(str != ""){
			var res = _.filter(uat.AllDataFile(), function(data){
				return data.NameFile.toLowerCase().indexOf(str) > -1;
			});
			if(res != undefined){
				uat.filter([]);
				console.log(res,str);
				uat.filter(res);
				uat.renderGrid()
			}
		}else{
			uat.getData()	
		}
},500)

	});
}

uat.getData = function(){
	uat.filter([])
	uat.AllDataFile([])
	var param = {};
	var url = "/uatdocuments/getallfile"
	ajaxPost(url, param, function(res){
		uat.AllDataFile(res.data.data)
		uat.filter(res.data.data)
		uat.linkdata(res.data.linkdata)
		uat.path(res.data.path)
		uat.renderGrid()
		setTimeout(function(){
			$('.apx-loading').hide();
			uat.visible(true);
		}, 700)
		$.each(res, function(i, item){
			uat.dataListFile.push(item.NameFile)
		})
		
	})
}

uat.renderGrid = function(){
	$(".grid").html("");
    $(".grid").kendoGrid({
            // dataSource: uat.filter(),
            dataSource: {
		        data: uat.filter(),
		        pageSize: 10
		    },
		    pageable: true,
            columnMenu: false,
	        dataBound: function () {
				app.gridBoundTooltipster('.grid')()
				
			},
			// pageable: true,
			// pageSize: 10,
            columns: [
                {
                    field:"NameFile",
                    title:"File Name",         
                    width:300,
                    headerAttributes: {class: 'k-header header-bgcolor'},
                },
                {
                    field:"Upload",
                    title:"Uploaded On",
                    width:200,
                    headerAttributes: {class: 'k-header header-bgcolor'},
                    template: function(d){
                    	return kendo.toString(new Date(d.Upload),"dd-MM-yyyy HH:mm");
                    }
                },
                {
                    // field:"",
                    title:"",
                    width:40,
                    headerAttributes: {class: 'k-header header-bgcolor'},
                    template: function(d){
                    	return [
                    	"<button class='btn btn-xs btn-primary add-userrights confirm-userrights tooltipster' title='Download File' onclick='uat.download(\""+d.NameFile+"\")'><i class='fa fa-download'></i></button>",
                    	"<button class='btn btn-xs btn-success add-userrights confirm-userrights tooltipster' title='Open File' onclick='uat.openLink(\""+d.NameFile+"\")'><i class='fa fa-folder-open-o'></i></button>",
                    	].join(' ')
                    }
                },
                
            ]
    });
	// console.log(uat.AllDataFile())
	

}

uat.openLink = function(name){
	var dlink = _.find(uat.linkdata(),function(x){ return x.filename == name });
	if(dlink == undefined){
		swal("Warning","Link not found","warning");
		return;
	} 	
	window.open(dlink.link);
}

uat.download = function(d){
	var link = document.createElement('a');
	link.href = "/static/"+uat.path()+d;
	link.download = d;
	link.dispatchEvent(new MouseEvent('click'));
}

$(document).ready(function(){
	uat.getData();
	uat.onfilter();
	// uat.renderGrid();
	

});
