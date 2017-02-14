package controllers

import (
	. "eaciit/x10/webapps/connection"
	"errors"
	"github.com/eaciit/cast"
	"github.com/eaciit/dbox"
	"gopkg.in/mgo.v2/bson"
	"strings"
	// "gopkg.in/mgo.v2/bson"
	// "fmt"
	"time"
	// "github.com/eaciit/dbox"
	// . "eaciit/x10/webapps/connection"
	. "eaciit/x10/webapps/models"

	"github.com/eaciit/knot/knot.v1"
	tk "github.com/eaciit/toolkit"
	// "regexp"
)

type DealSetUpController struct {
	*BaseController
}

func (c *DealSetUpController) Default(k *knot.WebContext) interface{} {
	access := c.LoadBase(k)
	k.Config.NoLog = true
	k.Config.OutputType = knot.OutputTemplate
	DataAccess := Previlege{}

	for _, o := range access {
		DataAccess.Create = o["Create"].(bool)
		DataAccess.View = o["View"].(bool)
		DataAccess.Delete = o["Delete"].(bool)
		DataAccess.Process = o["Process"].(bool)
		DataAccess.Delete = o["Delete"].(bool)
		DataAccess.Edit = o["Edit"].(bool)
		DataAccess.Menuid = o["Menuid"].(string)
		DataAccess.Menuname = o["Menuname"].(string)
		DataAccess.Approve = o["Approve"].(bool)
		DataAccess.Username = o["Username"].(string)
		DataAccess.Fullname = o["Fullname"].(string)
	}

	DataAccess.TopMenu = c.GetTopMenuName(DataAccess.Menuname)

	k.Config.OutputType = knot.OutputTemplate
	k.Config.IncludeFiles = []string{"shared/filter.html", "shared/loading.html", "dealsetup/top.html", "dealsetup/bottom.html"}

	return DataAccess
}

func (c *DealSetUpController) Accept(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson
	res := new(tk.Result)

	payload := tk.M{}

	if err := k.GetPayload(&payload); err != nil {
		res.SetError(err)
		return res
	}

	cn, err := GetConnection()
	defer cn.Close()

	if err != nil {
		res.SetError(err)
		return res
	}

	filters := []*dbox.Filter{}

	cid := payload.GetString("custid")
	dealno := payload.GetString("dealno")

	err, cou, _ := checkDealSetup(cid, dealno)
	if err != nil {
		res.SetError(err)
		return res
	}

	if dealno != "" && cid != "" {
		filters = append(filters, dbox.Eq("dealNo", dealno))
		filters = append(filters, dbox.Eq("dealCustomerId", cid))
	} else {
		res.SetError(errors.New("Parameter Invalid"))
		return res
	}

	csr, e := cn.NewQuery().
		Where(dbox.And(filters...)).
		From("OmnifinXML").
		Cursor(nil)
	defer csr.Close()

	if e != nil {
		res.SetError(e)
		return res
	}

	results := []tk.M{}
	err = csr.Fetch(&results, 0, false)
	if err != nil {
		res.SetError(err)
		return res
	}

	contentbody := tk.M{}

	if len(results) > 0 {
		contentbody = results[len(results)-1]
	} else {
		res.SetError(errors.New("No Data Found"))
		return res
	}

	crList := []tk.M{}
	crL := contentbody.Get("crDealCustomerRoleList").([]interface{})

	for _, varL := range crL {
		crList = append(crList, varL.(tk.M))
	}

	_, _, err = GenerateCustomerProfile(contentbody, crList, cid, dealno)
	if err != nil {
		res.SetError(err)
		return res
	}

	_, _, err = GenerateAccountDetail(contentbody, crList, cid, dealno)
	if err != nil {
		res.SetError(err)
	}

	err = GenerateInternalRTR(contentbody, cid, dealno)
	if err != nil {
		res.SetError(err)
	}

	comp := FindCompany(crList, contentbody.GetString("dealCustomerId"))

	customerDtl := comp.Get("customerDtl").(tk.M)
	err = SaveMaster(cid, dealno, customerDtl.GetString("customerName"))
	if err != nil {
		res.SetError(err)
	}

	err = updateDealSetupLatestData(cid, dealno, "all", "Under Process")
	if err != nil {
		res.SetError(err)
	}

	if cou > 0 {
		arr := []string{"AccountDetails", "InternalRTR", "BankAnalysisV2", "CustomerProfile", "RatioInputData", "RepaymentRecords", "StockandDebt", "CibilReport", "CibilReportPromotorFinal", "DueDiligenceInput"}
		for _, val := range arr {
			err = changeStatus(cid, dealno, val, 0)
			if err != nil {
				res.SetError(err)
			}
		}
	}

	return res
}

