var express = require('express');
var app = express();
var spawn = require('child_process').spawn;

var py = spawn('python', ['/home/pi/Public/mirror/rpi-arm-raspbian-8.0-1.2.0/test.py'],{
   stdio: ['pipe', 'pipe', 'ignore'],
   cwd: '/home/pi/Public/mirror/rpi-arm-raspbian-8.0-1.2.0'
});


const readline = require('readline');

const rl = readline.createInterface({
  input: py.stdout
});

rl.on('line', (input) => {
	console.log("here");
	console.log("this",input);
});


/*var output = "";

py.stdout.on('data', function(data){console.log(data)});*/



app.get('/', function(req,res){
  res.send("Hey whats up");
});

app.listen(3000, function(){
  console.log("Listening on port 3000");
});
