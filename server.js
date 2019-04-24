/* Setting things up. */
var path = require('path'),
express = require('express'),
app = express(),   
http = require('http').Server(app),
io = require('socket.io')(http),
mongoose = require('mongoose');
const db_path = 'mongodb://testUser:tu123123@ds127624.mlab.com:27624/messagesdb';
mongoose.connect(db_path, {useNewUrlParser: true}, (err) => {
	console.log('mongo working');
});
var Message = mongoose.model('Message',{ name : String, message : String});
app.use(express.static('public'));
var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))
const port = 3000;

app.all('/', function(req, res){
	res.send("this's the main page hi!");
});
io.on('connection', () =>{
 console.log('a user is connected')
});
app.get('/messages', (req, res) => {
  Message.find({},(err, messages)=> {
    res.send(messages);
  });
});

app.post('/messages', (req, res) => {
  var message = new Message(req.body);
  message.save((err) =>{
    if(err)
      sendStatus(500);
    io.emit('message', req.body);
    res.sendStatus(200);
  });
});

//app.listen(port, () => console.log(`Example app listening on port http://localhost:${port}!`))
http.listen( port, () => {
  console.log(`server is running on http://localhost:${port}`);
});