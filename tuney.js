var currentNote;
var currentFrequency;

var confidence_threshold = 30;  //how sensitive to noise the tuner is, default 30

var slider = document.getElementById("sensitivity");

slider.oninput = function() {
  confidence_threshold = this.value;
	document.getElementById("valueBro").textContent = confidence_threshold;
}




// Define the set of test frequencies that we'll use to analyze microphone data.
var C2 = 65.41; // C2 note, in Hz.
var notes = [ "C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B" ];
var test_frequencies = [];
for (var i = 0; i < 51; i++)
{
	var note_frequency = C2 * Math.pow(2, i / 12);
	var note_name = notes[i % 12];
	var note = { "frequency": note_frequency, "name": note_name };
	var just_above = { "frequency": note_frequency * Math.pow(2, 1 / 48), "name": note_name };
	var just_below = { "frequency": note_frequency * Math.pow(2, -1 / 48), "name": note_name };
	test_frequencies = test_frequencies.concat([ just_below, note, just_above ]);
	//test_frequencies = test_frequencies.concat([note]);
}
//console.log(test_frequencies);

//window.addEventListener("load", initialize);

var correlation_worker = new Worker("correlation_worker.js");
correlation_worker.addEventListener("message", interpret_correlation_result);

/*

function initialize()
{
  //console.log(navigator.mediaDevices.enumerateDevices());

	var get_user_media = navigator.getUserMedia;
	get_user_media = get_user_media || navigator.webkitGetUserMedia;
	get_user_media = get_user_media || navigator.mozGetUserMedia;
	get_user_media.call(navigator, { "audio": true }, use_stream, function() {});

//	document.getElementById("play-note").addEventListener("click", toggle_playing_note);
}
*/
var audio_context;
var microphone;
var script_processor;
var buffer = [];
var sample_length_milliseconds = 100;
var recording = true;

function use_stream(stream)
{

  window.stream = stream;
  //console.log(stream);
	 audio_context = new AudioContext();
	 microphone = audio_context.createMediaStreamSource(stream);
	window.source = microphone; // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=934512
	 script_processor = audio_context.createScriptProcessor(1024, 1, 1);

	script_processor.connect(audio_context.destination);
	microphone.connect(script_processor);

  script_processor.onaudioprocess = window.capture_audio;

}

// Need to leak this function into the global namespace so it doesn't get
// prematurely garbage-collected.
// http://lists.w3.org/Archives/Public/public-audio/2013JanMar/0304.html
window.capture_audio = function(event)
{
  if (!recording)
    return;

  buffer = buffer.concat(Array.prototype.slice.call(event.inputBuffer.getChannelData(0)));

  // Stop recording after sample_length_milliseconds.
  if (buffer.length > sample_length_milliseconds * audio_context.sampleRate / 1000)
  {
    recording = false;

    correlation_worker.postMessage
    (
      {
        "timeseries": buffer,
        "test_frequencies": test_frequencies,
        "sample_rate": audio_context.sampleRate
      }
    );

    buffer = [];
    setTimeout(function() { recording = true; }, 100);  //main loop?
  }
};





function interpret_correlation_result(event)
{
	var timeseries = event.data.timeseries;
	var frequency_amplitudes = event.data.frequency_amplitudes;

	// Compute the (squared) magnitudes of the complex amplitudes for each
	// test frequency.
	var magnitudes = frequency_amplitudes.map(function(z) { return z[0] * z[0] + z[1] * z[1]; });

	// Find the maximum in the list of magnitudes.
	var maximum_index = -1;
	var maximum_magnitude = 0;
	for (var i = 0; i < magnitudes.length; i++)
	{
		if (magnitudes[i] <= maximum_magnitude)
			continue;

		maximum_index = i;
		maximum_magnitude = magnitudes[i];
	}

	// Compute the average magnitude. We'll only pay attention to frequencies
	// with magnitudes significantly above average.
	var average = magnitudes.reduce(function(a, b) { return a + b; }, 0) / magnitudes.length;
	var confidence = maximum_magnitude / average;                                          //maybe chnage to maximum_magnitude - average?
  //confidence_threshold = 30; //Threshold set at top
	if (confidence > confidence_threshold)
	{
		var dominant_frequency = test_frequencies[maximum_index];
		document.getElementById("note-name").textContent = dominant_frequency.name;
		currentNote = dominant_frequency.name;
		document.getElementById("frequency").textContent = dominant_frequency.frequency;
		currentFrequency = dominant_frequency.frequency;
    document.getElementById("keyDown").textContent = configArray[currentNote];
    if(keySimOn == true){
      ipcRenderer.send('asynchronous-message', configArray[currentNote]);
    }
	}else{
		document.getElementById("note-name").textContent = "--";
		document.getElementById("frequency").textContent = "--";
		currentNote = null;
		currentFrequency = null;
    document.getElementById("keyDown").textContent = "--";
      if(keySimOn == true){
        ipcRenderer.send('asynchronous-message', null);
      }
	}
}
