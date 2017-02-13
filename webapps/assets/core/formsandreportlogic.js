var frl = {}
frl.AllDataFile = ko.observableArray([]);
frl.FilterFile = ko.observableArray('');
frl.dataListFile = ko.observableArray([]);
frl.filter = ko.observableArray([]);
frl.linkdata = ko.observableArray([]);
frl.path = ko.observable("");
frl.visible= ko.observable(false);

frl.onfilter = function(){
	$("#filter").keydown(function(){
	setTimeout(function(){

		var str = $("#filter").val();
		str = (str).toLowerCase();
		if(str != ""){
			var res = _.filter(frl.AllDataFile(), function(data){
				return data.NameFile.toLowerCase().indexOf(str) > -1;
			});
			if(res != undefined){
				frl.filter([]);
				console.log(res,str);
				frl.filter(res);
				frl.renderGrid()
			}
		}else{
			frl.getData()	
		}
},500)

	});
}


frl.getData = function(){
	frl.filter([])
	frl.AllDataFile([])
	var param = {};
	var url = "/formsandreportlogic/getallfile"
	ajaxPost(url, param, function(res){
		frl.AllDataFile(res.data.data)
		frl.filter(res.data.data)
		frl.linkdata(res.data.linkdata)
		frl.path(res.data.path)
		frl.renderGrid()
		setTimeout(function(){
			$('.apx-loading').hide();
			frl.visible(true);
		}, 700)
		$.each(res, function(i, item){
			frl.dataListFile.push(item.NameFile)
		})
		
	})
}

frl.renderGrid = function(){
	$(".grid").html("");
    $(".grid").kendoGrid({
            // dataSource: frl.filter(),
            dataSource: {
		        data: frl.filter(),
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
                    	"<button class='btn btn-xs btn-primary add-userrights confirm-userrights tooltipster' title='Download File' onclick='frl.download(\""+d.NameFile+"\")'><i class='fa fa-download'></i></button>",
                    	"<button class='btn btn-xs btn-success add-userrights confirm-userrights tooltipster' title='Open File' onclick='frl.openLink(\""+d.NameFile+"\")'><i class='fa fa-folder-open-o'></i></button>",
                    	].join(' ')
                    }
                },
                
            ]
    });
	// console.log(frl.AllDataFile())
	

}

frl.openLink = function(name){
	var dlink = _.find(frl.linkdata(),function(x){ return x.filename == name });
	if(dlink == undefined){
		swal("Warning","Link not found","warning");
		return;
	} 	
	window.open(dlink.link);
}

frl.download = function(d){
	var link = document.createElement('a');
	link.href = "/static/"+frl.path()+d;
	link.download = d;
	link.dispatchEvent(new MouseEvent('click'));
}

$(document).ready(function(){
	frl.getData();
	frl.onfilter();
	// frl.renderGrid();
	

});