const timeFormat = "2006-01-02T15:04:05.99Z"

//
// Enable this to debug / test changeStatus
// Access with json body such as:
// {
// 	"CustomerID": "27",
// 	"DealNo": "DLBLR00615-160000018",
// 	"Table": "DueDiligenceInput",
// 	"Status": 2
// }
//
// func (c *DealSetUpController) Test(k *knot.WebContext) interface{} {
// 	k.Config.OutputType = knot.OutputJson
// 	var load struct {
// 		CustomerID string
// 		DealNo     string
// 		Table      string
// 		Status     int
// 	}
//
// 	k.GetPayload(&load)
// 	changeStatus(load.CustomerID, load.DealNo, load.Table, load.Status)
//
// 	return "OK"
// }

func changeStatus(CustomerID string, DealNo string, TableName string, Status int) error {

	custInt := cast.ToInt(CustomerID, cast.RoundingAuto)
	concate := CustomerID + "|" + DealNo
	curTime := time.Now()

	//delete query
	ctx, e := GetConnection()
	defer ctx.Close()

	if e != nil {
		return e
	}
	que := ctx.NewQuery().
		From(TableName).
		SetConfig("multiexec", true)

	defer que.Close()

	//save query
	qinsert := ctx.NewQuery().
		From(TableName).
		SetConfig("multiexec", true).
		Save()
	defer qinsert.Close()

	insertdata := tk.M{}

	switch TableName {
	case "AccountDetails":
		que = que.Where(dbox.Eq("_id", concate))
		me := []AccountDetail{}
		csr, e := que.Cursor(nil)
		if e != nil {
			return e
		}

		defer csr.Close()

		err := csr.Fetch(&me, 0, false)
		if err != nil {
			return err
		}

		for _, dt := range me {
			switch Status {
			case 0:
				dt.Status = 0
				dt.Freeze = false
				UpdateDealSetup(CustomerID, DealNo, "ad", "Under Process")
			case 1:
				dt.Status = 1
				dt.Freeze = false
				dt.DateConfirmed = curTime
				UpdateDealSetup(CustomerID, DealNo, "ad", "Confirmed")
			case 2:
				dt.Status = 1
				dt.Freeze = true
				dt.DateFreeze = curTime
				UpdateDealSetup(CustomerID, DealNo, "ad", "Freeze")
			}

			insertdata = insertdata.Set("data", dt)
			e = qinsert.Exec(insertdata)
			if e != nil {
				return e
			}
		}

	case "InternalRTR":
		que = que.Where(dbox.Eq("_id", concate))
		me := []InternalRtr{}
		csr, e := que.Cursor(nil)
		if e != nil {
			return e
		}

		defer csr.Close()

		err := csr.Fetch(&me, 0, false)
		if err != nil {
			return err
		}

		for _, dt := range me {
			switch Status {
			case 0:
				dt.Status = 0
				dt.Isfreeze = false
				UpdateDealSetup(CustomerID, DealNo, "irtr", "Under Process")
			case 1:
				dt.Status = 1
				dt.Isfreeze = false
				UpdateDealSetup(CustomerID, DealNo, "irtr", "Confirmed")
			case 2:
				dt.Status = 1
				dt.Isfreeze = true
				UpdateDealSetup(CustomerID, DealNo, "irtr", "Freeze")
			}
			insertdata = insertdata.Set("data", dt)
			e = qinsert.Exec(insertdata)
			if e != nil {
				return e
			}
		}
	case "BankAnalysisV2":
		que = que.Where(dbox.Eq("CustomerId", custInt), dbox.Eq("DealNo", DealNo))
		me := []BankAnalysisV2{}

		csr, e := que.Cursor(nil)
		if e != nil {
			return e
		}

		defer csr.Close()

		err := csr.Fetch(&me, 0, false)
		if err != nil {
			return err
		}

		for _, dt := range me {
			switch Status {
			case 0:
				dt.Status = 0
				dt.IsConfirmed = false
				dt.IsFreeze = false
				UpdateDealSetup(CustomerID, DealNo, "ba", "Under Process")
			case 1:
				dt.Status = 1
				dt.IsConfirmed = true
				dt.IsFreeze = false
				dt.DateConfirmed = curTime
				UpdateDealSetup(CustomerID, DealNo, "ba", "Confirmed")
			case 2:
				dt.Status = 1
				dt.IsConfirmed = true
				dt.IsFreeze = true
				dt.DateFreeze = curTime
				UpdateDealSetup(CustomerID, DealNo, "ba", "Freeze")
			}
			insertdata = insertdata.Set("data", dt)
			e = qinsert.Exec(insertdata)
			if e != nil {
				return e
			}
		}
	case "CustomerProfile":
		que = que.Where(dbox.Eq("_id", concate))
		me := []CustomerProfiles{}
		csr, e := que.Cursor(nil)
		if e != nil {
			return e
		}

		defer csr.Close()

		err := csr.Fetch(&me, 0, false)
		if err != nil {
			return err
		}

		for _, dt := range me {
			dt.Status = Status

			// specific code for customer profile handling
			dt.DateSave = curTime.Format(timeFormat)
			dt.DateFreeze = curTime.Format(timeFormat)
			dt.ConfirmedDate = curTime
			dt.LastUpdate = curTime
			// Freeze, update verified date
			if dt.Status == 2 {
				dt.VerifiedBy = ""
				dt.VerifiedDate = curTime
			}
			// Update DealSetup
			switch dt.Status {
			case 2:
				UpdateDealSetup(CustomerID, DealNo, "ca", "Freeze")
			case 1:
				UpdateDealSetup(CustomerID, DealNo, "ca", "Confirmed")
			case 0:
				UpdateDealSetup(CustomerID, DealNo, "ca", "Under Process")
			}

			insertdata = insertdata.Set("data", dt)
			e = qinsert.Exec(insertdata)
			if e != nil {
				return e
			}
		}
	case "RatioInputData":
		que = que.Where(dbox.Eq("customerid", concate))
		me := []RatioInputData{}
		csr, e := que.Cursor(nil)
		if e != nil {
			return e
		}

		defer csr.Close()

		err := csr.Fetch(&me, 0, false)
		if err != nil {
			return err
		}

		for _, dt := range me {
			switch Status {
			case 0:
				dt.Confirmed = false
				dt.IsFrozen = false
				UpdateDealSetup(CustomerID, DealNo, "bsi", "Under Process")
			case 1:
				dt.Confirmed = true
				dt.IsFrozen = false
				UpdateDealSetup(CustomerID, DealNo, "bsi", "Confirmed")
			case 2:
				dt.Confirmed = true
				dt.IsFrozen = true
				UpdateDealSetup(CustomerID, DealNo, "bsi", "Freeze")
			}
			insertdata = insertdata.Set("data", dt)
			e = qinsert.Exec(insertdata)
			if e != nil {
				return e
			}

		}
	case "RepaymentRecords":
		que = que.Where(dbox.Eq("CustomerId", CustomerID), dbox.Eq("DealNo", DealNo))
		me := []RTRBottom{}
		csr, e := que.Cursor(nil)
		if e != nil {
			return e
		}

		defer csr.Close()

		err := csr.Fetch(&me, 0, false)
		if err != nil {
			return err
		}

		for _, dt := range me {

			dt.Status = Status
			dt.DateSave = curTime
			switch Status {
			case 0:
				UpdateDealSetup(CustomerID, DealNo, "ertr", "Under Process")
			case 1:
				dt.DateConfirmed = curTime
				UpdateDealSetup(CustomerID, DealNo, "ertr", "Confirmed")
			case 2:
				dt.DateFreeze = curTime
				UpdateDealSetup(CustomerID, DealNo, "ertr", "Freeze")
			}

			insertdata = insertdata.Set("data", dt)
			e = qinsert.Exec(insertdata)
			if e != nil {
				return e
			}
		}
	case "StockandDebt":
		que = que.Where(dbox.Eq("customerid", concate))
		me := []StockandDebtModel{}
		csr, e := que.Cursor(nil)
		if e != nil {
			return e
		}

		defer csr.Close()

		err := csr.Fetch(&me, 0, false)
		if err != nil {
			return err
		}

		for _, dt := range me {
			switch Status {
			case 0:
				dt.IsConfirm = false
				dt.IsFreeze = false
				UpdateDealSetup(CustomerID, DealNo, "sbd", "Under Process")
			case 1:
				dt.IsConfirm = true
				dt.IsFreeze = false
				UpdateDealSetup(CustomerID, DealNo, "sbd", "Confirmed")
			case 2:
				dt.IsConfirm = true
				dt.IsFreeze = true
				UpdateDealSetup(CustomerID, DealNo, "sbd", "Freeze")
			}
			insertdata = insertdata.Set("data", dt)
			e = qinsert.Exec(insertdata)
			if e != nil {
				return e
			}
		}
	case "CibilReport":
		que = que.Where(dbox.Eq("Profile.customerid", custInt), dbox.Eq("Profile.dealno", DealNo))
		me := []CibilReportModel{}
		csr, e := que.Cursor(nil)
		if e != nil {
			return e
		}

		defer csr.Close()

		err := csr.Fetch(&me, 0, false)
		if err != nil {
			return err
		}

		for _, dt := range me {

			// status is not saved in status
			// but in isconfirm and IsFreeze
			switch Status {
			case 0:
				dt.IsConfirm = 0
				dt.IsFreeze = false
				UpdateDealSetup(CustomerID, DealNo, "cibil", "Under Process")
			case 1:
				dt.IsConfirm = 1
				dt.IsFreeze = false
				UpdateDealSetup(CustomerID, DealNo, "cibil", "Confirmed")
			case 2:
				dt.IsConfirm = 1
				dt.IsFreeze = true
				UpdateDealSetup(CustomerID, DealNo, "cibil", "Freeze")
			}

			dt.Status = Status

			insertdata = insertdata.Set("data", dt)
			e = qinsert.Exec(insertdata)
			if e != nil {
				return e
			}
		}
	case "CibilReportPromotorFinal":
		que = que.Where(dbox.Eq("ConsumerInfo.CustomerId", custInt), dbox.Eq("ConsumerInfo.DealNo", DealNo))
		me := []ReportData{}
		csr, e := que.Cursor(nil)
		if e != nil {
			return e
		}

		defer csr.Close()

		err := csr.Fetch(&me, 0, false)
		if err != nil {
			return err
		}

		for _, dt := range me {
			// Status cibil is not freezed
			// Ignore on freezed
			switch Status {
			case 0:
				dt.StatusCibil = 0
			case 1:
				dt.StatusCibil = 1
			case 2:
				dt.StatusCibil = 1
			}
			insertdata = insertdata.Set("data", dt)
			e = qinsert.Exec(insertdata)
			if e != nil {
				return e
			}
		}
	case "DueDiligenceInput":
		que = que.Where(dbox.Eq("_id", concate))
		me := []DueDiligenceInput{}
		csr, e := que.Cursor(nil)
		if e != nil {
			return e
		}

		defer csr.Close()

		err := csr.Fetch(&me, 0, false)
		if err != nil {
			return err
		}

		for _, dt := range me {
			dt.DateSave = curTime
			switch Status {
			case 0:
				dt.Status = 0
				dt.Freeze = false
				UpdateDealSetup(CustomerID, DealNo, "dd", "Under Process")
			case 1:
				dt.Status = 1
				dt.Freeze = false
				dt.LastConfirmed = curTime
				UpdateDealSetup(CustomerID, DealNo, "dd", "Confirmed")
			case 2:
				dt.Status = 1
				dt.Freeze = true
				dt.DateFreeze = curTime
				UpdateDealSetup(CustomerID, DealNo, "dd", "Freeze")
			}
			insertdata = insertdata.Set("data", dt)
			e = qinsert.Exec(insertdata)
			if e != nil {
				return e
			}
		}
	default:
		return errors.New("Table Name Not Registered")
	}

	return nil
}

