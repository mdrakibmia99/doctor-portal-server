const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000
const app = express()

// middleware 
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Doctor portal is Running')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ucqqd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
  try {
    await client.connect();
    const appointmentServices = client.db('DoctorPortal').collection('services');
    app.get('/services', async (req, res) => {
      console.log("hello")
      const query = {};
      const cursor = appointmentServices.find(query);
      const products = await cursor.toArray();
      res.send(products)

  });
    
   
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})