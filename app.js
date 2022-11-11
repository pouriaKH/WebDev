const express = require('express');
const session = require('express-session');
const hbs = require('express-handlebars');
const mongoose = require('mongoose');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const fs = require('fs');
const formidable = require('formidable')
const app = express();

//schema loading
const User = require('./mongoose-schema/userdata-schema');



mongoose.connect("mongodb://127.0.0.1:27017", {
	useNewUrlParser: true,
	useUnifiedTopology: true
}, (err) => {
	if (err) console.log("encountered an err on connecting mongodb database");
	else {
		console.log("connected mongodb database");
	}
});

if (!fs.existsSync("./views/Assets") == true) {
	console.log("it seems like Assets dose not exist ... recreating");

	fs.mkdir("views/Assets", err => {
		if (err) {
			console.log(err);
		}
	})
}
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
// if this var is set to 1 The Isloggedin and Isloggedout is disable
const isDevMode = 0;
/**************/

function isAdmin(req, res) {
	if (req.user.isAdmin == "true") res.redirect('/admin')
	else res.render("home.hbs", { username: req.user.name });
}
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated() && isDevMode == 0) return next();
	if (isDevMode == 0) {
		res.redirect('/');
	}
	else if (isDevMode == 1) {
		next();
	}
}

function isLoggedOut(req, res, next) {
	if (!req.isAuthenticated() && isDevMode == 0) return next();
	if (isDevMode == 0) {
		res.redirect('/');
	}
	else if (isDevMode == 1) {
		next();
	}
}
var GolobalUserAmount;
async function countUserAmount() {
	GolobalUserAmount = await User.countDocuments();
	console.log(`There are "${GolobalUserAmount}" Users in the database`);
}
countUserAmount();
// ROUTES
app.get('/', (req, res) => {
	const respond = {
		IsNotLoggedIn: !req.isAuthenticated(),
	}
	res.render('index.hbs', respond)
});
app.get('/home', isLoggedIn, (req, res) => {
	if (req.user.isAdmin == "true") res.redirect('/admin')
	else res.render("home.hbs", { username: req.user.name });
});
app.get('/Settings', isLoggedIn, (req, res) => {
	const errormsg = req.flash('user');
	res.render('setthing.hbs', { errormsg })
})
//working on here 
app.post('/Settings', isLoggedIn, async (req, res, next) => {
	if (req.body.usernameInput == req.user.name) {
		req.flash('user', "you must change you user name ");
		res.redirect('/Settings');
	} else {
		User.exists({ name: req.body.usernameInput }, (err, doc) => {
			if (doc == true) {
				req.flash('user', `${req.body.usernameInput} username is used already `);
				res.redirect('/Settings');
			}
			if (err) {
				console.error("an error happened")
				throw err;
			}
			else if (doc == false) { //working progress

			}

		})
	}
})
app.get('/FindUser', (req, res) => {
	if (req.user.isAdmin == "false") res.redirect('/');
	const errormsg = req.flash('user');
	res.render('FindUser.hbs', { errormsg })
})
app.post('/FindUser', (req, res) => {
	var x = req.body.Selction;
	var z = req.body.input;
	if (x == "email") {
		if (!z.includes("@")) {
			req.flash('user', "email must include @");
			res.redirect('/FindUser')
		} else {
			User.findOne({ email: z }, (err, user) => {
				if (err) throw err;
				if (!user) {
					req.flash('user', "user email dosr not exist");
					res.redirect('/FindUser')
				}
				else {
					app.get(`/FindUser/${user.name}`, (req, res, next) => {
						const response = {
							email: user.email,
							username: user.name,
							password: user.password,
							isAdmin: user.isAdmin,
						}
						res.render("Userdata.hbs", response);
					})
					res.redirect(`/FindUser/${user.name}`)

				}

			})

		}
	} else if (x == "username") {
		if (z.includes("@")) {
			req.flash('user', "Username must not include @");
			res.redirect('/FindUser')
		} else {
			User.findOne({ name: z }, (err, user) => {
				if (err) {
					throw err;
				}
				if (!user) {
					req.flash('user', "User dose not exist");
					res.redirect('/FindUser')

				}
				else {
					app.get(`/FindUser/${user.name}`, isAdmin, (req, res, next) => {
						const response = {
							email: user.email,
							username: user.name,
							password: user.password,
							isAdmin: user.isAdmin,
						}
						res.render("Userdata.hbs", response)
					})
					res.redirect(`/FindUser/${user.name}`)

				}

			})
		}
	}
})
app.get('/login', isLoggedOut, (req, res) => {
	const response = {
		title: "Login",
		error: req.query.error
	}

	res.render('login', response);
});
app.get('/admin', isLoggedIn, function (req, res) {
	const response = {
		ProfilePath: 'C:/Users/Pouria/Desktop/Projects/Html/WebDev/Assets/Him.png',
		GUA: GolobalUserAmount,
	}
	res.render('admin.hbs', response);
	console.log(response)
});
app.get('/delall', (req, res, next) => {
	User.deleteMany
	next()
})

app.post('/login', passport.authenticate('local', {
	successRedirect: '/home',
	failureRedirect: '/login?error=true'
}));

app.get('/logout', isLoggedIn, (req, res, next) => {
	req.logout(function (err) {
		if (err) return next(err)
	});

	res.redirect('/');
});
app.get('/register', isLoggedOut, (req, res) => {
	const errormsg = req.flash('user');
	res.render('singup.hbs', { errormsg });
})

app.post('/register', isLoggedOut, async (req, res) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10)
		//User.count
		const item = {
			UserId: GolobalUserAmount,
			name: req.body.name,
			email: req.body.email,
			password: hashedPassword,
			isAdmin: "false",
		}
		//console.log(item)
		User.exists({ name: req.body.name }, (err, user) => {
			if (err) return;
			else if (user == true) {
				req.flash('user', "username in use");
				res.redirect('/register');
			}
			else if (user == false) {
				User.exists({ email: req.body.email }, (err, doc) => {
					if (err) return;
					else if (doc == true) {
						req.flash('user', "email in use");
						res.redirect('/register');
					}
					else if (doc == false) {
						var Data = new User(item);
						Data.save();
						GolobalUserAmount = User.countDocuments();
						res.redirect('/login');
					}
				})
			}
		})
	}
	catch {
		res.redirect('/register');

	}
})


app.listen(3000, () => {
	console.log("Listening on port 3000");
});