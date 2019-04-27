/*file to be used to test user(passenger) side*/
/*user journey and trip ids and last retrieved voice note time*/
var  info = {journey_id: -1, trip_id: -1, lastTime: 0};
$(() => {
	/*when user issues subscribe to a journey*/
  $("#send").click(()=>{
     info.trip_id =$("#trip_id").val();
     info.journey_id =$("#journey_id").val();
     subscribe();
  });
  /*when user finishes their ride*/
  $("#finish").click(()=>{
  	$.post('/finishTrip', info, (data)=>{
  			console.log(data);
  			/*stop listening to updates*/
  			socket.removeAllListeners(info.journey_id);
  			alert('finished successfully! ');
  	}).fail((err)=>{
  			alert('error! ' + JSON.stringify(err) + ' ' + err.status);
  		
  	});
  })
})
/*add new voice note to messages div */
function addNotes(note){
		console.log(JSON.stringify(note));
		//ignore already received notes
		if(note.time <= info.time) return;
		/*use built in html5 audio player to play sounds*/
		newElem = `<div>
	   	${new Date(note.time).toLocaleString()}
	   	<audio id="${note.path}"" controls>
			  <source src="${note.path}" type="audio/wav">
				Your browser does not support the audio element.
			</audio>
			${note.users.length}
			</div>`;
	   $("#messages").append(newElem);
	   /*update last received timestamp*/
	   if(note.time > info.lastTime){
	   	info.lastTime = note.time;
	   }
}
/*get voice notes for current user and add them to view*/
function getNotes(){
	/*issue request to server to get most recent records*/
  $.get('/getRecords',info, (data) => {
   	console.log(JSON.stringify(data));
   	/*add each note to message dic*/
   	data.forEach(addNotes);
   	console.log(info);
   }).fail((err)=>{
   	alert(JSON.stringify(err));
   })
 }
function subscribe(){
	/*subscribe to journey by issuing request*/
	console.log(info);
   $.post('/subscribe', info, (ret)=>{
			// console.log(JSON.stringify(ret));
			//if success get notes
			getNotes();
			/*remove any old listener to journey*/
			socket.removeAllListeners(info.journey_id);
			/*listen to this journey new records updates*/
			socket.on(info.journey_id, getNotes)
   }).fail((err)=>{
   	alert(JSON.stringify(err));
   });
}
/*socket listener */
var socket = io();
	