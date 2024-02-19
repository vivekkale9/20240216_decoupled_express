/**We have to create an express e-commerce back end
 * which will perform some tasks using the MyDatabase program that we have 
 * created
 */
// const Database = require('./JSONimplementation');
const Database = require('./MONGOimplementation');
const express = require('express')
const {v4:uuidv4} = require('uuid')

const app = express()
const port = 3600

/** This is a get method to perform when the user hits /search
 * It shows the product after we enter the product name
 */
app.get('/search', async (req, res) => {
  try {
    let string_to_search = req.query.productName;
    const data = await Database.readTable('db_files', 'product.json');
    
    const filteredData = data.filter(entry => entry.product_name === string_to_search);

    res.json(filteredData);
  } catch (error) {
    // Handle errors here, e.g., send an error response
    console.error('Internal Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// This is a function to add a new product
app.post('/product', async (req, res) => {
  let product_id = req.query.id
  let nameProduct = req.query.name
  let price = req.query.price
  let product_desc = req.query.desc
  let product_stock = parseInt(req.query.stock)

  try {
    let new_product = {
      id: product_id,
      product_name: nameProduct,
      product_price: price,
      desc: product_desc,
      stock: product_stock,
    };

    let addProduct = await Database.createRecord('db_files', 'product.json', new_product);

    res.json(addProduct);
  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// To add products to the existing stock
app.put('/product', async (req, res) => {
  let product_id = req.query.id
  let product_stock = parseInt(req.query.stock)
  try{
    let read_stock = await Database.readRecord('db_files', 'product.json', product_id);
    let currentStock = parseInt(read_stock.stock);
    
    let update_product = {
      stock : product_stock + currentStock
    }
    let added_product = await Database.updateRecord('db_files','product.json',product_id,update_product)
    res.json(added_product);
  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

// To remove a product
app.delete('/product', async (req, res) => {
  let product_id = req.query.id
  try{
    let deleted_product = await Database.deleteRecord('db_files','product.json',product_id)
    res.json(deleted_product);
  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

//To checkout 
app.post('/checkout', async (req, res) => {
  let name_product = req.query.productName;
  let product_id = req.query.id;
  let product_stock = parseInt(req.query.stock); // Convert the query stock to an integer

  try {
    let read_stock = await Database.readRecord('db_files', 'product.json', product_id);

    if (read_stock) {
      // Retrieve the current stock from the read_stock object
      let currentStock = parseInt(read_stock.stock);

      // Check if the current stock is sufficient for the checkout
      if (currentStock >= product_stock) {
        // Subtract the query stock from the current stock
        
        let updatedStock = currentStock - product_stock;

        // Update the stock in the database
        await Database.updateRecord('db_files', 'product.json', product_id, { stock: updatedStock });

        res.json({ success: true, message: 'Checkout successful' });
      } else {
        res.json({ success: false, message: 'Not enough stock for checkout' });
      }
    } else {
      res.json({ success: false, message: 'Product not found in the database' });
    }
    // retrieving product price
    let price = parseInt(read_stock.product_price)

    // creating order_ID & total cost
    let orderTB = {
      id: uuidv4(),
      product_name: name_product,
      order_date:"",
      address:"",
      order_status:"",
      total_cost: product_stock * price,
      quantity: product_stock
    }
    Database.createRecord('db_files','order.json',orderTB)
  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// To create order
app.put('/order', async (req, res) => {
  let order_number = req.query.OID
  let orderDate = req.query.date
  let order_address = req.query.address

  try {
    let crtOrder = {
      order_date:orderDate,
      address:order_address,
      order_status:"shipped",
    }

    let upOrder = await Database.updateRecord('db_files', 'order.json',order_number,crtOrder);

    res.json(upOrder);
  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// To get the status
app.get('/status', async (req, res) => {
  try {
    let name_product = req.query.productName;
    const data = await Database.readTable('db_files', 'order.json');
    
    // Case-insensitive comparison and filtering
    const filteredData = data.filter(entry => entry.product_name.toLowerCase() === name_product.toLowerCase());

    if (filteredData.length > 0) {
      const orderStatus = filteredData[0].order_status; // Access the status of the first matching entry
      console.log("This is the order status: ", orderStatus);
      res.json({ orderStatus });
    } else {
      console.log("No matching entry found for product: ", name_product);
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    // Handle errors here, e.g., send an error response
    console.error('Internal Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/cancel', async (req, res) => {
  let order_id = req.query.OID
  let product_id = req.query.PID
  try{
    // to retrieve the stock from product table
    let product_stock = await Database.readRecord('db_files', 'product.json', product_id);
    let currentStock = parseInt(product_stock.stock);
    // to retrieve the quantity bought from the order table
    let order_quantity = await Database.readRecord('db_files','order.json',order_id)
    let prod_quantity = parseInt(order_quantity.quantity)
    // to update the stock back in product table
    let updatedQuantity = currentStock + prod_quantity
    await Database.updateRecord('db_files', 'product.json', product_id, { stock: updatedQuantity });
    // to delete the order
    await Database.deleteRecord('db_files','order.json',order_id)
    res.json(true);
  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
