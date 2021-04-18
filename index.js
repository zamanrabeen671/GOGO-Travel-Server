const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
const ObjectId = require('mongodb').ObjectId

require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('services'));
app.use(fileUpload());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7kyx1.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const servicesCollection = client.db("gogoTravels").collection("services");
    const BookingsCollection = client.db("gogoTravels").collection("bookings");
    const MakeAdminCollection = client.db("gogoTravels").collection("admin");
    const reviewCollection = client.db("gogoTravels").collection("review");
    // save services into database 
    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const description = req.body.description;
        const fee = req.body.fee;
        // console.log(file,name,description, fee);
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };
        servicesCollection.insertOne({ name, description, fee, image })
            .then(result => {
                console.log(result);
                res.send(result)
            })
    })
    //show service in UI
    app.get('/showService', (req, res) => {
        servicesCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })
    //show a single product
    app.get('/service/:id', (req, res) => {
        servicesCollection.find({ _id: ObjectId(req.params.id) })
            .toArray((err, documents) => {
                res.send(documents[0])
            })
    })
    //booking a service
    app.post('/booking', (req, res) => {
        const booked = req.body;
        BookingsCollection.insertOne(booked)
            .then(result => {
                console.log(result);
                res.send(result.insertedCount > 0)
            })
    })

    //make a admin
    app.post('/makeAdmin', (req, res) => {
        const email = req.body;
        MakeAdminCollection.insertOne(email)
            .then(result => {
                console.log(result);
                res.send(result.insertedCount > 0)
            })
    })
    //order by email
    app.post('/bookingsByEmail', (req, res) => {
        const email = req.body.email;
        console.log(email);
        MakeAdminCollection.find({email: email})
        .toArray((err, admins) => {
            if(admins.length === 0) {
                BookingsCollection.find({'shipment.email': email})
                .toArray((err, documents) => {
                    console.log("users",documents);
                    res.send(documents)
                })
            }
            else{
                BookingsCollection.find({})
                .toArray((err, documents) => {
                    console.log("admin",documents);
                    res.send(documents)
                })
            }
        })
    })
    //review

    app.post('/addReview', (req, res) => {
        const review = req.body;
        reviewCollection.insertOne(review)
        .then(result => {
            res.send(result.insertedCount > 0)
        })
    })
    //show review
    app.get('/showReview', (req, res) => {
        reviewCollection.find({})
        .toArray((err, documents) => {
            res.send(documents)
        })
    })

    //check admin
    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        MakeAdminCollection.find({email: email})
        .toArray((err, admin) => {
            res.send(admin.length > 0)
        })
    })
    //service delete
    app.delete('/delete/:id', (req, res) => {
        servicesCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then((result) => {
                res.send(result.deletedCount > 0);
            })
    })
    //update status
    app.patch('/update/:id',(req, res) => {
        BookingsCollection.updateOne({_id: ObjectId(req.params.id)},
        {
            $set: {
                status: req.body.status,
            }
        })
        .then(result => {
            res.send(result.modifiedCount> 0);
        })
    })

    console.log('database connected');
    console.log(err)
});


app.get('/', (req, res) => {
    res.send('hello world')
})

app.listen(process.env.PORT || 4000);