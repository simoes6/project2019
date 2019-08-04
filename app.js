var express = require("express"); 
var app = express();
// *********** Never write anything above the express call line ****************
var mysql = require('mysql');
var flash = require('connect-flash');
//Passport
var passport = require('passport');


var LocalStrategy = require('passport-local').Strategy;
var localStorage = require('node-localstorage')
var session  = require('express-session');
var cookieParser = require('cookie-parser');

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
  host: 'den1.mysql5.gear.host',
  user: 'matwebapp',
  password: 'Lr05UI~Yu~r4',
  database: 'matwebapp'

 
    
});


db.connect((err) => {
     if(err){
    console.log("The Connection Failed ....... Blame Liam");
    }
    else {
        console.log("Yes the connection is great");
    }
 });


//create a table called users with autoincrement id usersame and password fields as a minimum
app.get('/createusers', function(req, res){
let sql = 'CREATE TABLE users (Id int NOT NULL AUTO_INCREMENT PRIMARY KEY, username varchar(255), email varchar(255), password varchar(255));'
let query = db.query(sql, (err,res) => {
 if(err) throw err;
});
    
res.send("SQL Worked");
});



var bcrypt = require('bcrypt-nodejs');

app.use(cookieParser()); // read cookies (needed for auth)




// required for passport
app.use(session({
	secret: 'secretdatakeythatyoucanchange',
	resave: true,
	saveUninitialized: true
 } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session





//routes ===
//Make a route to render the file

app.get('/register', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('register');
	});

// process the signup form
		app.post('/register', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/register', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
	
	

	   // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.Id); // Very important to ensure the case if the Id from your database table is the same as it is here
    });

    // used to deserialize the 
    passport.deserializeUser(function(Id, done) {    // LOCAL SIGNUP ============================================================

       db.query("SELECT * FROM users WHERE Id = ? ",[Id], function(err, rows){
            done(err, rows[0]);
        });
    });

    // =========================================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

  passport.use(
        'local-signup',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            db.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows) {
                if (err)
                    return done(err);
                if (rows.length) {
                    return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                } else {
                    // if there is no user with that username
                    // create the user
                    var newUserMysql = {
                        username: username,
                        email: req.body.email,
                        password: bcrypt.hashSync(password, null, null)  // use the generateHash function in our user model
                    };

                    var insertQuery = "INSERT INTO users ( username, email, password ) values (?,?,?)";

                    db.query(insertQuery,[newUserMysql.username, newUserMysql.email, newUserMysql.password],function(err, rows) {
                        newUserMysql.Id = rows.insertId;

                        return done(null, newUserMysql);
                    });
                }
            });
        })
    );


//get request for the profile page 
app.get('/profile', function(req, res) {
		res.render('profile', {
			user : req.user // get the user out of session and pass to template
		});
	});


//Create a route to log out 
app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});



//log in route
app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});0


//post request for login

// process the login form
	app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
		}),
        function(req, res) {
            console.log("hello");

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }
        res.redirect('/');
    });

   // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-login',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) { // callback with email and password from our form
            db.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows){
                if (err)
                    return done(err);
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                }

                // if the user is found but the password is wrong
                if (!bcrypt.compareSync(password, rows[0].password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                // all is well, return successful user
                return done(null, rows[0]);
            });
        })
    );
//};


//restrict access
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}



//Paypal function
var request = require('request');
var CLIENT =
  'AUJoKVGO3q1WA1tGgAKRdY6qx0qQNIQ6vl6D3k7y64T4qh5WozIQ7V3dl3iusw5BwXYg_T5FzLCRguP8';
var SECRET =
  'EOw8LNwDhM7esrQ3nHfzKc7xiWnJc83Eawln4YLfUgivfx1LGzu9Mj0F5wlarilXDqdK9Q5aHVo-VGjJ';
var PAYPAL_API = 'https://api.sandbox.paypal.com';
express()
  // Set up the payment:
  // 1. Set up a URL to handle requests from the PayPal button
  .post('/my-api/create-payment/', function(req, res)
  {
    // 2. Call /v1/payments/payment to set up the payment
    request.post(PAYPAL_API + '/v1/payments/payment',
    {
      auth:
      {
        user: CLIENT,
        pass: SECRET
      },
      body:
      {
        intent: 'sale',
        payer:
        {
          payment_method: 'paypal'
        },
        transactions: [
        {
          amount:
          {
            total: '5.99',
            currency: 'USD'
          }
        }],
        redirect_urls:
        {
          return_url: 'https://example.com',
          cancel_url: 'https://example.com'
        }
      },
      json: true
    }, function(err, response)
    {
      if (err)
      {
        console.error(err);
        return res.sendStatus(500);
      }
      // 3. Return the payment ID to the client
      res.json(
      {
        id: response.body.id
      });
    });
  })
  // Execute the payment:
  // 1. Set up a URL to handle requests from the PayPal button.
  .post('/my-api/execute-payment/', function(req, res)
  {
    // 2. Get the payment ID and the payer ID from the request body.
    var paymentID = req.body.paymentID;
    var payerID = req.body.payerID;
    // 3. Call /v1/payments/payment/PAY-XXX/execute to finalize the payment.
    request.post(PAYPAL_API + '/v1/payments/payment/' + paymentID +
      '/execute',
      {
        auth:
        {
          user: CLIENT,
          pass: SECRET
        },
        body:
        {
          payer_id: payerID,
          transactions: [
          {
            amount:
            {
              total: '10.99',
              currency: 'USD'
            }
          }]
        },
        json: true
      },
      function(err, response)
      {
        if (err)
        {
          console.error(err);
          return res.sendStatus(500);
        }
        // 4. Return a success response to the client
        res.json(
        {
          status: 'success'
   });
      });
  });
//Ends here




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
    
    // Route to show all products from database 

    
   // res.send("Product Created");
    
    
});
app.get('/users', isLoggedIn, function(req, res){
    
    let sql = 'SELECT * FROM users';
    let query = db.query(sql, (err,res1) => {
        
        if(err) throw err;
        
        res.render('users', {res1})
        
    });
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

// post request url to search database and use an existing page (products) to display results

app.post('/search', function(req, res){
    
    
    
    let sql = 'SELECT * FROM matmc WHERE Name LIKE  "%'+req.body.search+'%"  OR Activity LIKE  "%'+req.body.search+'%"    ';
    let query = db.query(sql, (err,res1) => {
        
        if(err) throw err;
        
        res.render('showallproducts', {res1})
        
    });
    
   // res.send("Product Created");
    
    
});


//STOPS HERE








// Now we set up a way for our application to run whe we need it to

// ********************* NEVER WRITE BELOW THIS LINE .... EVER  ...... EVER  *************

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
    
  console.log("Well Done! Your first app is now live!")  
    
    
});
