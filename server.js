/* Setting things up. */
/*create express object*/
const express = require('express'),
/*initialize web server*/
app = express(),
/*path to use system path service*/
path = require('path')   
/*setup http server*/
http = require('http').Server(app),
/*initialize io socket for real-time notes updates*/
io = require('socket.io')(http),
/*use mongoose with mlab as a database*/
mongoose = require('mongoose'),
/*use multer for multi-part(files) in requests*/
multer  = require('multer'), //use multer to upload blob data
/*make instance of multer*/
upload = multer(),
/*use filesystem to save voice notes*/
fs = require('fs'),
/*use winston for logging*/
winston = require('winston'),
/*make logger instance*/
logger = new winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({ filename: 'combined.log', level: 'info' }),
    new winston.transports.File({filename: 'error.log', level: 'error'})
  ]
}),
/*path to which server should send to user when providing autio files*/
uploadPath = '/uploads/'
/*path to which we save files locally*/
savePath = path.join(process.cwd(), '/public/uploads/'),
/*mongodb path*/
db_path = 'mongodb://testUser:tu123123@ds127624.mlab.com:27624/messagesdb';
/*start mongoose client*/
mongoose.connect(db_path, {useNewUrlParser: true}, (err) => {
	logger.log('info', 'mongo working');
});
/*if save path wasn't created yet, create it*/
if (!fs.existsSync(savePath))
    fs.mkdirSync(savePath);
/*initialize mongoose subscription model*/
var Subscription = mongoose.model('Subscription',{ journey_id : String, trip_id : String, is_active: Boolean, time: Number });
/*initialize records model*/
var Recording = mongoose.model('Recording', {journey_id: String, time: Number, users: Array});
/*set public files to users*/
app.use(express.static('public'));
/*use body parser to get request information in req.body*/
var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))
/*if port is set by environment use it, else set to 3000*/
const port = process.env.PORT || 3000;


/*on root path, send subscription page*/
app.all('/', function(req, res){
	res.redirect('/subscribe.html');
});
/*when connecting a user, initialize a web socket*/
io.on('connection', () =>{
 logger.log('info','a user is connected');
});
/*
	subscribe API, user sends their journey and trip ids in body. This allows user to get records recorded after 
	this subscription by the specified journey id.
*/
app.post('/subscribe/', (req, res) => {
	/*find trip id in subscribers to this journey*/
	Subscription.find({journey_id: req.body.journey_id, trip_id: req.body.trip_id, is_active: true}, (err, docLis)=>{
		if(docLis.length == 1){
			/*already subscribed user do nothing*/
			res.status(409).send('user already subscribed');
		} else if (docLis.length > 1){
			/*same user subscribed more than once, error, this shouldn't happen*/
			error = 'same user subscribed more than once: ' + docLis[0].journey_id +' ' +docLis[0].trip_id;
			logger.error( error);
			/*send server error, this shouldn't happen*/
			res.status(500).send(error);
		}else{
			/*make a new subscription for this trip id and journey id*/
			var newSub = new Subscription({journey_id: req.body.journey_id,
			 trip_id: req.body.trip_id, is_active: true, time: new Date().getTime()});
			/*save this subscription to server*/
			newSub.save((err) => {
				if(err){
					logger.error(err);
					/*if save failed, send error*/
					res.status(500).send(JSON.stringify(err));
				}else{
					/*if save succeeded, send success code*/
					logger.log('info', 'subscription made: ' + req.body.journey_id +' ' +req.body.trip_id);	
					res.sendStatus(200);
				}
				
			});
		}
	});
});
/*convert record for a journey at specified time to a file name for record*/
function getFilePath(journey_id, saveDate){
	return journey_id + '_' + saveDate + '.wav';
}

