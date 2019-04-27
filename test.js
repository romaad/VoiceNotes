/*create 10 journeys*/
var journeys = Array.from(Array(10), (x, index) => {index + 1});
/*create 500 users*/
var trips = Array.from(Array(500), (x, index) => {index + 1});

const http = require('http');
const request = require('request');

var testFailed = false;
var req = request.post(url, function (err, resp, body){
	if(err){
		testFailed = true;
		console.log(err);
	}else{
		console.log('test ' + succeded + body);
	}
})

var form = req.form();
