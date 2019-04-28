/*file to be used to test user(driver) side*/
var journey_id = prompt("Please enter your journey id:", "1");
if (person == null || person == "") {
  location.reload();//we must get journey id
}
$(() => {
	/*when user issues subscribe to a journey*/
  $("#send").click(()=>{
  	getNotes();
  });
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
  $.get('/getRecords',{journey_id: journey_id}, (data) => {
   	console.log(JSON.stringify(data));
   	/*add each note to message dic*/
   	$("#messages").html("");//clear first
   	data.forEach(addNotes);
   	console.log(info);
   }).fail((err)=>{
   	alert(JSON.stringify(err));
   })
 }
	