/*alert children of a journey new record for this journey*/
function updateChildren(jid){
	//console.log(jid);
	io.emit(jid);
}
/*API post request for uploading a record for specified journey, sound file is sent as wav in request body 
represented by 'soundBlob' key*/
app.post('/upload/:journey_id', upload.single('soundBlob'), function(req, res, next){
	/*make a unique timestamp for the request*/
	let saveDate = new Date().getTime();
	/*generate file name*/
	let fileName = getFilePath(req.params.journey_id, saveDate);
  /*append file name to local path to make final path*/
  let uploadLocation = savePath + fileName;
  /*write file to disk*/
  /*this part can be exchanged with remote storage service, such as AWS*/
	fs.writeFileSync(uploadLocation, Buffer.from(new Uint8Array(req.file.buffer))); // write the blob to the server as a file
  /*make a db entry for this record*/
  let recordEntry = new Recording({journey_id: req.params.journey_id, time: saveDate, users: []});
  recordEntry.save((err)=>{
  	if(err){
  		logger.error(err);
  		res.status(500).send(err);//internal server error
  	}else{
  		res.status(200).send(fileName); //send back that everything went ok	
  		/*notify users of new record of this journey new record*/
  		updateChildren(req.params.journey_id);
  	}
  });
  
});


/*makes new list for records to return to user*/
function makeDocs(dbdocs){
	var newList = JSON.parse(JSON.stringify(dbdocs));
	for(var i = 0; i < newList.length ; i++){
		/*add path property to recrods for user to use*/
		newList[i].path = uploadPath + getFilePath(dbdocs[i].journey_id, dbdocs[i].time);
		newList[i].time = dbdocs[i].time;
	}
	return newList;
}
/*get records for driver to see views and passenger for trip*/
app.get('/getRecords/', (req, res) => {
	/*no trip id, driver*/
	if(!req.query.trip_id){
		let lastTime = 0;
		if(req.query.lastTime){
			lastTime = req.query.lastTime;
		}
		Recording.find({journey_id: req.query.journey_id, time: {$gt: lastTime}}, (err2, docs)=>{
			if(err2){
				res.status(500).send(err2);
			}else{
				res.status(200).send(makeDocs(docs));
			}
		});
	}else{
		/*get subscription for this user trip and journey*/
		Subscription.find({journey_id: req.query.journey_id, trip_id: req.query.trip_id, is_active: true}, (err, docList) => {
			if(err){
				res.status(500).send('something went wrong' + err);
				logger.error( err);
			}else if(docList.length != 1){
				/*if either subscription is found more than once or not found, send error*/
				res.status(500).send('subscription not found or inactive');
			}
			/* if user subscribed */
			else if(docList.length == 1){
				/*get the time of subscription*/
				let lastTime = docList[0].time;
				if(req.query.lastTime && req.query.lastTime > lastTime){
					lastTime = req.query.lastTime;
				}
				/*find recording for this journey recorded after the subscription issued*/
				Recording.find({journey_id: req.query.journey_id, time: {$gt: lastTime}}, (err2, docList2)=>{
					/*make new instance of recording list*/
					if(err2){
						res.status(500).send(err);
					}else{
						res.status(200).send(makeDocs(docList2));		
					}
					
				})
			}
		});	
	}
	
});

/*when user plays a record, they must call this function*/
app.post('/playrecord', (req, res) => {
	if(req.body.journey_id && req.body.time && req.body.trip_id){
		/*find the played recording*/
		Recording.findOne({journey_id: req.body.journey_id, time: req.body.time}, (err2, record)=>{
			if(err2){
				res.status(500).send(err);
			}else{
				if(!record.users.find((entry)=> entry === req.body.trip_id)){
					record.users.push(req.body.trip_id);
					record.save((err)=>{
						if(err){
							res.status(500).send(err);
						}else{
							res.status(200).send("OK");
						}
					})
						
				}else{
					/*user listened before*/
					res.status(409).send('user listened before');
				}
						
			}
			
		})
	}
});
/*finish user trip by setting their subscription to inactive*/
app.post('/finishTrip', (req, res) => {
	if(req.body.trip_id && req.body.journey_id){
		/*find subscription for user, and set it to inactive*/
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

/*start server by listening on specified port*/
http.listen( port, () => {
	var message = `server is running on http://localhost:${port}`;
  logger.log('info',message);
  console.log(message);
});