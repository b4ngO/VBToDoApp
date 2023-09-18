import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";

import dotenv from 'dotenv'
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const fullTitleString = "Work List";

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});
console.log("Succesfully connected to the server.");

//Enable bodyParser
app.use(bodyParser.urlencoded({ extended: true }));

//Setting static files
app.use(express.static("public"));




//Item schema
const itemSchema = new mongoose.Schema({
    name: {
        type: String
    }
});

//List schema
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

//Initializing items
const Item = mongoose.model("TodayItem", itemSchema);
const List = mongoose.model("List", listSchema);

//Creating starting items
const item1 = new Item({
    name: "Welcome to your to do list!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

//Rendering "today" page
app.get("/", (req, res) => {
    /*
    const date = new Date();
    const nameOfDay = days[date.getDay()];
    const nameOfMonth = months[date.getMonth()];
    const numberOfDay = date.getDate();
    const fullDateString = nameOfDay + ", " + nameOfMonth + " " + numberOfDay;
    */

    Item.find({}).then(function(foundItems){
        
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems)
                .then(function(){
                console.log("Succesfully save to the database.")
                })
                res.redirect("/")
                .catch(function(err) {
                console.log(err)
                });
        } else {
            res.render("index.ejs", {
            titleString: "Today",
            newListItems: foundItems
            });
        }
      })
      .catch(function(err){
        console.log(err);
      });
});


//Custom lists
app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}).then(function(foundList) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save()
                    .then(function(){  
                    res.redirect("/"+customListName);      
                    });
                console.log("Saved list.");
             } else {
                res.render("index.ejs", {
                    titleString: foundList.name,
                    newListItems: foundList.items
                    });
             }
    })
    .catch(function(err){});
});


//Passing data
app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    })

    if (listName === "Today") {
       item.save()
       .then(function() {
        res.redirect("/");
       });
    } else {
        List.findOne({name: listName}).then(function(foundList) {
            foundList.items.push(item);
            foundList.save()
                .then(function() {
              res.redirect("/"+listName);  
            });
            
        })
    }
});

/*
//Rendering "work" page
app.get("/work", (req, res) => {
    Item.find({}).then(function(foundItems) {
    res.render("index.ejs", {
        titleString: fullTitleString,
        newListItems: foundItems,
        });    
    });
});
*/

//Deleting items
app.post("/delete", async function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId)
            .then(() => {
                console.log("Succesfully deleted data.");
                res.redirect("/");
            })
            .catch((err) => {
                console.log(err);
            })
    } else {
        List.findOneAndUpdate({name: listName},
                             {$pull: {items: {_id: checkedItemId}}})
            .then(function(foundList) {
                res.redirect("/"+listName);
            })
    }
    
});


//Console log port
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});


//Days
const days = [
    "Monday", 
    "Tuesday", 
    "Wednesday", 
    "Thursday", 
    "Friday", 
    "Saturday", 
    "Sunday",
];

//Months
const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

