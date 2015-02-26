
var context = new AudioContext();

function startRadio() {
	var canvas = document.getElementById('wavStrip');
	canvas.width = window.innerWidth - 3;
	canvas.height = 100;
	
	var getSound = new XMLHttpRequest();
	getSound.open("GET", 'http://nsab.us/public/pr-1200-afsk-aprs.wav', true);
	getSound.responseType = "arraybuffer";
	getSound.onload = function() {
		
		context.decodeAudioData(getSound.response, function(buffer) {
			var sampleRate = buffer.sampleRate;
			//console.log(buffer.getChannelData(0));
			//console.log(buffer);
			
			playBuffer(buffer, 0);
		});
	}
	getSound.send();
}

function createSubBuffer(buffer, start, end) {
	//console.log(start + ' ' + end);
	var subbuffer = context.createBuffer(1, end - start, buffer.sampleRate);
	var subdata = subbuffer.getChannelData(0);
	var data = buffer.getChannelData(0);
	for(var i = start; i < end; i++) {
		subdata[i - start] = data[i];
	}
	return subbuffer;
}

function playBuffer(buffer, index) {
	var bufferNode = context.createBufferSource();
	var localBuffer = createSubBuffer(buffer, index, index + 8192);
	drawWaveformToCanvas(localBuffer.getChannelData(0), 0);
	
	bufferNode.fullBuffer = buffer;
	bufferNode.bufferIndex = index;
	bufferNode.buffer = localBuffer;
	bufferNode.connect(context.destination); // Connect to speakers
	bufferNode.onended = function() {
		this.bufferIndex += 8192;
		if(this.bufferIndex < this.fullBuffer.length) {
			playBuffer(this.fullBuffer, this.bufferIndex);
		}
	}
	bufferNode.start(0); // play immediately
}

function drawWaveformToCanvas(buffer, start) {
	var canvas = document.getElementById('wavStrip');
	var strip = canvas.getContext('2d');
	
	var h = strip.canvas.height;
	var w = strip.canvas.width;
	strip.clearRect(0, 0, w, h);

	var y;
	// Draw scale lines at 10% interval
	strip.lineWidth = 1.0;
	strip.strokeStyle = "#55a";
	strip.beginPath();
	y = 1 * (h/10); strip.moveTo(0, y); strip.lineTo(w, y);
	y = 2 * (h/10); strip.moveTo(0, y); strip.lineTo(w, y);
	y = 3 * (h/10); strip.moveTo(0, y); strip.lineTo(w, y);
	y = 4 * (h/10); strip.moveTo(0, y); strip.lineTo(w, y);
	y = 5 * (h/10); strip.moveTo(0, y); strip.lineTo(w, y);
	y = 6 * (h/10); strip.moveTo(0, y); strip.lineTo(w, y);
	y = 7 * (h/10); strip.moveTo(0, y); strip.lineTo(w, y);
	y = 8 * (h/10); strip.moveTo(0, y); strip.lineTo(w, y);
	y = 9 * (h/10); strip.moveTo(0, y); strip.lineTo(w, y);
	strip.stroke();


	strip.strokeStyle = "#000";
	strip.lineWidth = 1.0;

	var b = start;
	var lastSample = (buffer[b++] + 1) / 2; // map -1..1 to 0..1

	for (var x = 1; x < canvas.width; x++) {
		var sample = (buffer[b++] + 1) / 2;
		if (b > buffer.length) break;
		strip.beginPath();
		strip.moveTo(x - 1, h - lastSample * h);
		strip.lineTo(x, h - sample * h);
		strip.stroke();
		lastSample = sample;
	}
}

window.onload = startRadio;
