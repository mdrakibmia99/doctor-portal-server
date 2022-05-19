const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const jwt = require('jsonwebtoken');
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

function verifyJWT(req, res, next) {
  const authorizeCode = req.body.authorization;
  if (!authorizeCode) {
    return res.status(401).send({ message: 'unauthorize access' })
  }
  const token = authorizeCode.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (error) {
      return res.status(403).send({ message: 'forbidden access' })
    }
    req.decoded = decoded;
    next();

  });
}

async function run() {
  try {
    await client.connect();
    const appointmentServices = client.db('DoctorPortal').collection('services');
    const bookingCollection = client.db('DoctorPortal').collection('bookings');
    const usersCollection = client.db('DoctorPortal').collection('users');
    app.get('/services', async (req, res) => {
      console.log("hello")
      const query = {};
      const cursor = appointmentServices.find(query);
      const products = await cursor.toArray();
      res.send(products)

    });
    app.get('/available', async (req, res) => {
      const date = req.query.date;
      console.log(date, "ajker date")
      // const date =req.query.date || "May 16, 2022";
      // stepp 1 get all service 
      const services = await appointmentServices.find().toArray()

      // set:2 get the booking of the day 
      const query = { date: date }
      const bookings = await bookingCollection.find(query).toArray();
      // step:3 
      services.forEach(service => {
        const serviceBookings = bookings.filter(book => book.treatment === service.name)
        const bookedSlots = serviceBookings.map(book => book.slot)
        const available = service.slots.filter(s => !bookedSlots.includes(s))
        service.slots = available;

      })
      res.send(services)

    })



    app.post('/bookings', async (req, res) => {
      const booking = req.body
      const query = { treatment: booking.treatment, date: booking.date, patientMail: booking.patientMail }
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists })
      } else {
        const result = await bookingCollection.insertOne(booking);
        res.send({ success: true, result })
      }

    })
    app.get('/booking', verifyJWT, async (req, res) => {
      const patientMail = req.query.patientMail;
      const decodedMail = req.decoded.email;
      if (decodedMail === patientMail) {
        const query = { patientMail: patientMail }
        const bookings = await bookingCollection.find(query).toArray();
        return res.send(bookings)
      }else{
          return res.status(403).send({message:'forbidden access'})
      }


    })

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
      res.send({ result, token })


    })

  } finally {

    // await client.close();
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})