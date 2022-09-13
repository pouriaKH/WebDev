const express			= require('express');
const session			= require('express-session');
const hbs				= require('express-handlebars');
const mongoose			= require('mongoose');
const passport			= require('passport');
const localStrategy		= require('passport-local').Strategy;
const bcrypt			= require('bcrypt');
const flash 			= require('connect-flash');
const app				= express();

	mongoose.connect("mongodb://127.0.0.1:27017", {
		useNewUrlParser: true,
		useUnifiedTopology: true
	}, (err) => {
		if (err) console.log("encountered an err on connecting mongodb database");
		else {
			console.log("connected mongodb database")
		}
	});


const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	email : {
		type : String ,
		require : true
	},
	isAdmin : {
		type : String,
		require: true
	}
});

const User = mongoose.model('User', UserSchema);


// Middleware
app.engine('hbs', hbs({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));
app.use(session({
	secret: "SECRET",
	resave: false,
	saveUninitialized: true
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(flash());
// Passport.js
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

passport.use(new localStrategy(function (name, password, done) {
	User.findOne({ name: name }, function (err, user) {
		if (err) return done(err);
		if (!user) return done(null, false, { message: 'Incorrect name.' });

		bcrypt.compare(password, user.password, function (err, res) {
			if (err) return done(err);
			if (res === false) return done(null, false, { message: 'Incorrect password.' });
			
			return done(null, user);
		});
	});
}));
/***************/
// if this var is set to 1 The Isloggin and Isloggedout is disable
const isDevMode = 1 ; 
/**************/

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated() && isDevMode == 0) return next();
	if (isDevMode == 0){
		res.redirect('/login');

	}
	else if (isDevMode == 1){
		next();
	}
}

function isLoggedOut(req, res, next) {
	if (!req.isAuthenticated() && isDevMode == 0 ) return next();
	if (isDevMode == 0){
		res.redirect('/');

	}
	else if (isDevMode == 1){
		next();
	}
}
function isHere () {
	console.log("here");
}

// ROUTES
app.get('/', isLoggedIn, (req, res) => {
	if (req.user.isAdmin == "True") {
		res.redirect('/admin')
	}else {
	res.render("index", { title: "Home", username: req.user.name });
	}
});
app.get('/Settings', isLoggedIn, (req, res) => {
	const  errormsg = req.flash('user');
	res.render('setthing.hbs', { errormsg } )
})
//working on here 
app.post('/Settings', isLoggedIn , async  ( req , res, next ) => {
	if(req.body.usernameInput == req.user.name){
		req.flash('user', "you must change you user name ");
		res.redirect('/Settings');

	} else { User.exists({name : req.body.usernameInput}, (err , doc)  => {
		if (doc == true) {
			req.flash('user', `${req.body.usernameInput} username is used already `);
			res.redirect('/Settings');
		} 
		if (err) {
			console.error("an error happened")
			throw err;
		}
		else if (doc == false) {
			console.log("asdasasjdh")
		}
		
	})	
}})


app.get('/login', isLoggedOut, (req, res) => {
	const response = {
		title: "Login",
		error: req.query.error
	}

	res.render('login', response);
});
app.get('/admin', isLoggedIn,  function (req, res) {
	res.render('admin.hbs');
});
/******************/
//Working here
app.post('/admin', isLoggedIn, (req, res) => {

});
app.post('/login', passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/login?error=true'
}));

app.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});
app.get('/register', isLoggedOut, (req, res) => {
	const  errormsg = req.flash('Err');
	res.render('singup.hbs' , { errormsg });
})
app.post('/register', isLoggedOut, async (req, res) => {
	User.exists({email : req.body.email}, function(err, doc)  {
		if (err) {
			console.error(err)
		} else if (doc == true) {
			req.flash('user', "email already in use");
			res.redirect('/register');
		}
	})
	try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const item = {
      name : req.body.name,
      email: req.body.email,
      password: hashedPassword,
	  isAdmin : req.body.isAdmin,
	}
	User.exists({name : req.body.name}, function (err, doc) { // id user already exists
		if (err) {
			console.error(err);
		}
		if (doc == true) {
			req.flash('user', "Username already in use")
			res.redirect('/register')
		} else if (doc == false ) {
			
				var data = new User(item);
				data.save()
				isHere();
				req.flash('Err', "Account Created")
				res.redirect('/login')
				
			
			
		}	
	
	});
  } catch {
    res.redirect('/register')
  }
})

app.listen(3000, () => {
	console.log("Listening on port 3000");
});