# Careem Uni-Directional Voice Notes 

Allow driver to send voice notes to all passengers.
## Getting Started

clone the repo to setup the application.
```
git clone https://github.com/romaad/VoiceNotes.git
```
### Prerequisites

Node.js installed.


follow this link: [install node js](https://nodejs.org/en/download/)

### Installing

change working directory to project root path and execute the following:

```
npm install
```

## Running

System is run by executing: 
```
npm start
```
## Deployment

deployed at [heroku](http://careem-test.herokuapp.com/).

## Using web pages to test functionality

Even though the program is made for APIs, web pages was created to ease the process of testing those APIs.

### /subscribe

- use this page to allow a passenger with trip_id to subscribe for a specific journey so he can get notes.
- if user is already subscribed, notes recorded after his subscription will appear in this page.
- if it's a new subscription, any new notes recorded after subscription will show up at real time.
- user can end subscription to simulate getting on board.

### /sound

- driver begins by entering their journey id
- pressing anywhere starts recording a note
- pressing anywhere stops note and sends it to server and notify subscribed users

### /driver

- driver can see (by pressing update) all of his recording and how many users received/played them.


## API end points skeleton

* **/upload/<id>:** uploads voice note corresponding to journey id set by <id>.
* **/getRecords/journey\_id=<journey\_id>\[&trip_id=<trip\_id>\]\[&lastTime=<lastTime>\]:** gets voice notes recorded after user subscription and after lastTime if set. If trip_id is not set, it returns all voice notes for this trip for driver, which include listeners and receivers.
* **/playrecord:** user should call this when he listens to a specific voice note so he is added to listeners.
* **/finishTrip** user should call this when he boards the bus.

## API documentation
### /upload
* Description: add voice note to journey.
* Query parameters:  id -> represents trip id for which user is uploading note.
* Body: body should contain wav file in blob form represented by 'soundBlob' key.
* Example used in ```driver.html```:
 ```javascript {.line-numbers}
    /*save*/
    /*add file with key 'soundBlob to formdata*/
    formdata.append('soundBlob', soundBlob,  'file.wav') ;
	var serverUrl = '/upload/5';
    //build a HTTP POST request
    var httpRequestOptions = {
      method: 'POST',
      body: formdata , // with our form data packaged above
      headers: new Headers({
        'enctype': 'multipart/form-data' // the enctype is important to work with multer on the server
      })
    };
    httpDo(
      serverUrl,
      httpRequestOptions,
      (successStatusCode)=>{ //if we were successful...
        alert("uploaded recording successfully: " + successStatusCode)
      },
      (error)=>{alert(JSON.stringify(error));}
    ) 
 ```
 uploads sound related to trip with id 5.
* Implementation: implemented by writing first writing uploaded file to data store with <id>\_<timestamp>.wav and writes this record entry to Recording document. 

### /getRecords
* Description: get voice notes for specific journey.
* Query parameters: `trip_id, journey_id, lastTime`. If `trip_id` is `null`, we assume it's user and we return all notes in addition to each note listeners and receivers. If `lastTime` is null, and it's a user we return all records made after subscription time stamp. If it's a driver we default it to 0.
* Example: one used in `voice_notes.js`
```js
/* info= {journey_id: 2, trip_id: 1, lastTime: 0}.*/
$.get('/getRecords',info, (data) => {
   	console.log(JSON.stringify(data));
   	/*add each note to message div*/
   	data.forEach(addNotes);
}).fail((err)=>{
   	alert(JSON.stringify(err));
})
```
* Implementation: implemented by find query to records with same `journey_id` and recorded after subscription time and lastTime parameter.

### /playrecord
* Description: mark a record as listened by some user.
* Query parameters: `journey_id`, `trip_id` and `time`, mark journey_id's record timestamped with `time` as listened by user of `trip_id` by adding `trip_id` to users list.
* Body: `{journey_id:<>, trip_id:<>, time:<>}`
* Example: one used in `subscribe.html`.
```js
$.post('/playrecord', {journey_id: info.journey_id, trip_id: info.trip_id, time:noteTime});
```
* Implementation: adds trip id to record users list.

### /finishTrip

* Description: end user's subscription for a journey's voice notes.
* Query parameters: `journey_id` and `trip_id`  end journey_id's subscription made by `trip_id`.
* Body: `{journey_id:<>, trip_id:<>}`
* Example: one used in `subscribe.html`.
```js
$.post('/finishTrip', {journey_id: info.journey_id, trip_id: info.trip_id});
```
* Implementation: marks subscription as inactive.

## Assumptions

* User can only hear notes recorded after their subscription.
* wav is used for sound records

## Decisions
* Using mongodb was to increase scalability and because it's seamless with node.
* This code uses on web server, however node can be used as a proxy (load balancer) to redirect requests to replicated web servers.
* This code uses local data store. However, remote data stores can be configuered easily with node fs, such as AWS.