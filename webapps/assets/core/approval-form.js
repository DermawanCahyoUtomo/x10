var r = {};
var mincibilscore = ko.observable()
var above700 = []
var beetween600700 = []
var below600 = []
var redflags = ko.observableArray([])
var countUnconfirm = ko.observable(0)
var totalrealestate = ko.observable()
r.rootdata = ko.observableArray([])
r.rootdates = ko.observableArray([])

r.customerId = ko.observable('')
r.AllData = ko.observable('')
r.AccountDetail = ko.observable('')
r.AllData2 = ko.observable('')
r.AllData3 = ko.observable('')
r.notMetsCriteria = ko.observableArray([])

r.bankingODCC = ko.observable(0)
r.bankingABB = ko.observable(0)
r.emiBounce = ko.observable(0)
r.monthlyEMI = ko.observable(0)
schemeAD = ko.observable('')
r.formVisibility = ko.observable(false)

r.initEvents = function () {
  filter().CustomerSearchVal.subscribe(function () {
    r.formVisibility(false)
  })
  filter().DealNumberSearchVal.subscribe(function () {
    r.formVisibility(false)
  })

  //$('#refresh').remove()
}

r.colors = {
  pie1: ["#0070aa", "#00e3ba", "#39a8e4", "#00bb7f", "#53b5f2", "#04E762"],
  unavailable: "#313d50"
}
r.pieColors2 = ["#ff9300", "#ff0045", "#00da9c", "#0c4979", "#00aef1"];

