var mongoose = require('mongoose');

var connect = process.env.MONGODB_URI;

mongoose.connect(connect);

var Schema = mongoose.Schema;

var userSchema = new Schema({
  username:String,
  password:String,
  spotifyId:String,
  refreshToken:String,
  imageURL: String
})

var roomSchema = new Schema({
  roomName:String,
  djRefreshToken:String,
  djSpotifyId:String,
  imageURL:String,
  usersInRoom: Array
})

userSchema.statics.findOrCreate = function(obj1,obj2,cb){
  User.findOne(obj1,function(err,user){
    console.log(err, user);
    if(err)console.log(err);
    else if(user){
      cb(err,user);
    }
    else{
        var newUser = new User({
        spotifyId: obj1.spotifyId,
        refreshToken: obj2.refreshToken,
        imageURL: obj2.imageURL,
        username: obj2.username
      })
      newUser.save(function(err, user){
        cb(err,user);
      })
    }
  })
}

var User = mongoose.model('User',userSchema);
var Room = mongoose.model('Room',roomSchema);

module.exports = {
  User: User,
  Room: Room
}
