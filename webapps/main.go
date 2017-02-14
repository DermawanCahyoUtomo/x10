package main

import (
	"eaciit/x10/webapps/helper"
	. "eaciit/x10/webapps/models"
	webext "eaciit/x10/webapps/webext"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	db "github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/orm"
	tk "github.com/eaciit/toolkit"

	"eaciit/x10/webapps/connection"
	"eaciit/x10/webapps/omnifin"
)

var IncludeList = []string{
	"/getdata",
}

func startTimer() {
	timer := helper.Timer{}

	cfg := connection.ReadConfig()

	dura := 300 // default 5 mins
	val, ok := cfg["userFetchDuration"]
	if ok {
		tmp, err := strconv.Atoi(val)
		if err == nil {
			dura = tmp
		}
	}

	if dura > 0 {
		tk.Printfn("Fetch master user every %d secs", dura)
		timer.Add(time.Duration(dura)*time.Second, func() {
			tk.Println("Update MasterUser")
			err := omnifin.ProcessMasterUser()
			if err != nil {
				tk.Printfn("%s", err)
			}
		})
	} else {
		tk.Printfn("Fetch master user disabled")
	}

	timer.Start()
}

func main() {

	app := knot.GetApp("X10-dev")
	if app == nil {
		log.Println("App not found....")
		return
	}

	startTimer()
	routes := map[string]knot.FnContent{
		"/": func(r *knot.WebContext) interface{} {
			// do something when / is accessed
			//			log.Println("/", r.Request.URL.String())
			http.Redirect(r.Writer, r.Request, "/login/default", http.StatusTemporaryRedirect)
			return true
		},
		"prerequest": func(r *knot.WebContext) interface{} {
			// tk.Println(r.Session("username"))
			if r.Request.URL.String() == "/login/default" && r.Session("username") != nil {
				http.Redirect(r.Writer, r.Request, "/dashboard/default", http.StatusTemporaryRedirect)
				return true
			}

			// will called on every request, before the action
			if checkInList(r.Request.URL.String()) {
				log.Println("prerequest", r.Request.URL.String())
				checkMenuAction(webext.HdrCtx, r.Request.URL.String(), r)
			} else if !strings.Contains(r.Request.URL.String(), "datamaster") {
				checkMenu(webext.HdrCtx, r.Request.URL.String(), r)
			}

			// http.Redirect(r.Writer, r.Request, "/dashboard/default", http.StatusTemporaryRedirect)
			return nil
		},
		"postrequest": func(r *knot.WebContext) interface{} {
			// will called on every request, after the action
			//			log.Println("postrequest", r.Request.URL.String())
			return nil
		},
	}
	knot.StartAppWithFn(app, "localhost:9013", routes)
}

func checkInList(surl string) bool {
	for _, s := range IncludeList {
		if strings.Contains(surl, s) {
			return true
		} else if strings.Contains(s, surl) {
			return true
		}
	}
	return false
}

func checkMenu(ctx *orm.DataContext, surl string, k *knot.WebContext) {
	if strings.Contains(surl, "activitylog") {
		return
	}
	data := TopMenuModel{}
	crs, err := ctx.Find(NewTopMenuModel(), tk.M{}.Set("where", db.Eq("Url", surl)))
	if err != nil {
		tk.Println(err.Error())
	}
	err = crs.Fetch(&data, 1, false)
	defer crs.Close()
	if data.Id != "" {
		sUser := ""
		if k.Session("username", "") != "" {
			sUser = k.Session("username").(string)
		}
		if sUser != "" {
			//INSERT LOG
			if strings.Contains(surl, "/getdata") {
				//VIEW
				log.Println(sUser, "; view ; ", data.Title)
				InsertSimpleActivityLog(ctx, data.Url, data.Title, "VIEW", sUser, k.Request.RemoteAddr)
			} else if strings.Contains(surl, "/savedata") {
				//SAVE / UPDATE
				InsertSimpleActivityLog(ctx, data.Url, data.Title, "SAVE", sUser, k.Request.RemoteAddr)
				log.Println(sUser, "; save; ", data.Title)
			} else {
				// VISIT
				InsertSimpleActivityLog(ctx, data.Url, data.Title, "VISIT", sUser, k.Request.RemoteAddr)
				log.Println(sUser, "; visit; ", data.Title)
			}
		}
	}
	return
}
func checkMenuAction(ctx *orm.DataContext, surl string, k *knot.WebContext) {
	if strings.Contains(surl, "activitylog") {
		return
	}
	xurl := surl
	xurl = xurl[:strings.LastIndex(xurl, "/")] + "/default"
	tk.Println("SURL NEW ", xurl)
	data := TopMenuModel{}
	crs, err := ctx.Find(NewTopMenuModel(), tk.M{}.Set("where", db.Eq("Url", xurl)))
	if err != nil {
		tk.Println(err.Error())
	}
	err = crs.Fetch(&data, 1, false)
	defer crs.Close()
	if data.Id != "" {
		sUser := ""
		if k.Session("username", "") != "" {
			sUser = k.Session("username").(string)
		}
		if sUser != "" {
			//INSERT LOG
			if strings.Contains(surl, "/getdata") {
				//VIEW
				log.Println(sUser, "; view ; ", data.Title)
				InsertSimpleActivityLog(ctx, data.Url, data.Title, "VIEW", sUser, k.Request.RemoteAddr)
			} else if strings.Contains(surl, "/savedata") {
				//SAVE / UPDATE
				InsertSimpleActivityLog(ctx, data.Url, data.Title, "SAVE", sUser, k.Request.RemoteAddr)
				log.Println(sUser, "; save; ", data.Title)
			} else {
				// VISIT
				InsertSimpleActivityLog(ctx, data.Url, data.Title, "VISIT", sUser, k.Request.RemoteAddr)
				log.Println(sUser, "; visit; ", data.Title)
			}
		}
	}
	return
}

func InsertSimpleActivityLog(ctx *orm.DataContext, pageUrl string, pageName string, pageActivity string, username string, ipaddress string) {
	mdl := NewActivityLogModel()
	mdl.Username = username
	mdl.IpAddress = ipaddress[:strings.Index(ipaddress, ":")]
	mdl.PageName = pageName
	mdl.PageUrl = pageUrl
	mdl.Activity = pageActivity
	mdl.AccessTime = time.Now()
	mdl.AccessDate, _ = strconv.Atoi(time.Now().Format("20060102"))
	ctx.Save(mdl)
	return
}
