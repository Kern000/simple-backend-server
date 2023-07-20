const express = require('express');                     //framework to build backend layer that communicates with browser javascript

const cors = require('cors');                           //cors to allow multi-origin requests on this server
                                                        //use gitpod workspace, go to 'port' tab next to terminal, unlock to prevent CORS

const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;     //Mongo client to allow server connection w mongodb
const ObjectId = require('mongodb').ObjectId;           //use mongo specific id format _id: ObjectId(xxxx)

const dotenv = require('dotenv');                       

dotenv.config()                                         //allow loading of variable in .env file into process.env

const app = express();                                  //initialize new instance of express
app.use(express.json());                                //use json middleware to define content-type in header and to parse json
app.use(cors());

async function connect(){
    try {
        console.log("calling mongo db...");                 //sanity check and Andon

        const mongo_url = process.env.MONGO_URI             //in .env, MONGO_URI is stated as variable without js assignment, meaning it is just MONGO_URI=TheLoginURIfromMONGO+Password. Gitignore to add .env to prevent password from being uploaded. No spacing in .env file for MONGO_URI=xxx to support linux.
        const clientStarted = new MongoClient(mongo_url);          //connecting based on MONGO_URI
        let connectedDB = clientStarted.db("fake_recipes");       //be mindful not to clash variableName of db, putting db=client.db("fake_recipes") can lead to issues

        console.log("database connected");                  //confirmation of connection

        return connectedDB;
    } catch (error) {
        console.log('Error in connection: ', error);
    }
}

async function serverRouterStart(){
    let db=await connect();             
    
    app.get("/", (req,res) => {
        console.log("Get is working, use /endpointName")
        res.send("Get is working, use /endpointName")
    })

    app.get("/recipes", async(req,res)=>{
        console.log("recipe route called");
        let recipes=await db.collection("recipes").find().toArray();  // To array to return in [json-like] format
        res.json(recipes)
    })

    app.get('/recipes/:recipeId', async(req,res)=>{
        let recipe1= await db.collection('recipes').findOne({
            _id: new ObjectId(req.params.recipeId)
        });
        res.json(recipe1)
    })
    // here we are using MongoDB's objectId instance to put it in the format of the Id that MongoDb recognizes

    app.post('/recipes', async(req,res)=>{
        const {title, ingredients} = req.body;  //destructure base on the react form that ask user for title and ingredient in respective textbox

        if (!Array.isArray(ingredients) || !ingredients.every(ingredient => typeof ingredient === 'string')){
            return res.status(400).json({error: 'Ingredients must be an array of strings'})
        }

        let results = await db.collection('recipes').insertOne({title, ingredients});   //insert what we destructure from the req.body
        console.log(results)

        let newRecipeId = results.insertedId        //this is tricky because the object returned is the insertOne acknowledgment object which says true, and return the objectId
        let correctResult = await db.collection('recipes').find({
            _id:newRecipeId                 //which is ID acknowledged by the insertOne
        }).toArray()
        console.log(correctResult);
        res.json(correctResult);
    })
    //Array.isArray() is built in method for array. .every() iterates an array and check if typeof element === the needed type
    //front end addNew method will be async arrow function - with response = await axios.post(this.url + 'recipes', {"title": this.state.newTitle, "ingredients":this.state.newIngredient}) and add this last post to state from this.setState({'data': [...this.state.data, response.data[0]], 'active': 'listing'}) (refer to labs 10) - it is response.data[0] because of the pathing in the response.data

    app.put('/recipes/:id', async(req,res)=>{
        const {title,ingredients}=req.body;
        if(!Array.isArray('ingredients') || !ingredients.every(ingredient => typeof ingredient === 'string')){
            return res.status(400).json({error: 'Ingredients must be an array of string'})
        }
        let results= db.collection('recipes').updateOne({
            '_id': new ObjectId(req.params.id)
        },
        {
            '$set':{
                'title': title,
                'ingredients': ingredients
            }
        })
        res.json({
            'status':true
        })
    })
}

//updateOne will match _id: new ObjectId(req.params.id) first then it will set the title and ingredients to be the destructured title and ingredients from the axios.put() operation in front end
//$set operator is used in MongDB to perform update or speciic modifications on document
//every document in mongo are assigned a unique ObjectId("ada12132321")

serverRouterStart();

app.listen(process.env.PORT || 3000, () => {
    console.log("Server Started")
})

// single file simple express server without abstraction, so not putting entry point as index.js