r.toTitleCase = function(str) {
    return str.replace(/([^\W_]+[^\s-]*) */g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

r.getTooltipOption = function(position){
  return {
    theme: 'tooltipster-left-scroller',
    animation: 'grow',
    delay: 0,
    touchDevices: false,
    trigger: 'hover',
    position: position
  }
}

r.sAD = function(ad, asd, bd){
  loanapproval.companyname(ad.CustomerName);
  loanapproval.logindate(moment(new Date(asd.logindate)).format("DD/MM/YYYY"));
  loanapproval.businessaddress(ad.registeredaddress.AddressRegistered);
  loanapproval.businesssegment(bd.customersegmentclasification);
  loanapproval.businesssince(moment(bd.datebusinessstarted).format("DD/MM/YYYY"));

  loanapproval.location(asd.cityname);
  loanapproval.product(asd.product);
  loanapproval.leaddistributor(asd.leaddistributor);
  loanapproval.creditanalyst(asd.creditanalyst);
  loanapproval.brhead(asd.brhead);
  loanapproval.rmname(asd.rmname);
  schemeAD(asd.scheme);

  $(".ad-tooltip").each(function () {
    var opt = r.getTooltipOption('top')
    opt.content = $(this).children('input').val()
    try {
      $(this).tooltipster('destroy');
    } catch (e) {
    }
    $(this).tooltipster(opt)
  })

}

r.scrollTo = function(param){
  return function () {
    var curElem = $("#left-col > .shown");

    var moveTo = function(destination){
      $("#left-col > .shown").addClass("hidden");
      $("#left-col > .shown").removeClass("shown");

      destination.removeClass("hidden");
      destination.addClass("shown");
      return destination
    }

    if(param == 'before') {
      if(curElem.prev().length > 0){
        curElem = moveTo(curElem.prev())
      }
    } else if (param == 'next'){
      if(curElem.next().length > 0){
        curElem = moveTo(curElem.next())
      }
    } else {
      curElem = moveTo($("#left-col > #" + param))
    }

    if(curElem != ""){
      $(".left-scroller .tooltipstered.active").removeClass("active")
      $(".left-scroller ." + curElem.attr("id")).addClass("active")
      r.redrawChart()
    }
  }
};

r.showDetails = function(param){

  if(param == "overview"){
       var top = $("#ldb").offset().top
      $('body').animate({
        scrollTop: top - 130
      })
      $(".collapsible-header.active").trigger("click")
      $("#ldb .collapsible-header").trigger("click")
      $("#ptb .collapsible-header").trigger("click")
      $("#bdb .collapsible-header").trigger("click")
      $("#rrb .collapsible-header").trigger("click")
      return;
  }

  var top = $("#"+ param).offset().top
  $('body').animate({
    scrollTop: top - 130
  })
  $(".collapsible-header.active").trigger("click")
  $("#"+ param +" .collapsible-header").trigger("click")
};

r.openFull = function() {
  var top = $("#tab0").offset().top
  $('body').animate({
    scrollTop: top - 130
  })
  $(".collapsible-header.active").trigger("click")
}

var setHeight = function() {
  var topmenuHeight = $("#myTopnav").height()
  var submenuHeight = $("#menubackup").height()

  var colHeight = $(window).height() - topmenuHeight - submenuHeight - 32;
  $("#scroll-button").css("top", (colHeight / 2) + "px")
  $(".divided-col.col-full").css("height", colHeight + "px")
  $(".divided-col.col-full").find('.col-full').each(function (i, e) {
    $(e).css("min-height", colHeight + "px" )
  })
  $(".divided-col.col-full .content-container").css("max-height", (colHeight - 33) + "px")
}

r.ratingReferenceTooltip = function(param){
  var opt = r.getTooltipOption('top');
  opt.content = (param === false) ? "Negative" :
                (param === true) ? "Positive" :
                (param === "zero") ? "Moderate" :
                (param === 'blank')? " " : param
  return opt;
}

r.checkValidation = function(data){
  if(data.Data.CP.length==0){
        // Materialize.toast("Customer Profile Data Not Confirmed", 5000);
        countUnconfirm(countUnconfirm() + 1);
        fixToast("Customer Profile Data Not Confirmed");

  }

  if(data.Data.BA.length==0){
        // Materialize.toast("Bank Analysis Data Not Confirmed", 5000);
        countUnconfirm(countUnconfirm() + 1);
        fixToast("Bank Analysis Data Not Confirmed");

  }

  if(data.Data.CIBIL.length==0){
        // Materialize.toast("CIBIL Data Not Confirmed", 5000);
        countUnconfirm(countUnconfirm() + 1);
        fixToast("CIBIL Data Not Confirmed");

  }

  if(data.Data.CIBILPROM.length==0){
        // Materialize.toast("CIBIL Promotor Data Not Confirmed", 5000);
        countUnconfirm(countUnconfirm() + 1);
        fixToast("CIBIL Promotor Data Not Confirmed")

  }

  if(data.Data.AD.length==0){
        // Materialize.toast("Account Details Data Not Confirmed", 5000);
        countUnconfirm(countUnconfirm() + 1);
        fixToast("Account Details Data Not Confirmed");

  }

  if(data.Data.RTR.length==0){
        // Materialize.toast("RTR Data Not Confirmed", 5000);
        countUnconfirm(countUnconfirm() + 1);
        fixToast("RTR Data Not Confirmed");

  }

  $("#toast-container").css("top","30%");
}

refreshFilter = function(){
  countUnconfirm(0)
  $(".toaster").html("")
  r.initEvents()
  if (r.getCustomerId() === false) {
      return
  }

  var param = {}
  param.customerid = r.customerId().split('|')[0]
  param.dealno = r.customerId().split('|')[1]
  URLRender()
  r.AllData('')
  r.isLoading(true)
  app.ajaxPost('/loanapproval/getalldata', param, function (res) {
    if (res.Message != '') {
      sweetAlert("Warning", res.Message, "warning");
      r.isLoading(false)
      return
    }
    r.checkValidation(res);
    r.AllData(res)
    loanApproval.refresh()

    if(res.Data.CP[0] != undefined && res.Data.AD[0] != undefined){
      r.sAD(
        res.Data.CP[0].applicantdetail,
        res.Data.AD[0].accountsetupdetails,
        res.Data.AD[0].borrowerdetails
        );
    }else{
        loanapproval.companyname("");
        loanapproval.logindate("");
        loanapproval.businessaddress("");
        loanapproval.businesssegment("");
        loanapproval.businesssince("");

        loanapproval.location("");
        loanapproval.product("");
        loanapproval.leaddistributor("");
        loanapproval.creditanalyst("");
        loanapproval.brhead("");
        loanapproval.rmname("");
        schemeAD("");

        $(".ad-tooltip").each(function () {
          var opt = r.getTooltipOption('top')
          opt.content = $(this).children('input').val()
          try {
            $(this).tooltipster('destroy');
          } catch (e) {
          }
          // $(this).tooltipster(opt)
        })
    }

    createKeyParametersandIndicators(res.Data.NORM)
    if(res.Data.AD[0]){
      createMainPromotorDetails(res.Data.AD[0].promotordetails)
      schemeAD(r.AllData().Data.AD[0].accountsetupdetails.scheme);
    }

    if(r.AllData().Data.CP.length > 0)
      createCibilDetails(r.AllData().Data.AD[0].promotordetails)

    r.AccountDetail( r.AllData().Data.AD[0] )
    r.isLoading(false)
    r.getCreditScoreCard(param)

    r.setLD(r.AccountDetail())
    apcom.loadCommentData();
    //Cibil Donut
    above700 = []
    below600 = []
    beetween600700 = []

    if(r.AllData().Data.AD.length > 0){
      var promoter = res.Data.AD[0].promotordetails
      var prommin = _.filter(promoter,function(x){ return x.cibilscore != 0  });
      var minsc = _.minBy(prommin,  function(x){ return x.cibilscore  });
      mincibilscore ( minsc == undefined ? 0 : minsc.cibilscore)

      var filterCibil = function(condition){
        return _.map(_.filter(prommin, condition), function(value){
          return value.cibilscore
        });
      }

      above700        = filterCibil(function(prom){ return prom.cibilscore > 700 })
      beetween600700  = filterCibil(function(prom){ return prom.cibilscore >= 600 && prom.cibilscore <= 700 })
      below600        = filterCibil(function(prom){ return prom.cibilscore < 600 })
    }
    createcibildonut();
    //Real Estate
    if (res.Data.AD.length != 0){
        var promoterAD = res.Data.AD[0].promotordetails
        // var totalre = 0
        var group = _.maxBy(promoterAD,function(x){ return _.sum(x.realestateposition) }).countrealestateposition
        // for (var i = 0 ; i < promoterAD.length ; i++){
        //     for (var j = 0 ; j < promoterAD[i].realestateposition.length ; j++){
        //         totalre = totalre + promoterAD[i].realestateposition[j]
        //     }
        // }
        totalrealestate(group)
    }else{
        // swal("Warning", "Red Flags Data Not Found", "warning");
    }
    getBankAsik();
    getRTRAsoy();
    startme();

    getComments("draft");
    // console.log("))))))))))", res)
    if(res.Data.AD.length > 0) {
      loanapproval.marketref(res.Data.AD[0].borrowerdetails.marketreference);
      createreferencecheckgrid(res.Data.AD[0].borrowerdetails.refrencecheck);
      loanapproval.expansionplan(res.Data.AD[0].borrowerdetails.expansionplans);

      if(res.Data.AD[0].borrowerdetails.commentsonfinancials != undefined) {
        // alert("ini")
        loanapproval.commentfinance(res.Data.AD[0].borrowerdetails.commentsonfinancials);
        
      } else {
        // console.log("))))))))))", res)
        loanapproval.commentfinance([""]);
      }

      try{
        loanapproval.commentfinance(res.Data.AD[0].borrowerdetails.commentsonfinancials);
      }catch(e){
        console.log(e)
        loanapproval.commentfinance([""]);
      }

      loanApproval.companyBackgroundData(
        new companyBackground(res.Data.AD[0], res)
      );
    }else{
       loanapproval.commentfinance([""]);
    }
  })

  getredflag()
  getreportdata()
  r.formVisibility(true)
  loanApproval.loading(true)
  loanApproval.loading(false)
  promoters = [];
  loanApproval.ourstandings([]);
  due.getCostumerData();
  due.getData();
  setTimeout(function(){
    if(countUnconfirm() > 0){
      $("#send").prop("disabled",true);
    }else{
      $("#send").prop("disabled",false);
    }
    // if(apcom.RecommendedCondition().length == 0){
    //   apcom.RecommendedCondition().push("");
    // }
  }, 100)
}

r.getCustomerId = function () {
  var customer = $('.jf-tbl select:eq(0)').data('kendoDropDownList').value()
  var dealNumber = $('.jf-tbl select:eq(1)').data('kendoDropDownList').value()

  if (customer == '') {
      // sweetAlert("Oops...", "Customer cannot be empty", "error");
      return false
  }
  if (dealNumber == '') {
      // sweetAlert("Oops...", "Deal number cannot be empty", "error");
      return false
  }

  r.customerId([customer, dealNumber].join('|'))

  return [customer, dealNumber].join('|')
}

r.getNormData = function (param) {
  app.ajaxPost('/normmaster/getnormdata', param, function (res) {
    if (res.Message != '') {
      sweetAlert("Oops...", res.Message, "error");
      r.isLoading(false)
      return
    }
    r.isLoading(false)

    res.Data.forEach(function(data){
      if(data.CalculatedValue != undefined) {
        var getFixedCalculatedValue = parseFloat((function () {
          return (function(val){
            if(data.CalculatedValue.ValueType == "percentage" || data.ValueType == "percentage")
              return val * 100;
            return val;
          })(data.CalculatedValue.Value)
        })()).toFixed(2);
        data.CalculatedValue.Value = getFixedCalculatedValue;
        if(data.CalculatedValue.ValueType == "percentage" || data.ValueType == "percentage")
          data.calculatedvaluetodisplay = getFixedCalculatedValue + "%"
        else
          data.calculatedvaluetodisplay = getFixedCalculatedValue;
      }
    })

    var persentageAsik = 10
    res.Data = res.Data.filter(function (d) {  return d.ShowInLoanApprovalScreen   });
    var data = res.Data.filter(function (d) {
      return (['min', 'max'].indexOf(d.Operator) > -1) &&  d.ShowInLoanApprovalScreen
    }).map(function (d) {
        var o = {}
        o.operator = d.Operator
        o.title = d.Criteria
        o.subtitle = d.NormLabel

        o.measures = [d.CalculatedValue.Value] // actual
        o.markers = [d.Value1] // norm



        thirdRange = d.Value1 + (d.Value1 * persentageAsik / 100)

        highestRange = (d.CalculatedValue.Value > thirdRange) ? d.CalculatedValue.Value : ((d.Value1 > thirdRange) ? d.Value1 : thirdRange)

        var digit = parseInt(highestRange).toString().length - 2
        var divider = 10;
        for(; digit > 0;digit--){
          divider = divider*10;
        }
        var planA = Math.ceil(highestRange/divider)*divider

        highestRange = planA / highestRange >=2? planA /2 : planA

        o.ranges = [
        d.Value1 - (highestRange * persentageAsik / 100),
        d.Value1 + (highestRange * persentageAsik / 100),
        highestRange
        ]

        return o
    })

    r.AllData2(data)

    /////// Vertical Bullet Chart
    var eachChartWidth = 100;
    renderVerticalBulletChart('.bullet-vertical', data, eachChartWidth)

    var titleContainer = $("<div>").attr("class", "title-container")
      .css("width", $(".bullet-vertical .bullet-vertical-wrapper").width())
    $(".bullet-vertical").append(titleContainer)

    _.each(data, function(d, i) {
      var title = $("<div>").attr("class", "title title"+i)
        .css("width", eachChartWidth+"px")
        .css("display", "inline-block")
        .css("vertical-align", "top")
        .css("text-align", "right")
      $(".bullet-vertical .title-container").append(title)

      var mainT = $("<div>").text(d.title)
        .attr("class", "child-t main-title")
        .css("line-height", "1.5")
      $(".bullet-vertical .title.title"+i).append(mainT)

      var subT = $("<div>").text(d.subtitle)
        .attr("class", "child-t sub-title")
      $(".bullet-vertical .title.title"+i).append(subT)
    })

    var addClass = function (o, klass) {
      $(o).attr('class', $(o).attr('class') + ' ' + klass)
    }

    data.forEach(function (d, i) {
      var rects = $('.bullet-vertical .bullet-vertical-wrapper svg:eq(' + i + ') .range')
      switch (d.operator) {
        case 'max': {
          addClass(rects[0], 'color-high')
          addClass(rects[1], 'color-normal')
          addClass(rects[2], 'color-low')
        } break;
        case 'min': {
          addClass(rects[0], 'color-low')
          addClass(rects[1], 'color-normal')
          addClass(rects[2], 'color-high')
        } break;
      }
    })

    getIsMet = function(d) {
      switch (d.Operator) {
        case 'min': { return d.CalculatedValue.Value > d.Value1 } break;
        case 'max': { return d.CalculatedValue.Value < d.Value1 } break;
        case 'greater than or equal': { return d.CalculatedValue.Value >= d.Value1 } break;
        case 'lower than or equal': { return d.CalculatedValue.Value <= d.Value1 } break;
        case 'equal': { return d.CalculatedValue.Value == d.Value1 } break;
        case 'between': { return (d.CalculatedValue.Value >= d.Value1) && (d.CalculatedValue.Value <= d.Value2) } break;
      }
    }

    _.each(res.Data, function(d, i){
      bullet = $('.bullet-vertical .bullet-vertical-wrapper svg:eq(' + i + ')')
      try{
        bullet.tooltipster('destroy');
      } catch(e){}

      var dval = d.CalculatedValue.Value;
      if(d.ValueType == "percentage" || d.CalculatedValue.ValueType == "percentage"){
        dval = dval + "%"
      }

      $(bullet).tooltipster(function(){
          var opt = r.getTooltipOption('top');
          opt.contentAsHTML = true,
          opt.content = "Status: "+ ((getIsMet(d) == true) ? 'Met' : 'Not Met') +"<br /> Norm: "+ d.NormLabel +"<br /> Actual Value: "+ dval//d.CalculatedValue.Value
          return opt;
        }())

      $(bullet).find('.measure').attr("height", 3).attr("y", 6)
      $(bullet).find('.marker').css("stroke-width", "3px")
    })

    var criteriaStatus = res.Data.map(function (d) {
      return { criteria: d.Criteria, isMet: getIsMet(d) }
    })

    var summary = _.map(
      _.groupBy(
        _.map(criteriaStatus, function(data){ return data.isMet })
      ), function (value, key) {
        var category = (key == 'true') ? 'Met' : 'Not Met'
        var color = (key == 'true') ? r.pieColors2[2] : r.pieColors2[1]
        return { category: category, value: value.length, color: color }
      })

    var nmCrits = _.compact(
        _.map(criteriaStatus, function(data){
          return data.isMet == false ? data.criteria : ""
        })
      )

    var chunk = 5;
    r.notMetsCriteria([])
    for (var i = 0; i < nmCrits.length; i += chunk) {
        r.notMetsCriteria().push(nmCrits.slice(i, i + chunk))
    }

    var j = 1;
    $("#not-met-table").html("")
    _.each(r.notMetsCriteria(), function(cols, i) {
      var col = $("<div>").attr("class", "col-sm-4 no-padding col"+i)
      $("#not-met-table").append(col)

      _.each(cols, function(criteria){
        var cell = $("<div>").attr("class", "panel-row col-sm-12 no-padding cell"+j)
        $(".col"+i).append(cell)

        var numbering = $("<div>").attr("class", "col-fake").text(j+". ")
          .css("font-size", "9px")
          .css("line-height", "1.5")
          .css("width", "17px")
        $(".cell"+j).append(numbering)

        var critText = $("<div>").attr("class", "col-fake").text(criteria)
          .css("font-size", "9px")
          .css("line-height", "1.5")
          .css("margin-bottom", "2px")
          .css("margin-right", "5px")
        $(".cell"+j).append(critText)
        j++
      })
    })

    $('.block.met .value').html(0)
    $('.block.not-met .value').html(0)

    summary.forEach(function (d) {
      $('.block.' + d.category.toLowerCase().replace(/\ /g, '-') + ' .value').html(d.value)
    })

    $('.bulley-summary').kendoChart({
        dataSource: {
            data: summary
        },
        chartArea:{
            background:"transparent",
        },
        legend: {
            visible: false,
            position: "right"
        },
        series: [{
            type: "pie",
            field: 'value',
            overlay: {
              gradient: "none"
            }
        }],
        categoryAxis: {
            field: 'category'
        },
        tooltip : {
            visible: true,
            template: "#=category # : #=value #"
        }
    });
  })
}

r.getCreditScoreCard = function(param, callback) {
  app.ajaxPost('/creditscorecard/getcscdatav1', param, function (res) {
    if(status == "") {
      if(res.Data != null){
      r.AllData3(res.Data[0])
      setDataCreditScoreCard(r.AllData3())
       var param = {}
        param.Customerid = r.customerId().split('|')[0]
        param.Dealno = r.customerId().split('|')[1]
        param.Internalrating = res.Data[0].FinalRating.replace("-","")
        r.getNormData(param)
      }else{
            var param = {}
          param.Customerid = r.customerId().split('|')[0]
          param.Dealno = r.customerId().split('|')[1]
          param.Internalrating = "";
          r.getNormData(param)
          // Materialize.toast("Data Credit Score Card Not Found", 5000);
          countUnconfirm(countUnconfirm() + 1);
          fixToast("Data Credit Score Card Not Found")
      }
    }

    loanApproval.refresh()
  })
}

r.isLoading = function (what) {
  $('.apx-loading')[what ? 'show' : 'hide']()
  $('.app-content')[what ? 'hide' : 'show']()
}

var createcibildonut = function(){
  $('#cibilchart').kendoChart({
      chartArea:{
          background:"transparent",
      },
      legend: {
        position: "right"
      },
        seriesDefaults: {
         holeSize: 45,
     },
      seriesColors : r.pieColors2,
      series: [{
          type: "donut",
          data: [{
              category: "Above 700",
              value: above700.length,
              color: r.pieColors2[2]
          }, {
              category: "600 - 700",
              value: beetween600700.length,
              color: r.pieColors2[0],
          }, {
              category: "Below 600",
              value: below600.length,
              color: r.pieColors2[1],
          }]
      }],
      tooltip : {
            visible: true,
            template: "#=category # : #=value #"
        }
  });
}

var getRTRAsoy = function () {
  r.emiBounce(0)
  r.monthlyEMI(0)

    var param = {
      customerid: filter().CustomerSearchVal(),
      dealno: filter().DealNumberSearchVal()
    }

    ajaxPost("/rtr/getdatabottomgrid", param, function(res){
      r.emiBounce(res.data[1].summary.SumBounces)
      r.monthlyEMI(res.data[1].summary.TotalObligationEMI)
    })
}

r.bankingODCCSancLimit = ko.observable(0);
var getBankAsik = function () {
  r.bankingABB(0)
  r.bankingODCC(0)
  r.bankingODCCSancLimit(0)

    var customerId = filter().CustomerSearchVal();
  var dealNo = filter().DealNumberSearchVal();
  var param = {
    CustomerId : parseInt(customerId, 10),
    DealNo : dealNo
  }

  ajaxPost("/bankanalysis/getdatabankv2confirmed", param, function (res) {
    if (res.message != "") {
     // swal("Warning", "Bank Analysis Data Not Found", "warning");
     return
    }

     var amls = [];
    var odccs = [];
    var maxodcc = 0.0;
    var details = res.data.Detail;
    createBankingandOsSnapshot(res.data.Summary,res.data.AllSum);

    var abbdata = details.map(function (d) {
      var left = _.reduce(d.DataBank[0].CurrentBankDetails, function(memo, num){
        return memo + num.AvgBalon;
      }, 0)
      var right = _.filter(d.DataBank[0].CurrentBankDetails, function(x){
        return x.AvgBalon > 0;
      }).length

      return toolkit.number(left / right)
    })
    var abbavg = _.sum(abbdata) / abbdata.filter(function (d) { return d > 0 }).length

    var odccdata = details.filter(function (d) {
        return d.DataBank[0].BankAccount.FundBased.AccountType == 'OD/CC'
    }).map(function (d) {
        return _.max(_.map(d.DataBank[0].BankDetails, function (bd) {
            return toolkit.number(bd.AvgBalon / bd. OdCcLimit);
        }))
    })
    var odccavg = _.sum(odccdata) / odccdata.length

    var odccdatasanc = details.filter(function (d) {
        return d.DataBank[0].BankAccount.FundBased.AccountType == 'OD/CC'
    }).map(function (d) {
        return d.DataBank[0].BankAccount.FundBased.SancLimit
    })

    var odccsancsum = _.sum(odccdatasanc)

    odccavg = isNaN(odccavg)? 0 : odccavg;
    abbavg = isNaN(abbavg)? 0 : abbavg;

    r.bankingABB(res.data.AllSum.ABB)
    r.bankingODCCSancLimit(res.data.AllSum.ODSactionLimit);
    r.bankingODCC(res.data.AllSum.ODAvgUtilization)
    r.generateAML(res.data.Summary)
  })
}

r.generateAML = function(data){
  var series = [{
    name: 'Credits (Cash)',
    field: 'credit'
  }, {
    name: 'Debits (Cash)',
    field: 'debit'
  }]

  var parsedData = data.map(function (d) {
     return {
        category: moment(d.Month).format("MMM-YYYY"),
        credit: d.TotalCredit,
        debit: d.TotalDebit
     }
  })

  $("#amlChart").kendoChart({
    dataSource: {
      data: parsedData,
    },
                  chartArea: {
                  height: 150,
                  background:"transparent"
                },
                legend: {
                    position: "bottom"
                },
                seriesDefaults: {
                    type: "column",
                    overlay: {
                      gradient: "none"
                    }
                },
                series: series,
                seriesColors : ecisColors,
                valueAxis: {
                    labels: {
                    //     format: "{0}%",
                        skip:2,
                        step:2
                    },
                    line: {
                        visible: false
                    },
                    axisCrossingValue: 0,
                },
                categoryAxis: {
                    field: 'category',
                    line: {
                        visible: false
                    },
                    labels : {
                        // rotation : { angle : 35 }
                    }
                },
                tooltip: {
                    visible: true,
                    template: "#= series.name #: #= app.formatnum(value,2) #"
                }
            });
}

var getredflag = function(){
  var customerId = filter().CustomerSearchVal();
	var dealNo = filter().DealNumberSearchVal();
	var param = {
		CustomerId : customerId,
		DealNo : dealNo
	}

	ajaxPost("/duediligence/getduediligenceinputdataconfirmed", param, function(res){
        if (res.Data.length != 0){
            r.formVisibility(true)
            var data = res.Data[0];
            redflags(data.Background)
            createRedFlags();
        }else{
            redflags([]);
            createRedFlags();
             // swal("Warning", "Red Flags Data Not Found", "warning");
             // Materialize.toast("Due Diligence Data Not Confirmed", 5000);
             countUnconfirm(countUnconfirm() + 1);
             fixToast("Due Diligence Data Not Confirmed")

            return
        }
    });
}

var hovername = function(){
    return function(){
        try{
          $(".redflag").tooltipster('destroy');
        }catch(e){

        }

        $(".redflag").tooltipster({
              trigger: 'hover',
                theme: 'tooltipster-val',
                animation: 'grow',
                delay: 0,
                position:"top",
                interactive: true,
        })
        $(".redflag").tooltipster('show');
    }
}

var getreportdata = function(){
  var customerId = filter().CustomerSearchVal();
  var dealNo = filter().DealNumberSearchVal();
  var param = {
    CustomerId : customerId,
    DealNo : dealNo,
    ForModule : "ratio report"
  }

  ajaxPost("/ratio/getreportdata", param, function(res){
    NOPAL_SENG_NGGAWE_BUILD_KEY_FINANCIAL_RATIOS_IKI_PENTING_SENG_LAWAS_RAUSAH_DIGAWE_RA_BENEEERRRR(res)
    r.rootdata([])
    r.rootdates([])
    if (res.Data.AuditStatus.length != 0){
        r.rootdata(res.Data.FormData)
        r.rootdates(_.orderBy(res.Data.AuditStatus, 'Date', 'asc'))
        r.ConstructDataRatioPDF(r.rootdata(), r.rootdates())
        left.loadRatioData()
        left.panelVisible(true)
    }else{
         // swal("Warning", "Report Data Not Found", "warning");
          // Materialize.toast("Balance Sheet Data Not Confirmed", 5000);
          countUnconfirm(countUnconfirm() + 1);
          fixToast("Balance Sheet Data Not Confirmed");

        return
    }
  });

}

r.redrawChart = function() {
  $("#left-col > .shown").find('.k-chart').each(function (i, e) {
    $(e).data('kendoChart').redraw()
  })
}

$(document).ready(function(){
  r.initEvents()
  setTimeout(function(){
    setHeight()
    // refreshFilter()
  }, 2000);
}).ajaxComplete(function(){
  setHeight()
})

$(window).resize(function() {
  setHeight()
  r.redrawChart()
});

r.KFI = ko.observableArray([
   {
      Section : ko.observable('PROFIT & LOSS ACCOUNT'),
      SectionAlias: ko.observable('PROFIT & LOSS A/C EXTRACT'),
      ColumnHeader: ko.observableArray([]),
      Data : [
         {
            Id : ko.observable('TO'),
            subsection: "",
            alias : ko.observable('Turnover'),
            ratio : ko.observable('Turnover'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('COGS'),
            subsection: "",
            alias : ko.observable('Cost of Sales'),
            ratio : ko.observable('Cost of Good Sold (COGS)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('GPROF'),
            subsection: "",
            alias : ko.observable('Gross Profits'),
            ratio : ko.observable('GROSS  PROFIT (as per books)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('SALADMINEXP'),
            subsection: "",
            alias : ko.observable('Salary & Admin Exp.'),
            ratio : ko.observable('Salary & Admin Exp.'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('EBITDA'),
            subsection: "",
            alias : ko.observable('EBITDA'),
            ratio : ko.observable('EBITDA'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('IFIB'),
            subsection: "",
            alias : ko.observable('Interest to FI and Banks'),
            ratio : ko.observable('Interest to FI/Banks'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('DEPR'),
            subsection: "",
            alias : ko.observable('Depreciation'),
            ratio : ko.observable('Depreciation'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('PBTNBI'),
            subsection: "",
            alias : ko.observable('Profit Before Tax'),
            ratio : ko.observable('PROFIT BEFORE TAX (Excl Non Business Inc)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('TAX'),
            subsection: "",
            alias : ko.observable('Income Tax'),
            ratio : ko.observable('Tax'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('PAT'),
            subsection: "",
            alias : ko.observable('Profit After Tax'),
            ratio : ko.observable('PAT'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('ACTCASHP'),
            subsection: "",
            alias : ko.observable('Cash Profit'),
            ratio : ko.observable('Actual Cash Profit Including Salary & Interest (Excl Non Business Income)'),
            row : ko.observableArray([])
         }
      ],
      row : ko.observableArray([])
   },
   {
      Section : ko.observable('BALANCE SHEET'),
      SectionAlias: ko.observable('BALANCE SHEET EXTRACT'),
      ColumnHeader: ko.observableArray([]),
      Data : [
         {
            Id : ko.observable('RECEIV'),
            subsection: "Assets",
            alias : ko.observable('Debtors (closing)'),
            ratio : ko.observable('Receivables / Debtors'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('INV'),
            subsection: "Assets",
            alias : ko.observable('Closing Stock'),
            ratio : ko.observable('Inventories'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('SCRE'),
            subsection: "Assets",
            alias : ko.observable('Less Creditors (closing)'),
            ratio : ko.observable('Sundry Creditors'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('WCASSETS'),
            subsection: "Assets",
            alias : ko.observable('Working Capital Assets'),
            ratio : ko.observable('Working Capital Assets'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('NETFIXASSETSLESSREVRES'),
            subsection: "Assets",
            alias : ko.observable('Fixed Assets'),
            ratio : ko.observable('Net Fixed Assets (Less Reval. Reserve)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('NETFIXEDASSE'),
            subsection: "Assets",
            alias : ko.observable('Fixed Assets'),
            ratio : ko.observable('Net Fixed Assets (Gross Fixed Assets - Accum. Dep)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('CNB'),
            subsection: "Assets",
            alias : ko.observable('Cash & Bank Balance'),
            ratio : ko.observable('Cash & Bank Balance'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('LOANSADVOCA'),
            subsection: "Assets",
            alias : ko.observable('Loans, Adv. & Other Current Assets'),
            ratio : ko.observable('Loans, Adv. & Other Current Assets'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('TOTASSETS2'),
            subsection: "Assets",
            alias : ko.observable('TOTAL ASSETS II'),
            ratio : ko.observable('Adjusted Total Assets'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('SCA'),
            subsection: "Liabilities",
            alias : ko.observable('Share Capital'),
            ratio : ko.observable('Share Capital'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('RESUR'),
            subsection: "Liabilities",
            alias : ko.observable('Reserves & Surplus'),
            ratio : ko.observable('Reserves & Surplus(excluding revaluation reserve)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('ULPAR'),
            subsection: "Liabilities",
            alias : ko.observable('Loan from Promoters/family'),
            ratio : ko.observable('Unsecured loans from partners/shareholders (ICDs incl.)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('TNW'),
            subsection: "Liabilities",
            alias : ko.observable('NET WORTH'),
            ratio : ko.observable('Total Net worth'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('ADJUSTEDNW'),
            subsection: "Liabilities",
            alias : ko.observable('ADJUSTED NET WORTH II'),
            ratio : ko.observable('Adjusted Net Worth II'),
            row : ko.observableArray([])
         },
         {
             Id : ko.observable('WCAP'),
            subsection: "Liabilities",
            alias : ko.observable('Working Capital Limits from Banks/FI\'s (OD / CC)'),
            ratio : ko.observable('Working Capital Limits from Banks/FI\'s (OD / CC)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('LOANSFROMB&Fls'),
            subsection: "Liabilities",
            alias : ko.observable('Loan from Bank & FI\'s'),
            ratio : ko.observable('Loan from Bank & FI\'s'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('TOTOBW'),
            subsection: "Liabilities",
            alias : ko.observable('Total Outside Debts'),
            ratio : ko.observable('Total Outside Borrowings (B)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('OLI'),
            subsection: "Liabilities",
            alias : ko.observable('Other Liabilities'),
            ratio : ko.observable('Other Liabilities'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('TOTLIAB2'),
            subsection: "Liabilities",
            alias : ko.observable('TOTAL LIABILITIES II'),
            ratio : ko.observable('Adjusted Total Liabilities'),
            row : ko.observableArray([])
         }
      ],
      row : ko.observableArray([])
   }
])

r.FR = ko.observableArray([
   {
      Section : ko.observable('Name'),
      SectionAlias: ko.observable('Name'),
      ColumnHeader: ko.observableArray([]),
      Data : [
      ],
      row : ko.observableArray([])
   },
   {
      Section : ko.observable('RATIO'),
      SectionAlias: ko.observable(toTitleCase('PROFITABILITY RATIO')),
      ColumnHeader: ko.observableArray([]),
      Data : [
         {
            Id : ko.observable('GPMARGIN'),
            subsection: '',
            alias : ko.observable('Gross Profit Margin %'),
            ratio : ko.observable('Gross Profit Margin %'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('EBITDAMARGIN'),
            subsection: '',
            alias : ko.observable('EBITDA Margin %'),
            ratio : ko.observable('EBITDA Margin %'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('PBTMARGIN'),
            subsection: '',
            alias : ko.observable('PBT Margin %'),
            ratio : ko.observable('PBT Margin %'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('PATMARGIN'),
            subsection: '',
            alias : ko.observable('PAT margin %'),
            ratio : ko.observable('PAT margin %'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('ROCE'),
            subsection: '',
            alias : ko.observable('ROCE %'),
            ratio : ko.observable('ROCE %'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('CASHPROFIT'),
            subsection: '',
            alias : ko.observable('Cash Profit Ratio %'),
            ratio : ko.observable('Cash Profit Ratio %'),
            row : ko.observableArray([])
         }
      ],
      row : ko.observableArray([])
   },
   {
      Section : ko.observable('LEVERAGE RATIO'),
      SectionAlias : ko.observable(toTitleCase('LEVERAGE RATIO')),
      ColumnHeader: ko.observableArray([]),
      Data : [
         {
            Id : ko.observable('DERATIO'),
            subsection: '',
            alias : ko.observable('Debt / Equity (D/E) (Adj. NW)'),
            ratio : ko.observable('Debt to Equity'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('NETDERATIO'),
            subsection: '',
            alias : ko.observable('Net Debt / Equity (Adj. NW)'),
            ratio : ko.observable('Net Debt to Equity'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('TOLTNW'),
            subsection: '',
            alias : ko.observable('TOL / TNW (Adj. NW)'),
            ratio : ko.observable('TOL/TNW'),
            row : ko.observableArray([])
         }
      ],
      row : ko.observableArray([])
   },
   {
      Section : ko.observable('COVERAGE RATIO'),
      SectionAlias : ko.observable(toTitleCase('COVERAGE RATIO')),
      ColumnHeader: ko.observableArray([]),
      Data : [
         {
            Id : ko.observable('INCR'),
            subsection: '',
            alias : ko.observable('ISCR'),
            ratio : ko.observable('Interest Coverage Ratio'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('DSCR'),
            subsection: '',
            alias : ko.observable('DSCR'),
            ratio : ko.observable('DSCR'),
            row : ko.observableArray([])
         }
      ],
      row : ko.observableArray([])
   },
   {
      Section : ko.observable('LIQUIDITY RATIO'),
      SectionAlias : ko.observable(toTitleCase('LIQUIDITY RATIO')),
      ColumnHeader: ko.observableArray([]),
      Data : [
         {
            Id : ko.observable('CURATIO'),
            subsection: '',
            alias : ko.observable('Current Ratio'),
            ratio : ko.observable('Current Ratio'),
            row : ko.observableArray([])
         }
      ],
      row : ko.observableArray([])
   },
   {
      Section : ko.observable('OPERATING RATIO'),
      SectionAlias : ko.observable(toTitleCase('OPERATING RATIO')),
      ColumnHeader: ko.observableArray([]),
      Data : [
         {
            Id : ko.observable('WORKACI'),
            subsection: '',
            alias : ko.observable('Debtor Days'),
            ratio : ko.observable('Working Capital Cycle :- Debtor Days'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('CREDAY'),
            subsection: '',
            alias : ko.observable('Creditor Days'),
            ratio : ko.observable('Creditor Days'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('STOCKDAY'),
            subsection: '',
            alias : ko.observable('Stock Days'),
            ratio : ko.observable('Stock Days'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('NETWORCAP'),
            subsection: '',
            alias : ko.observable('Working Capital Cycle'),
            ratio : ko.observable('Net Working Capital Cycle'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('WCREQ'),
            subsection: '',
            alias : ko.observable('WC Requirement ( Lacs)'),
            ratio : ko.observable('WC Requirement ( Lacs)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('WCGAPMPBF'),
            subsection: '',
            alias : ko.observable('WC Gap ( Lacs) (MPBF Method)'),
            ratio : ko.observable('WC Gap ( Lacs) (MPBF Method)'),
            row : ko.observableArray([])
         },
         // {
         //    Id : ko.observable('LEVERAGEINCLX10'),
         //    subsection: '',
         //    alias : ko.observable('Leverage Including X10 (TOL/TNW)'),
         //    ratio : ko.observable('Leverage Including X10 (TOL/TNW)'),
         //    row : ko.observableArray([])
         // },
         // {
         //    Id : ko.observable('GEARING'),
         //    subsection: '',
         //    alias : ko.observable('Gearing (times) including X10 Loan'),
         //    ratio : ko.observable('Gearing (times) including X10 Loan'),
         //    row : ko.observableArray([])
         // },
         // {
         //    Id : ko.observable('ISCRWITHX10'),
         //    subsection: '',
         //    alias : ko.observable('Int.Coverage Ratio (ISCR) with X10 Loan'),
         //    ratio : ko.observable('Interest Coverage Ratio (Incl. X10 Int.)'),
         //    row : ko.observableArray([])
         // },
         // {
         //    Id : ko.observable('BTO'),
         //    subsection: '',
         //    alias : ko.observable('BTO% against FY 14 TO'),
         //    ratio : ko.observable('BTO% against FY 14 TO'),
         //    row : ko.observableArray([])
         // },
      ],
      row : ko.observableArray([])
   },
   {
      Section : ko.observable('KEY RATIOS'),
      SectionAlias : ko.observable(toTitleCase('KEY RATIOS')),
      ColumnHeader: ko.observableArray([]),
      Data : [
         {
            Id : ko.observable('LEVERAGEINCLX10'),
            subsection: '',
            alias : ko.observable('Leverage Including X10 (TOL/TNW)'),
            ratio : ko.observable('Leverage Including X10 (TOL/TNW)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('GEARING'),
            subsection: '',
            alias : ko.observable('Gearing (times) including X10 Loan'),
            ratio : ko.observable('Gearing (times) including X10 Loan'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('ISCRWITHX10'),
            subsection: '',
            alias : ko.observable('Int.Coverage Ratio (ISCR) with X10 Loan'),
            ratio : ko.observable('Interest Coverage Ratio (Incl. X10 Int.)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('DSCRPL'),
            subsection: '',
            alias : ko.observable('Post B/S DSCR Incl. X10 Loan'),
            ratio : ko.observable('Post B/S DSCR Including X10'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('SURPDEFLONGTERM'),
            subsection: '',
            alias : ko.observable('Surplus/Deficit in Long term Sources vr. Appli.'),
            ratio : ko.observable('Surplus/Deficit in Long term Sources vr. Appli.'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('BTO'),
            subsection: '',
            alias : ko.observable('BTO% against FY 14 TO'),
            ratio : ko.observable('BTO% against FY 14 TO'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable(''),
            subsection: '',
            alias : ko.observable('Margin Taken'),
            ratio : ko.observable('Margin Taken'),
            row : ko.observableArray([])
         }
      ],
      row : ko.observableArray([])
   },
])

r.KI = ko.observableArray([
   {
      Section : ko.observable('Name'),
      SectionAlias: ko.observable('Name'),
      ColumnHeader: ko.observableArray([]),
      Data : [
         {
            Id : ko.observable('TO'),
            subsection: "",
            alias : ko.observable('Turnover'),
            ratio : ko.observable('Turnover'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('EBITDA'),
            subsection: "",
            alias : ko.observable('EBITDA'),
            ratio : ko.observable('EBITDA'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('PAT'),
            subsection: "",
            alias : ko.observable('PAT'),
            ratio : ko.observable('Profit After Tax'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('GPMARGIN'),
            subsection: '',
            alias : ko.observable('Gross Profit Margin %'),
            ratio : ko.observable('Gross Profit Margin %'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('EBITDAMARGIN'),
            subsection: '',
            alias : ko.observable('EBITDA Margin %'),
            ratio : ko.observable('EBITDA Margin %'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('WORKINGCAPITALASSETS'),
            subsection: '',
            alias : ko.observable('NWC'),
            ratio : ko.observable('Working Capital Assets'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('NETWORCAP'),
            subsection: '',
            alias : ko.observable('WC Days'),
            ratio : ko.observable('Working Capital Cycle'),
            row : ko.observableArray([])
         },
         {
             Id : ko.observable('WCAP'),
            subsection: "",
            alias : ko.observable('WC Fund from Bank WC Loan'),
            ratio : ko.observable('Working Capital Limits from Banks/FI\'s (OD / CC)'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('NWLESSFA'),
            subsection: "",
            alias : ko.observable('Net Worth less Fixed assets'),
            ratio : ko.observable('Net Worth less Fixed assets'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('WCGAP'),
            subsection: "",
            alias : ko.observable('WC GAP'),
            ratio : ko.observable('WC Gap'),
            row : ko.observableArray([])
         },
         {
            Id : ko.observable('WCGAPMPBF'),
            subsection: "",
            alias : ko.observable('WC GAP (MPBF Method)'),
            ratio : ko.observable('WC Gap ( Lacs) (MPBF Method)'),
            row : ko.observableArray([])
         },
      ],
      row : ko.observableArray([])
   }
])
r.KRHEADER = ko.observableArray([]);
r.ConstructDataRatioPDF = function(res,ress){
  _.map(r.KFI(), function(v, i){
    r.KFI()[i].ColumnHeader([])
    r.KFI()[i].row([])

    //create header
    r.KFI()[i].ColumnHeader.push(v.SectionAlias())
    _.each(ress, function(column){
       if(column.Status == "PROVISION") {
          // r.KRHEADER.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+" (Prov.)")
       }else if (column.Status == "ESTIMATED"){
          // r.KRHEADER.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+" (Estimated)")
       } else if(column.Status == "AUDITED"){
          r.KFI()[i].ColumnHeader.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+" (Audited)")
          r.KRHEADER.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+" (Audited)")
       }
    })
    //end create header

    var dataSection = _.groupBy(v.Data, 'subsection');

    _.map(dataSection, function(v1, i1){
       //create row
       //
       if(i1 != "") {
          r.KFI()[i].row.push({"rowData" : [i1]})
       }

       _.map(v1, function(v2, i2){
          var row = _.find(res, {'FieldAlias':v2.Id()})
          var rowData = []
          if(row == undefined) {
             rowData.push(v2.alias())
          } else if(row != undefined) {
             v2.alias(row.FieldName)
             rowData.push(v2.alias())

             _.each(ress, function(column) {
              if(column.Status == "AUDITED"){
                var rowSelected = row.Values.find(function(g){return g.Date == column.Date})
                if(rowSelected!=undefined) {
                   if(typeof rowSelected.Value === "number") {
                      if(row.ValueType == "percentage"){
                         rowData.push(kendo.toString(rowSelected.Value, "P2"))
                      } else {
                         rowData.push(rowSelected.Value.toFixed(2))
                      }
                   } else {
                      rowData.push(rowSelected.Value)
                   }
                } else {
                   rowData.push("")
                }
              }
             })

             r.KFI()[i].row.push({"rowData" : rowData})
          }
       })

       //end create row
    })
  })

  r.KRHEADER([]);

  _.map(r.FR(), function(v, i){
    r.FR()[i].ColumnHeader([])
    r.FR()[i].row([])
    //create header
    if(i == 0) {
       r.FR()[i].ColumnHeader.push("Name")
       _.each(ress, function(column){
          if(column.Status == "PROVISION") {
            r.KRHEADER.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+"")
             // r.FR()[i].ColumnHeader.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+" (Prov.)")
          } else if(column.Status == "ESTIMATED") {
             // r.FR()[i].ColumnHeader.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+" (Estimated)")
          r.KRHEADER.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+"")
          }
          else if(column.Status == "AUDITED"){
             r.FR()[i].ColumnHeader.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+" (Audited)")
             r.KRHEADER.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+" (Audited)")
          }
       })
    } else {
       r.FR()[i].ColumnHeader.push(v.SectionAlias())
    }

    //end create header
    //
    var dataSection = _.groupBy(v.Data, 'subsection');
    _.map(dataSection, function(v1, i1){
       //create row
       //
       if(i1 != "") {
          r.FR()[i].row.push({"rowData" : [i1]})
       }

       _.map(v1, function(v2, i2){
          var row = _.find(res, {'FieldAlias':v2.Id()})
          var rowData = []

          if(row == undefined) {
             rowData.push(v2.alias())
          }else if(row != undefined) {
            // v2.alias(row.FieldName)
            rowData.push(v2.alias())
            _.each(ress, function(column) {
              // if(column.Status == "AUDITED"){
                var rowSelected = row.Values.find(function(g){return g.Date == column.Date})
                if(rowSelected!=undefined) {
                   if(typeof rowSelected.Value === "number") {
                      if(row.ValueType == "percentage"){
                         rowData.push(kendo.toString(rowSelected.Value, "P2"))
                      } else {
                         rowData.push(rowSelected.Value.toFixed(2))
                      }
                   } else {
                      rowData.push(rowSelected.Value)
                   }
                } else {
                   rowData.push("")
                }
              // }
            })

            r.FR()[i].row.push({"rowData" : rowData})
          }
       })

       //end create row
    })
  })

  _.map(r.KI(), function(v, i){
    r.KI()[i].ColumnHeader([])
    r.KI()[i].row([])
    //create header
    r.KI()[i].ColumnHeader.push(v.SectionAlias())
    _.each(res, function(column){
       if(column.Status == "PROVISION") {
          r.KI()[i].ColumnHeader.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+" (Prov.)")
       } else if(column.Status == "ESTIMATED") {
          r.KI()[i].ColumnHeader.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+" (Estimated)")
       }
       else {
          r.KI()[i].ColumnHeader.push("FY "+moment(column.Date,"DD-MM-YYYY").format("YY")+" (Audited)")
       }
    })
    //end create header
    //
    var dataSection = _.groupBy(v.Data, 'subsection');

    _.map(dataSection, function(v1, i1){
       //create row
       //
       if(i1 != "") {
          r.KI()[i].row.push({"rowData" : [i1]})
       }

       _.map(v1, function(v2, i2){
          var row = _.find(res, {'FieldAlias':v2.Id()})
          var rowData = []

          if(row == undefined) {
             rowData.push(v2.alias())
          } else if(row != undefined) {
             v2.alias(row.FieldName)
             rowData.push(v2.alias())
             _.each(res, function(column) {
                var rowSelected = row.Values.find(function(g){return g.Date == column.Date})
                if(rowSelected!=undefined) {
                   if(typeof rowSelected.Value === "number") {
                      if(row.ValueType == "percentage"){
                         rowData.push(kendo.toString(rowSelected.Value, "P2"))
                      } else {
                         rowData.push(rowSelected.Value.toFixed(2))
                      }
                   } else {
                      rowData.push(rowSelected.Value)
                   }
                } else {
                   rowData.push("")
                }
             })

             r.KI()[i].row.push({"rowData" : rowData})
          }
       })

       //end create row
    })
  })
  createKeyFinancialRatios()
  createKeyFinancialParameters()
}

$(function () {
  var space = 100 / ($('.left-scroller a').length - 1)
  $('.left-scroller a').each(function (i, e) {
    $(e).css('top', (i * space) + '%')
    $(e).tooltipster(r.getTooltipOption('right'))
  })
  setTimeout(function(){
    $(".collapsible-header").each(function(i,e){
     $(e).trigger("click");
    });
  },1000);

  $('#top-link-block').removeClass('hidden').affix({
        // how far to scroll down before link "slides" into view
        offset: {top:100}
    });
})