const express = require("express");
const cors = require("cors");
require("dotenv").config();

const admin = require("firebase-admin");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// serviceAccount
const serviceAccount = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
};

// Intialize the firebase-admin project/account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// mongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nkt12.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// custom client code for connecting to DB
const client = new MongoClient(uri, {
  tls: true,
  serverSelectionTimeoutMS: 3000,
  autoSelectFamily: false,
});
// custom client code for connecting to DB

async function run() {
  try {
    const gadgetsCollection = client.db("gadgetDB").collection("gadgets");
    const categoryCollection = client.db("gadgetDB").collection("categories");

    // gadgets add to server
    app.get("/category", async (req, res) => {
      const cursor = categoryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // gadgets add to server

    // add new category to server
    app.post("/category", async (req, res) => {
      const newCategory = req.body;
      const result = await categoryCollection.insertOne(newCategory);
      res.send(result);
    });
    app.get("/category/:category", async (req, res) => {});
    // add new category to server

    // gadgets add to server
    app.get("/gadgets", async (req, res) => {
      const cursor = gadgetsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // gadgets add to server

    // add a new gadget // post gadget
    app.post("/gadgets", async (req, res) => {
      const newGadget = req.body;
      const result = await gadgetsCollection.insertOne(newGadget);
      res.send(result);
    });
    // add a new gadget // post gadget

    // update gadget details
    app.get("/gadgets/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await gadgetsCollection.findOne(query);
      res.send(result);
    });

    app.put("/gadgets/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedGadgetInfo = req.body;
      const coffee = {
        $set: {
          name: updatedGadgetInfo.name,
          photo: updatedGadgetInfo.photo,
          category: updatedGadgetInfo.category,
          price: updatedGadgetInfo.price,
          description: updatedGadgetInfo.description,
          availability: updatedGadgetInfo.availability,
          rating: updatedGadgetInfo.rating,
          warranty: updatedGadgetInfo.warranty,
        },
      };
      const result = await gadgetsCollection.updateOne(filter, coffee, options);
      res.send(result);
    });
    // update gadget details

    // gadget delete
    app.delete("/gadgets/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await gadgetsCollection.deleteOne(query);
      console.log(result);
      res.send(result);
    });
    // gadget delete

    // Post user in firebase
    app.post("/auth", async (req, res) => {
      try {
        const user = req.body;

        const result = await admin.auth().createUser({
          email: user.email,
          password: user.password,
          displayName: user.displayName,
        });

        res.send(result);
      } catch (error) {
        res.send({
          message: error?.message,
        });
      }
    });

    app.delete("/delete/:uid", async (req, res) => {
      try {
        const uid = req.params.uid;
        await admin.auth().deleteUser(uid);
        res.send({
          message: "Deleted Successfully",
        });
      } catch (error) {
        res.send({
          message: error?.message,
        });
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
// mongoDB

app.get("/", (req, res) => {
  res.send("Gadget-Heaven Server Is Running");
});
app.listen(port, () => {
  console.log(`Gadget-Heaven-Project Server Is Running On Port: ${port}`);
});
