/* Setting things up. */
const path = require('path'),
express = require('express'),
app = express(),   
http = require('http').Server(app),
io = require('socket.io')(http),
mongoose = require('mongoose'),
multer  = require('multer'), //use multer to upload blob data
upload = multer(),
fs = require('fs'),
winston = require('winston'),
logger = new winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({filename: 'combined.log'})
  ]
}),
uploadPath = '/uploads/'
savePath = __dirname + '/public/uploads/',
db_path = 'mongodb://testUser:tu123123@ds127624.mlab.com:27624/messagesdb';
mongoose.connect(db_path, {useNewUrlParser: true}, (err) => {
	logger.log('info', 'mongo working');
});
var Message = mongoose.model('Message',{ name : String, message : String});
var Subscription = mongoose.model('Subscription',{ journey_id : String, trip_id : String, is_active: Boolean, time: Number });
var Recording = mongoose.model('Recording', {journey_id: String, time: Number});
app.use(express.static('public'));
var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))
const port = process.env.PORT || 3000;



app.all('/', function(req, res){
	res.send("this's the main page hi!");
});
io.on('connection', () =>{
 logger.log('info','a user is connected');
});
app.get('/messages', (req, res) => {
  Message.find({},(err, messages)=> {
    res.send(messages);
  });
});

app.post('/subscribe/', (req, res) => {
	/*add user to subscribers to this ride*/
	Subscription.find({journey_id: req.body.journey_id, trip_id: req.body.trip_id, is_active: true}, (err, docLis)=>{
		if(docLis.length == 1){
			/*already subscribed user do nothing*/
			res.status(200).send('user already subscribed');
		} else if (docLis.length > 1){
			/*same user subscribed more than once, error*/
			error = 'same user subscribed twice: ' + docLis[0].journey_id +' ' +docLis[0].trip_id;
			logger.error( error);
			res.status(500).send(error);
		}else{
			var newSub = new Subscription({journey_id: req.body.journey_id, trip_id: req.body.trip_id, is_active: true, time: new Date().getTime()});
			newSub.save((err) => {
				if(err){
					logger.error(err);
					res.status(500).send(JSON.stringify(err));
				}else{
					logger.log('info', 'subscription made: ' + req.body.journey_id +' ' +req.body.trip_id);	
					res.sendStatus(200);
				}
				
			});
		}
	});
});
function getFilePath(journey_id, saveDate){
	return journey_id + '_' + saveDate + '.wav';
}

function updateChildren(jid){
	//console.log(jid);
	io.emit(jid);
}

app.post('/upload/:journey_id', upload.single('soundBlob'), function(req, res, next){
	let saveDate = new Date().getTime();
	let fileName = getFilePath(req.params.journey_id, saveDate);
  let uploadLocation = savePath + fileName;
	fs.writeFileSync(uploadLocation, Buffer.from(new Uint8Array(req.file.buffer))); // write the blob to the server as a file
  let recordEntry = new Recording({journey_id: req.params.journey_id, time: saveDate});
  recordEntry.save((err)=>{
  	if(err){
  		logger.error(err);
  		res.sendStatus(500);//internal server error
  	}else{
  		res.status(200).send(fileName); //send back that everything went ok	
  		updateChildren(req.params.journey_id);
  	}
  });
  
});


app.get('/getRecords/', (req, res) => {
	Subscription.find({journey_id: req.query.journey_id, trip_id: req.query.trip_id, is_active: true}, (err, docList) => {
		if(err){
			res.status(500).send('something went wrong' + err);
			logger.error( err);
		}else if(docList.length != 1){
			res.status(500).send('subscription not found or inactive');
		}
		/* if user subscribed */
		else if(docList.length == 1){

			let lastTime = docList[0].time;
			if(req.query.lastTime && req.query.lastTime > lastTime){
				lastTime = req.query.lastTime;
			}
			Recording.find({journey_id: req.query.journey_id, time: {$gt: lastTime}}, (err2, docList2)=>{
				var newList = JSON.parse(JSON.stringify(docList2));
				for(var i = 0; i < newList.length ; i++){
					newList[i].path = uploadPath + getFilePath(docList2[i].journey_id, docList2[i].time);
					newList[i].time = docList2[i].time;
				}
				// console.log(newList);
				res.status(200).send(newList);
			})
		}
	});
});

app.post('/finishTrip', (req, res) => {
	if(req.body.trip_id && req.body.journey_id){
		Subscription.updateOne({journey_id: req.body.journey_id, trip_id: req.body.trip_id, is_active: true},
			{is_active: false},
			(err, ret)=>{
				// console.log(ret);
				if(err){
					res.status(500).send(err);
				}else if (ret.nModified == 0){
					res.status(500).send('no matching active Subscriptions were found');
				}else if(ret.nModified == 1){
					res.status(200).send('finished successfully');
				}else{
					/*status code must be updated to represent this error*/
					res.status(200).send('multiple active Subscriptions found');
				}
			});
	}
});

//app.listen(port, () => console.log(`Example app listening on port http://localhost:${port}!`))
http.listen( port, () => {
	var message = `server is running on http://localhost:${port}`;
  logger.log('info',message);
  console.log(message);
});