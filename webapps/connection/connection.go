package connection

import (
	"bufio"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/json"
	_ "github.com/eaciit/dbox/dbc/mongo"
	tk "github.com/eaciit/toolkit"
	"log"
	"os"
	"strings"
)

type Connection struct {
	Host     string
	Port     string
	DB       string
	UserID   string
	Password string
}

var config_file = func() string {
	d, _ := os.Getwd()
	d += "/conf/config.json"
	return d
}()

var (
	wd = func() string {
		d, _ := os.Getwd()
		return d + "/"
	}()
)

func GetConnection() (dbox.IConnection, error) {
	// c := Connection{}
	// c.GetDBConfig()
	c := ReadConfig()
	tk.Println("Connection: ", c)
	ci := &dbox.ConnectionInfo{c["host"], c["database"], c["username"], c["password"], nil}
	conn, e := dbox.NewConnection("mongo", ci)
	e = conn.Connect()
	if e != nil {
		return nil, e
	}
	return conn, nil
}

// func (c *Connection) GetDBConfig() {
// 	ci := &dbox.ConnectionInfo{config_file, "", "", "", nil}
// 	fmt.Println(config_file)
// 	conn, e := dbox.NewConnection("json", ci)
// 	if e != nil {
// 		fmt.Println(e)
// 		return
// 	}
// 	e = conn.Connect()
// 	defer conn.Close()
// 	csr, e := conn.NewQuery().Select("*").Cursor(nil)
// 	if e != nil {
// 		fmt.Println(e)
// 		return
// 	}
// 	defer csr.Close()
// 	data := []tk.M{}
// 	e = csr.Fetch(&data, 0, false)
// 	if e != nil {
// 		fmt.Println(e)
// 		return
// 	}
// 	for _, d := range data {
// 		c.Host = d.Get("host").(string)
// 		// c.Port = d.Get("port").(string)
// 		c.DB = d.Get("database").(string)
// 		c.UserID = d.Get("username").(string)
// 		c.Password = d.Get("password").(string)
// 	}
// }

func ReadConfig() map[string]string {
	ret := make(map[string]string)
	file, err := os.Open(wd + "conf/app.conf")
	if err != nil {
		log.Println(err.Error())
		return ret
	}

	defer file.Close()

	reader := bufio.NewReader(file)
	for {
		line, _, e := reader.ReadLine()
		if e != nil {
			break
		}

		sval := strings.Split(string(line), "=")
		ret[sval[0]] = sval[1]
	}

	return ret
}
