var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var auth = require('./routes/auth');
var routes = require('./routes/index');


//passport

var passport = require('passport');
var SpotifyStrategy = require('passport-spotify').Strategy;


//db

var models = require('./models/models');
var User = models.User;

var app = express();

//io stuff
var server = require('http').Server(app);
var io = require('socket.io')(server);
var socketPath = require('./routes/socketPath');
socketPath(io);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//ADDED JULY 13TH TO LOAD FILES EXTERNALLY
app.use('/static', express.static(path.join(__dirname, 'public')));

//passport stuff

var session=require('express-session');
app.use(session({ secret: 'auxen production' })); //changed key.

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new SpotifyStrategy({
    clientID: process.env.SPOTIFY_ID,
    clientSecret: process.env.SPOTIFY_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, cb) {
    var photo = profile.photos[0] ? profile.photos[0] : "/static/images/anonymous.jpeg";
    var username = profile.displayName ? profile.displayName : "Anonymous";
    User.findOrCreate({ spotifyId: profile.id }, {refreshToken:refreshToken, imageURL: photo, username: username }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', auth(passport)); //passed passport here
app.use('/', routes(io));



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


var port = process.env.PORT || 3000;
server.listen(port);
