package models

import (
	. "eaciit/x10/webapps/connection"
	"github.com/eaciit/dbox"
	"github.com/eaciit/orm"
	tk "github.com/eaciit/toolkit"
	"gopkg.in/mgo.v2/bson"
	"time"
)

type DCFinalSanctionModel struct {
	orm.ModelBase    `bson:"-",json:"-"`
	Id               bson.ObjectId `bson:"_id" , json:"_id"`
	CustomerId       int           `bson:"CustomerId"`
	DealNo           string        `bson:"DealNo"`
	Date             time.Time     `bson:"Date"`
	Amount           float64       `bson:"Amount"`
	IsNullAmount     bool          `bson: "IsNullAmount,omitempty"`
	ROI              float64       `bson:"ROI"`
	IsNullROI        bool          `bson: "IsNullROI,omitempty"`
	PF               string        `bson:"PF"`
	PG               string        `bson:"PG"`
	Security         string        `bson:"Security"`
	OtherConditions  []string      `bson:"OtherConditions"`
	CommitteeRemarks string        `bson:"CommitteeRemarks"`
	Status           bool          `bson:"Status"`
	LatestStatus     string        `bson:"LatestStatus,omitempty"`
}

func NewDCFinalSanctionModel() *DCFinalSanctionModel {
	m := new(DCFinalSanctionModel)
	return m
}
func (e *DCFinalSanctionModel) RecordID() interface{} {
	return e.Id
}

func (m *DCFinalSanctionModel) TableName() string {
	return "DCFinalSanction"
}

func (m *DCFinalSanctionModel) Get(customerId int, dealNo string) (DCFinalSanctionModel, error) {

	datas := DCFinalSanctionModel{}

	cMongo, em := GetConnection()
	defer cMongo.Close()
	if em != nil {
		return datas, em
	}

	query := []*dbox.Filter{}
	query = append(query, dbox.Eq("CustomerId", customerId))
	query = append(query, dbox.Eq("DealNo", dealNo))

	csr, err := cMongo.NewQuery().
		Where(query...).
		From(m.TableName()).
		Cursor(nil)

	if err != nil {
		return datas, err
	}

	defer csr.Close()

	if csr != nil {
		err = csr.Fetch(&datas, 1, true)

		if err != nil {
			return datas, err
		}
	} else if err != nil {
		return datas, err
	}

	return datas, nil
}

func (m *DCFinalSanctionModel) Save(datas DCFinalSanctionModel) (DCFinalSanctionModel, error) {

	if datas.Id == "" {
		datas.Id = bson.NewObjectId()
	}

	cMongo, em := GetConnection()
	defer cMongo.Close()
	if em != nil {
		return datas, em
	}

	q := cMongo.NewQuery().SetConfig("multiexec", true).From(m.TableName()).Save()

	defer q.Close()

	err := q.Exec(tk.M{"data": datas})

	return datas, err
}

func (m *DCFinalSanctionModel) Update(datas DCFinalSanctionModel) error {

	if datas.Id == "" {
		_, err := m.Save(datas)

		return err
	} else {
		cMongo, em := GetConnection()
		defer cMongo.Close()
		if em != nil {
			return em
		}

		q := cMongo.NewQuery().SetConfig("multiexec", true).From(m.TableName()).Save()

		defer q.Close()

		err := q.Exec(tk.M{"data": datas})

		return err
	}
}
