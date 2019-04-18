var express = require("express"); 

var app = express();
// *********** Never write anything above the express call line ****************



var mysql = require('mysql');



app.set("view engine", "ejs");  // set default view engine
var fs = require('fs');
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));


var contact = require("./model/contact.json");
var product = require("./model/product.json");



app.use(express.static("views"));


app.use(express.static("script"));


app.use(express.static("images"));

// create connectivity to sql Database

// Sub these details for you own GEAR HOST database details


const db = mysql.createConnection ({


 
    
});


db.connect((err) => {
     if(err){
    console.log("The Connection Failed ....... Blame Liam");
    }
    else {
        console.log("Yes the connection is great");
    }
 });



app.get('/', function(req, res){ // this line will call a grt request on the / url of our application
  // Now we need the function to actually do something  
    //res.send("Hello January Class") // We will send a string response to the browser
    res.render("index")
   
    
    console.log("The Message was sent and you made an app")
    
});






                                                    // ######## SQL DATA Starts HERE


// create a route to create a database table

//app.get('/createtable', function(req, res){
    
 //   let sql = 'CREATE TABLE matmc (Id int NOT NULL AUTO_INCREMENT PRIMARY KEY, Name varchar(255), Price int, Image varchar(255), Activity varchar(255));'
    
 //   let query = db.query(sql, (err,res) => {
        
 //       if(err) throw err;
        
        
 //   });
    
//    res.send("SQL Worked");
    
    
//});



// Route to create a product by hardcode
app.get('/createproduct', function(req, res){
    let sql = 'INSERT INTO matmc (Name, Price, Image, Activity) VALUES ("Violin Student", 166, "violino.jpg", "Pay in-store when you collect.")'
     let query = db.query(sql, (err,res) => {
        if(err) throw err;
    });
    res.send("Product Created");
 
});


// Route to show all products from database 
app.get('/productssql', function(req, res){
    
    let sql = 'SELECT * FROM matmc';
    let query = db.query(sql, (err,res1) => {
        
        if(err) throw err;
        
        res.render('showallproducts', {res1})
        
    });
    
   // res.send("Product Created");
    
    
});

// route to render create product page
app.get('/createsql', function(req, res){
    res.render('createsql')
   
    
});

// route to post new product 

app.post('/createsql', function(req, res){
    let sql = 'INSERT INTO matmc (Name, Price, Image, Activity) VALUES ("'+req.body.name+'", '+req.body.price+', "'+req.body.image+'", "'+req.body.activity+'")'
     let query = db.query(sql, (err,res) => {
        if(err) throw err;
    });
    res.redirect("/productssql");
 
});


// route to edit sql data 

app.get('/edit/:id', function(req, res){
  
    let sql = 'SELECT * FROM matmc WHERE Id = "'+req.params.id+'" '
    let query = db.query(sql, (err, res1) => {
        if(err) throw err;
        console.log(res1);
        
        
        res.render('edit', {res1});
        
    });
    
});


// Post request URL to edit product with SQL

app.post('/editsql/:id', function(req, res){
    
       let sql = 'UPDATE matmc SET Name = "'+req.body.name+'", Price = '+req.body.price+', Image = "'+req.body.image+'", Activity = "'+req.body.activity+'" WHERE Id = "'+req.params.id+'"      '
       let query = db.query(sql, (err,res) => {
        if(err) throw err;
    });
    res.redirect("/productssql");
    
    
});


// route to delete sql product 

app.get('/deletesql/:id', function(req, res){
   
   let sql = 'DELETE FROM matmc WHERE Id = '+req.params.id+' ' 
   let query = db.query(sql, (err, res ) => {
       if(err) throw err;
  
       
   });
   res.redirect("/productssql");
    
    
});


// route to show individual page 

app.get('/show/:id', function(req, res){
    
    let sql = 'SELECT * FROM matmc WHERE Id = '+req.params.id+'';
    let query = db.query(sql, (err,res1) => {
        
        if(err) throw err;
        
        res.render('show', {res1})
        
    });
    
   // res.send("Product Created");
    
    
});



                                                    // ######## SQL DATA ENDS HERE






                                                   // ### JSON DATA STARTS HERE











// route to get comments page

app.get('/contacts', function(req, res){
      res.render("contacts", {contact})
     console.log("You are on the way to the contacts page")
    
  
});


app.get('/products', function(req, res){
      res.render("products", {product})
     console.log("You are on the way to the contacts page")
    
  
}); 


app.get('/add', function(req, res){
      res.render("add")
     console.log("Welcome to leave comment page")
    
  
}); 


app.post('/add', function(req,res){
  
  function getMax(contacts, id) {
    var max
    
    for (var i=0; i<contacts.length; i++) {
        if(!max || parseInt(contact[i][id]) > parseInt(max[id]))
        max = contacts[i];
    }
    console.log("The max id is " + max)
    return max;
    
    
  }
  
  var maxCid = getMax(contact, "id")
  
  var newId = maxCid.id + 1;
 
  console.log("New id is: " + newId);
  var json = JSON.stringify(contact)
  
  
  var contactsx = {
    
    name: req.body.name,
    Comment: req.body.comment,
    id: newId,
    email: req.body.email,
    
  }
  
  
  
  fs.readFile('./model/contact.json', 'utf8', function readfileCallback(err){
      if(err){
        throw(err)
      
      
      } else {
      
        contact.push(contactsx)
        json = JSON.stringify(contact, null, 4)
        fs.writeFile('./model/contact.json', json, 'utf8')
      }
    
  })
  
  res.redirect('/contacts')

}); 


app.get('/deletecontact/:id', function(req, res){

  
  var json = JSON.stringify(contact);
  
  var keyToFind = parseInt(req.params.id);
  
  
  var data = contact
  
  var index = data.map(function(contact){return contact.id;}).indexOf(keyToFind)
  
  
  contact.splice(index, 1);
  
  
          json = JSON.stringify(contact, null, 4) 
          fs.writeFile('./model/contact.json', json, 'utf8')

  
console.log("Ha Ha ....... its gone!")  
res.redirect('/contacts')

 
});





app.get('/editcontact/:id', function(req,res){
  
  function chooseContact(indOne){
      return indOne.id === parseInt(req.params.id)
  }
  
  var indOne = contact.filter(chooseContact)
   res.render('editcontact', {res:indOne});
   
   
    
});



app.post('/editcontact/:id', function(req,res){
  
  var json = JSON.stringify(contact);
    
  var keyToFind = parseInt(req.params.id);
  var data = contact
  var index = data.map(function(contact){return contact.id;}).indexOf(keyToFind)
  
  
  
    var y = req.body.comment;
    var z = parseInt(req.params.id)
    
    contact.splice(index, 1, {
      
      name: req.body.name, 
      Comment: y,
      id: z,
      email: req.body.email
      
    });
    
    json = JSON.stringify(contact, null, 4);
    fs.writeFile("./model/contact.json", json, 'utf8' );
   
  
    
  res.redirect("/contacts");

});


// EDIT PRODUCT


//STOPS HERE





// Now we set up a way for our application to run whe we need it to

// ********************* NEVER WRITE BELOW THIS LINE .... EVER  ...... EVER  *************

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
    
  console.log("Well Done! Your first app is now live!")  
    
    
});