// set variables for environment
var express = require('express');
var app = express();
var path = require('path');
var port = 3000;

var passport          =     require('passport')
  , util              =     require('util')
  , FacebookStrategy  =     require('passport-facebook').Strategy
  , session           =     require('express-session')
  , cookieParser      =     require('cookie-parser')
  , bodyParser        =     require('body-parser')
  , config            =     require('./configuration/config')
  , mysql             =     require('mysql');

//Define MySQL parameter in Config.js file.
var connection = mysql.createConnection({
  host     : config.host,
  user     : config.username,
  password : config.password,
  database : config.database
  //user.username: 'afss';
});

//Connect to Database only if Config.js parameter is set.

if(config.use_database==='true')
{
    connection.connect();
}

// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the FacebookStrategy within Passport.

passport.use(new FacebookStrategy({
    clientID: '1686077144956958',
    clientSecret: '6487ed9f07864fb432a6ac847598a742' ,
    callbackURL: 'http://localhost:' + port + '/auth/facebook/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      //Check whether the User exists or not using profile.id
      if(config.use_database==='true')
      {
      connection.query("SELECT * from user_info where user_id="+profile.id,function(err,rows,fields){
        if(err) throw err;
        if(rows.length===0)
          {
            console.log("There is no such user, adding now");
            connection.query("INSERT into user_info(user_id,user_name) VALUES('"+profile.id+"','"+profile.username+"')");
          }
          else
            {
              console.log("User already exists in database");
            }
          });
      }
      return done(null, profile);
    });
  }
));


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'keyboard cat', key: 'sid'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

app.get('/map', function(req, res){
  app.set('view engine', 'jade');
  res.render('index', { user: req.user })
});

app.get('/', function(req, res){
  app.set('view engine', 'ejs');
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  app.set('view engine', 'ejs');
  res.render('account', { user: req.user });
});

app.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));


app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect : '/', failureRedirect: '/login' }),
  function(req, res) {
  	app.set('view engine', 'ejs');
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  app.set('view engine', 'ejs');
  req.logout();
  res.redirect('/');
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

/*
// views as directory for all template files
app.set('views', path.join(__dirname, 'views'));
// use either jade or ejs
app.set('view engine', 'jade');

// instruct express to server up static assets
app.use(express.static('public'));

// set routes
app.get('/', function(req, res) {
  res.render('index');
});*/


// var publicConfig = {
//   key: 'AIzaSyD42cn8u5aAfqjgkMwWYYdTWtCRRaw8ZwY',
//   stagger_time:       1000, // for elevationPath
//   encode_polylines:   false,
//   secure:             true, // use https
//   proxy:              'http://127.0.0.1:9999' // optional, set a proxy for HTTP requests
// };

// var gmAPI = new GoogleMapsAPI(publicConfig);


// var params = {
//   center: '444 W Main St Lock Haven PA',
//   zoom: 15,
//   size: '500x400',
//   maptype: 'roadmap',
//   markers: [
//     {
//       location: '300 W Main St Lock Haven, PA',
//       label   : 'A',
//       color   : 'green',
//       shadow  : true
//     },
//     {
//       location: '444 W Main St Lock Haven, PA',
//       icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=cafe%7C996600'
//     }
//   ],
//   style: [
//     {
//       feature: 'road',
//       element: 'all',
//       rules: {
//         hue: '0x00ff00'
//       }
//     }
//   ],
//   path: [
//     {
//       color: '0x0000ff',
//       weight: '5',
//       points: [
//         '41.139817,-77.454439',
//         '41.138621,-77.451596'
//       ]
//     }
//   ]
// };
// gmAPI.staticMap(params); // return static map URL
// gmAPI.staticMap(params, function(err, binaryImage) {
//   // fetch asynchronously the binary image
// });


// // Displays server log in the CLI
// app.use(express.logger());

// var google = require('node-google-api')({
//     apiKey: 'AIzaSyBdwq1SQMg3lT1ESWLFt5CRik12NKM6v3I',
//     debugMode: true // Throws errors instead of passing them silently.
// });

/*
// views as directory for all template files
app.set('views', path.join(__dirname, 'views'));
// use either jade or ejs
app.set('view engine', 'jade');

// instruct express to server up static assets
app.use(express.static('public'));

// google.build(function(api) {
//   api.calendar.events.list({
//     calendarid: 'en.usa#holiday@group.v.calendar.google.com'
//   }, function(result) {
//     if(result.error){
//       console.log(result.error);
//     } else {
//       for(var i in result.items) {
//         console.log(result.items[i].summary);
//       }
//     }
//   });
// });

// set routes
app.get('/', function(req, res) {
  res.render('index');
});
*/
// Set server port
app.listen(process.env.PORT||port);
console.log("Server is running at => http://localhost:" + port + "/\nCTRL + C to shutdown");
