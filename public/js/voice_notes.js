var person = "";
var  info = {journey_id: -1, trip_id: -1, lastTime: new Date(0)};
$(() => {
  $("#send").click(()=>{
     info.trip_id =$("#trip_id").val();
     info.journey_id =$("#journey_id").val();
     subscribe();
  });
  $("#finish").click(()=>{
  	$.post('http://localhost:3000/finishTrip', info, (data)=>{
  			console.log(data);
  			alert('finished successfully! ');
  	}).fail((err)=>{
  			alert('error! ' + JSON.stringify(err) + ' ' + err.status);
  		
  	});
  })
})
function addNotes(note){
		console.log(JSON.stringify(note));
		newElem = `<div>
	   	${new Date(note.time).toLocaleString()}
	   	<audio id="${note.path}"" controls>
			  <source src="${note.path}" type="audio/wav">
				Your browser does not support the audio element.
			</audio>
			</div>`;
	   $("#messages").append(newElem);
	   if(new Date(note.time) > info.lastTime){
	   	info.lastTime = new Date(note.time);
	   }
}
function getNotes(){
  $.get('http://localhost:3000/getRecords',info, (data) => {
   	console.log(JSON.stringify(data));
   	data.forEach(addNotes);
   }).fail((err)=>{
   	alert(JSON.stringify(err));
   })
 }
function subscribe(){
	console.log(info);
   $.post('http://localhost:3000/subscribe', info, (ret)=>{
			// console.log(JSON.stringify(ret));
			//if success get notes
			getNotes();
			// socket.close();
			socket.on(info.journey_id, getNotes)
   }).fail((err)=>{
   	alert(err);
   });
}
var socket = io();
	