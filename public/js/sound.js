var mic, recorder, soundFile;

var state = 0; // mousePress will increment from Record, to Stop, to Play

function setup() {
	var txt;
  getAudioContext().resume();
  person = prompt("Please enter your journey id:", "1");
  if (person == null || person == "") {
    txt = "User cancelled the prompt.";
    location.reload();//we must get journey id
  } else {
    txt = "Hello " + person + "! How are you today?";

  }
  createCanvas(400,400);
  background(200);
  fill(0);
  text('Enable mic and click the mouse to begin recording', 20, 20);

  // create an audio in
  mic = new p5.AudioIn();

  // users must manually enable their browser microphone for recording to work properly!
  mic.start();

  // create a sound recorder
  recorder = new p5.SoundRecorder();

  // connect the mic to the recorder
  recorder.setInput(mic);

  // create an empty sound file that we will use to playback the recording
  soundFile = new p5.SoundFile();
}

function mousePressed() {
	  getAudioContext().resume();

  // use the '.enabled' boolean to make sure user enabled the mic (otherwise we'd record silence)
  if (state === 0 && mic.enabled) {

    // Tell recorder to record to a p5.SoundFile which we will use for playback
    recorder.record(soundFile);

    background(255,0,0);
    text('Recording now! Click to stop.', 20, 20);
    state++;
  }

  else if (state === 1) {
    recorder.stop(); // stop recorder, and send the result to soundFile
		/*save*/
    /*get a blob out of sound file */
    let soundBlob = soundFile.getBlob();
    let formdata = new FormData() ; //create a from to of data to upload to the server
    /*person is from messaging.js*/
    formdata.append('soundBlob', soundBlob,  person + '.wav') ; // append the sound blob and the name of the file. third argument will show up on the server as req.file.originalname
		var serverUrl = '/upload/'+person; //we've made a POST endpoint on the server at /upload
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
    background(0,255,0);
    text('Recording stopped. Click to play & save', 20, 20);
    state++;
  }

  else if (state === 2) {

    soundFile.play(); // play the result!
  /*save it locally also*/
    saveSound(soundFile, 'mySound.wav'); // save file
    state = 0;
    background(200);
    text('Enable mic and click the mouse to begin recording', 20, 20);
  }
}