func (c *DealSetUpController) SendBack(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson
	res := new(tk.Result)

	payload := tk.M{}

	if err := k.GetPayload(&payload); err != nil {
		res.SetError(err)
		return res
	}

	cid := payload.GetString("custid")
	dealno := payload.GetString("dealno")

	err, _, _ := checkDealSetup(cid, dealno)
	if err != nil {
		message := strings.Replace(err.Error(), "Accept", "Send Back", -1)
		res.SetError(errors.New(message))
		return res
	}

	err = updateDealSetupLatestData(cid, dealno, "ds", "Sent Back to Omnifin")
	if err != nil {
		res.SetError(err)
	}

	return res
}

func (c *DealSetUpController) CheckData(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson
	res := new(tk.Result)
	payload := tk.M{}

	if err := k.GetPayload(&payload); err != nil {
		res.SetError(err)
		return res
	}

	cid := payload.GetString("custid")
	dealno := payload.GetString("dealno")

	err, cou, _ := checkDealSetup(cid, dealno)

	if err != nil && !strings.Contains(err.Error(), "Accept") {
		res.SetError(err)
		return res
	}

	res.SetData(tk.M{"count": cou})

	return res
}

func checkDealSetup(cid string, dealno string) (error, int, string) {
	cn, err := GetConnection()
	defer cn.Close()

	if err != nil {
		return err, 0, ""
	}

	csr, e := cn.NewQuery().
		Where(dbox.Eq("customerprofile._id", cid+"|"+dealno)).
		From("DealSetup").
		Cursor(nil)
	defer csr.Close()

	if e != nil {
		return e, 0, ""
	}

	result := []tk.M{}
	err = csr.Fetch(&result, 0, false)
	if err != nil {
		return err, 0, ""
	}

	if len(result) > 1 {
		latest := result[len(result)-2]
		infos := latest.Get("info").(tk.M)
		myInfo := infos.Get("myInfo").([]interface{})
		latestinfo := myInfo[len(myInfo)-1].(tk.M).GetString("status")
		if latestinfo != "Approved" && latestinfo != "Rejected" && latestinfo != "Cancelled" && latestinfo != "On Hold" && latestinfo != "Sent Back for Analysis" && latestinfo != "Sent Back to Omnifin" {
			return errors.New("Accept Failed, existing data status is " + latestinfo), len(result), ""
		}
		return nil, len(result), latestinfo
	}
	return nil, len(result), ""
}

