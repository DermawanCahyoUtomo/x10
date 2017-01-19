package main

// SaveProduct transform remote data master product desc into master account detail
func SaveProduct(data interface{}) error {
	newProduct := TransformMaster("productMasterList", "productDesc", data)
	// debug
	// tk.Printfn("%v", newProduct)
	err := SaveMasterAccountDetail("Products", newProduct)

	if err != nil {
		return err
	}

	return nil
}