func updateDealSetupLatestData(cid string, dealno string, formname string, formstatus string) error {

	cn, err := GetConnection()
	defer cn.Close()

	if err != nil {
		return err
	}

	csr, e := cn.NewQuery().
		Where(dbox.Eq("customerprofile._id", cid+"|"+dealno)).
		From("DealSetup").
		Cursor(nil)
	defer csr.Close()

	if e != nil {
		return err
	}

	results := []tk.M{}
	err = csr.Fetch(&results, 0, false)
	if err != nil {
		return err
	}

	if len(results) == 0 {
		return errors.New("Data Deal Set-up not found")
	}

	result := results[len(results)-1]

	infos := result.Get("info").(tk.M)

	switch formname {
	case "ds":
		myInfos := CheckArraytkM(infos.Get("myInfo"))
		myInfos = append(myInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("myInfo", myInfos)
	case "ca":
		caInfos := CheckArraytkM(infos.Get("caInfo"))
		caInfos = append(caInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("caInfo", caInfos)
	case "cibil":
		cibilInfos := CheckArraytkM(infos.Get("cibilInfo"))
		cibilInfos = append(cibilInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("cibilInfo", cibilInfos)
	case "bsi":
		bsiInfos := CheckArraytkM(infos.Get("bsiInfo"))
		bsiInfos = append(bsiInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("bsiInfo", bsiInfos)
	case "sbd":
		sbdInfos := CheckArraytkM(infos.Get("sbdInfo"))
		sbdInfos = append(sbdInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("sbdInfo", sbdInfos)
	case "ad":
		adInfos := CheckArraytkM(infos.Get("adInfo"))
		adInfos = append(adInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("adInfo", adInfos)
	case "ba":
		baInfos := CheckArraytkM(infos.Get("baInfo"))
		baInfos = append(baInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("baInfo", baInfos)
	case "ertr":
		ertrInfos := CheckArraytkM(infos.Get("ertrInfo"))
		ertrInfos = append(ertrInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("ertrInfo", ertrInfos)
	case "irtr":
		irtrInfos := CheckArraytkM(infos.Get("irtrInfo"))
		irtrInfos = append(irtrInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("irtrInfo", irtrInfos)
	case "dd":
		ddInfos := CheckArraytkM(infos.Get("ddInfo"))
		ddInfos = append(ddInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("ddInfo", ddInfos)
	case "dcf":
		dcfInfos := CheckArraytkM(infos.Get("dcfInfo"))
		dcfInfos = append(dcfInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("dcfInfo", dcfInfos)
	case "cac":
		cacInfos := CheckArraytkM(infos.Get("cacInfo"))
		cacInfos = append(cacInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("cacInfo", cacInfos)
	case "all":
		myInfos := CheckArraytkM(infos.Get("myInfo"))
		myInfos = append(myInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("myInfo", myInfos)
		caInfos := CheckArraytkM(infos.Get("caInfo"))
		caInfos = append(caInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("caInfo", caInfos)

		cibilInfos := CheckArraytkM(infos.Get("cibilInfo"))
		cibilInfos = append(cibilInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("cibilInfo", cibilInfos)

		bsiInfos := CheckArraytkM(infos.Get("bsiInfo"))
		bsiInfos = append(bsiInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("bsiInfo", bsiInfos)

		sbdInfos := CheckArraytkM(infos.Get("sbdInfo"))
		sbdInfos = append(sbdInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("sbdInfo", sbdInfos)

		adInfos := CheckArraytkM(infos.Get("adInfo"))
		adInfos = append(adInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("adInfo", adInfos)

		baInfos := CheckArraytkM(infos.Get("baInfo"))
		baInfos = append(baInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("baInfo", baInfos)

		ertrInfos := CheckArraytkM(infos.Get("ertrInfo"))
		ertrInfos = append(ertrInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("ertrInfo", ertrInfos)

		irtrInfos := CheckArraytkM(infos.Get("irtrInfo"))
		irtrInfos = append(irtrInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("irtrInfo", irtrInfos)

		ddInfos := CheckArraytkM(infos.Get("ddInfo"))
		ddInfos = append(ddInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("ddInfo", ddInfos)

		dcfInfos := CheckArraytkM(infos.Get("dcfInfo"))
		dcfInfos = append(dcfInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("dcfInfo", dcfInfos)

		cacInfos := CheckArraytkM(infos.Get("cacInfo"))
		cacInfos = append(cacInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("cacInfo", cacInfos)
	}

	result.Set("info", infos)

	qinsert := cn.NewQuery().
		From("DealSetup").
		SetConfig("multiexec", true).
		Save()

	csc := map[string]interface{}{"data": result}
	err = qinsert.Exec(csc)
	if err != nil {
		return err
	}

	return nil

}

var ErrorDataNotFound = errors.New("Data Deal Set-up Not Found")

func UpdateDealSetup(cid string, dealno string, formname string, formstatus string) error {

	cn, err := GetConnection()
	defer cn.Close()

	if err != nil {
		return err
	}

	csr, e := cn.NewQuery().
		Where(dbox.Eq("customerprofile._id", cid+"|"+dealno)).
		From("DealSetup").
		Cursor(nil)
	if e != nil {
		return err
	}
	defer csr.Close()

	results := []tk.M{}
	err = csr.Fetch(&results, 0, false)
	if err != nil {
		return err
	}

	found := false
	var result tk.M

	// find the last one where status is not In queue
	for _, val := range results {
		infos := val.Get("info").(tk.M)
		myInfos := CheckArraytkM(infos.Get("myInfo"))
		if len(myInfos) == 0 {
			continue
		}

		status := myInfos[len(myInfos)-1].GetString("status")
		if status == "In queue" || status == "Send Back to Omnifin" {
			continue
		}

		found = true
		result = val
	}

	if !found {
		return ErrorDataNotFound
	}

	infos := result.Get("info").(tk.M)

	switch formname {
	case "ds":
		myInfos := CheckArraytkM(infos.Get("myInfo"))
		myInfos = append(myInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("myInfo", myInfos)
	case "ca":
		caInfos := CheckArraytkM(infos.Get("caInfo"))
		caInfos = append(caInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("caInfo", caInfos)
	case "cibil":
		cibilInfos := CheckArraytkM(infos.Get("cibilInfo"))
		cibilInfos = append(cibilInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("cibilInfo", cibilInfos)
	case "bsi":
		bsiInfos := CheckArraytkM(infos.Get("bsiInfo"))
		bsiInfos = append(bsiInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("bsiInfo", bsiInfos)
	case "sbd":
		sbdInfos := CheckArraytkM(infos.Get("sbdInfo"))
		sbdInfos = append(sbdInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("sbdInfo", sbdInfos)
	case "ad":
		adInfos := CheckArraytkM(infos.Get("adInfo"))
		adInfos = append(adInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("adInfo", adInfos)
	case "ba":
		baInfos := CheckArraytkM(infos.Get("baInfo"))
		baInfos = append(baInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("baInfo", baInfos)
	case "ertr":
		ertrInfos := CheckArraytkM(infos.Get("ertrInfo"))
		ertrInfos = append(ertrInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("ertrInfo", ertrInfos)
	case "irtr":
		irtrInfos := CheckArraytkM(infos.Get("irtrInfo"))
		irtrInfos = append(irtrInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("irtrInfo", irtrInfos)
	case "dd":
		ddInfos := CheckArraytkM(infos.Get("ddInfo"))
		ddInfos = append(ddInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("ddInfo", ddInfos)
	case "dcf":
		dcfInfos := CheckArraytkM(infos.Get("dcfInfo"))
		dcfInfos = append(dcfInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("dcfInfo", dcfInfos)
	case "cac":
		cacInfos := CheckArraytkM(infos.Get("cacInfo"))
		cacInfos = append(cacInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("cacInfo", cacInfos)
	case "all":
		myInfos := CheckArraytkM(infos.Get("myInfo"))
		myInfos = append(myInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("myInfo", myInfos)
		caInfos := CheckArraytkM(infos.Get("caInfo"))
		caInfos = append(caInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("caInfo", caInfos)

		cibilInfos := CheckArraytkM(infos.Get("cibilInfo"))
		cibilInfos = append(cibilInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("cibilInfo", cibilInfos)

		bsiInfos := CheckArraytkM(infos.Get("bsiInfo"))
		bsiInfos = append(bsiInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("bsiInfo", bsiInfos)

		sbdInfos := CheckArraytkM(infos.Get("sbdInfo"))
		sbdInfos = append(sbdInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("sbdInfo", sbdInfos)

		adInfos := CheckArraytkM(infos.Get("adInfo"))
		adInfos = append(adInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("adInfo", adInfos)

		baInfos := CheckArraytkM(infos.Get("baInfo"))
		baInfos = append(baInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("baInfo", baInfos)

		ertrInfos := CheckArraytkM(infos.Get("ertrInfo"))
		ertrInfos = append(ertrInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("ertrInfo", ertrInfos)

		irtrInfos := CheckArraytkM(infos.Get("irtrInfo"))
		irtrInfos = append(irtrInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("irtrInfo", irtrInfos)

		ddInfos := CheckArraytkM(infos.Get("ddInfo"))
		ddInfos = append(ddInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("ddInfo", ddInfos)

		dcfInfos := CheckArraytkM(infos.Get("dcfInfo"))
		dcfInfos = append(dcfInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("dcfInfo", dcfInfos)

		cacInfos := CheckArraytkM(infos.Get("cacInfo"))
		cacInfos = append(cacInfos, tk.M{}.Set("updateTime", time.Now()).Set("status", formstatus))
		infos.Set("cacInfo", cacInfos)
	}

	result.Set("info", infos)

	qinsert := cn.NewQuery().
		From("DealSetup").
		SetConfig("multiexec", true).
		Save()

	csc := map[string]interface{}{"data": result}
	err = qinsert.Exec(csc)
	if err != nil {
		return err
	}

	return nil

}
func (c *DealSetUpController) GetAllDataDealSetup(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	type xsorting struct {
		Field string
		Dir   string
	}

	p := struct {
		Skip               int
		Take               int
		Sort               []xsorting
		SearchCustomerName string
		SearchDealNo       string
		Id                 string
	}{}

	e := k.GetPayload(&p)

	if e != nil {
		c.WriteLog(e)
	}

	c.WriteLog(p)

	cn, err := GetConnection()
	defer cn.Close()

	if err != nil {
		panic(err)
	}

	keys := []*dbox.Filter{}
	if p.SearchCustomerName != "" {
		keys = append(keys, dbox.Contains("customerprofile.applicantdetail.CustomerName", p.SearchCustomerName))
	}

	if p.SearchDealNo != "" {
		keys = append(keys, dbox.Contains("customerprofile.applicantdetail.DealNo", p.SearchDealNo))
	}

	if p.Id != "" {
		keys = append(keys, dbox.Eq("customerprofile._id", p.Id))
	}

	query1 := cn.NewQuery().
		From("DealSetup").
		Skip(p.Skip).
		Take(p.Take)

	if len(keys) > 0 {
		query1 = query1.Where(dbox.And(keys...))
	}

	if len(p.Sort) > 0 {
		var arrsort []string
		for _, val := range p.Sort {
			if val.Dir == "desc" {
				arrsort = append(arrsort, strings.ToLower("-"+p.Sort[0].Field))
			} else {
				arrsort = append(arrsort, strings.ToLower(p.Sort[0].Field))
			}
		}
		query1 = query1.Order(arrsort...)
	}

	csr, e := query1.Cursor(nil)
	defer csr.Close()

	if e != nil {
		panic(e)
	}

	results1 := make([]DealSetupModel, 0)
	e = csr.Fetch(&results1, 0, false)
	// c.WriteLog(results1)
	if e != nil {
		return e.Error()
	}
	// results2 := results1

	query := tk.M{}.Set("AGGR", "$sum")
	csr, err = c.Ctx.Find(new(DealSetupModel), query)
	defer csr.Close()
	if err != nil {
		return err.Error()
	}

	data := struct {
		Data  []DealSetupModel
		Total int
	}{
		Data:  results1,
		Total: csr.Count(),
	}

	return data

}

func (c *DealSetUpController) GetSelectedDataDealSetup(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	payload := tk.M{}

	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultInfo(true, err.Error(), nil)
	}

	res := make([]DealSetupModel, 0)
	query := tk.M{"where": dbox.Eq("_id", bson.ObjectIdHex(payload["Id"].(string)))}
	csr, err := c.Ctx.Find(new(DealSetupModel), query)
	defer csr.Close()
	if err != nil {
		return c.SetResultInfo(true, err.Error(), nil)
	}

	err = csr.Fetch(&res, 0, false)
	if err != nil {
		return c.SetResultInfo(true, err.Error(), nil)
	}

	return c.SetResultInfo(false, "success", res)
}
