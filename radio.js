

function NSABRadio() {
	this.context = new AudioContext();
}
NSABRadio.prototype = {
	squelchLevel: 0.05,
	squelchBuffer: Array.apply(null, new Array(32)).map(Number.prototype.valueOf,0),
	squelchBufferIndex: 0,
	decoder: null,
	micEnabled: false,
	context: null,
	muteFlag: false,
	pauseFlag: false,
	decoder: null,
	
	setSquelchLevel: function(level) {
		this.squelchLevel = level;
	},
	
	play: function() {
		this.pauseFlag = false;
		if(!this.micEnabled) {
			if (navigator.mozGetUserMedia)
				navigator.mozGetUserMedia({audio: true}, function(stream) { radio.onMicInit(stream) }, function() { radio.onMicError() });
			else if (navigator.webkitGetUserMedia)
				navigator.webkitGetUserMedia({audio: true}, function(stream) { radio.onMicInit(stream) }, function() { radio.onMicError });
		}
	},
	
	pause: function() {
		this.pauseFlag = true;
	},
	
	mute: function(value) {
		this.muteFlag = value;
	},
	
	onMicInit: function(stream) {
		console.log("-- onMicStream --");
		audioSource = this.context.createMediaStreamSource(stream);
		
		afskNode = this.context.createScriptProcessor(8192);
		audioSource.connect(afskNode);
		afskNode.addEventListener("audioprocess", function(event) { radio.onAudioProcess(event); });
		afskNode.connect(this.context.destination);
		
		this.micEnabled = true;
	},
	
	onMicError: function() {
		
	},
	
	onAudioProcess: function(event) {
		if(this.pauseFlag) return;
		var buffer = this.bufferSquelch(event.inputBuffer);
		if(!this.muteFlag) this.playBuffer(buffer);
		
		if (!this.decoder) {
			//this.decoder = new afsk_demod12({ FREQ_SAMP: buffer.sampleRate });
			this.decoder = new AfskDecoder(buffer.sampleRate, 1200);
		}
		
		//this.decoder.demod(buffer.getChannelData(0));
		this.decoder.demodulate(buffer.getChannelData(0));
	},
	
	bufferSquelch: function(buffer) {
		var samples = buffer.getChannelData(0);
		
		var newBuffer = this.context.createBuffer(1, samples.length, buffer.sampleRate);
		var data = newBuffer.getChannelData(0);
		
		for(var i = 0; i < samples.length; i++) {
			var squelch = false;
			this.squelchBuffer[this.squelchBufferIndex] = samples[i];
			if(this.squelchBuffer[this.squelchBufferIndex] < this.squelchLevel) {
				squelch = true;
				for(var j = 0; j < this.squelchBuffer.length; j++) {
					if(this.squelchBuffer[j] >= this.squelchLevel) {
						squelch = false;
						break;
					}
				}
			}
			data[i] = squelch ? 0 : samples[i];
			this.squelchBufferIndex = (this.squelchBufferIndex + 1) % this.squelchBuffer.length;
		}
		
		return newBuffer;
	},
	
	playBuffer: function(buffer) {
		var bufferNode = this.context.createBufferSource();
		
		bufferNode.buffer = buffer;
		bufferNode.connect(this.context.destination);
		bufferNode.start(0);
	}
	
};

/*
//var context = new AudioContext();
window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
var decoder;
var baudrate = 1200;
var squelchBuffer = Array.apply(null, new Array(32)).map(Number.prototype.valueOf,0);
var squelchBufferIndex = 0;

function startRadio() {
	
	//if (navigator.mozGetUserMedia)
	//	navigator.mozGetUserMedia({audio: true}, onMicInit, onMicError);
	//else if (navigator.webkitGetUserMedia)
	//	navigator.webkitGetUserMedia({audio: true}, onMicInit, onMicError);
	
	//filterNode = context.createBiquadFilter();
	//filterNode.type = filterNode.LOWPASS; // Low pass
	//filterNode.frequency.value = 22050;
	//filterNode.Q.value = 0.5;
	
	//var canvas = document.getElementById('wavStrip');
	//canvas.width = window.innerWidth - 3;
	//canvas.height = 100;
	
	//var getSound = new XMLHttpRequest();
	//getSound.open("GET", 'http://nsab.us/StalkingTuner/audio.wav', true);
	//getSound.responseType = "arraybuffer";
	//getSound.onload = function() {
	//	context.decodeAudioData(getSound.response, function(buffer) {
	//		var sampleRate = buffer.sampleRate;
	//		console.log(sampleRate);
	//		var decoder = new afsk_demod12();
	//		decoder.init({ FREQ_SAMP: sampleRate });
	//		decoder.demod(buffer.getChannelData(0), buffer.length);
	//		
	//		console.log('done');
	//		
			//playBuffer(buffer, 0);
	//	});
	//}
	//getSound.send();*
}

function onMicInit(stream) {
	console.log("-- onMicStream --");
	micStream = stream;
	audioSource = context.createMediaStreamSource(stream);

	afskNode = context.createScriptProcessor(8192); // buffersize, input channels, output channels;
	audioSource.connect(afskNode);
	afskNode.addEventListener("audioprocess", onAudioProcess);
	afskNode.connect(context.destination);
	console.log("onMicStream done 3");
}

function onAudioProcess(event) {
	var buffer = bufferSquelch(event.inputBuffer);
	playBuffer(buffer);
	
	if (!decoder) {
		//inputSampleRate = buffer.sampleRate;
		//console.log("input sample rate is: " + inputSampleRate);
		//decoder = new AfskDecoder(inputSampleRate, baudrate, onDecoderStatus);
		
		decoder = new afsk_demod12({ FREQ_SAMP: buffer.sampleRate });
	}
	
	//var samplesIn = buffer.getChannelData(0);
	decoder.demod(buffer.getChannelData(0));
	//decoder.demodulate(samplesIn);
}

function onMicError(e) {
	console.log("MicError: " + e);
}

function onDecoderStatus(status, data) {
	if (status == "carrier") {
		//console.log("<CD>: " + data);
		return;
	}

	if (status == "data") {
		console.log(data);
		var blob = new Blob([data]);
		var fileReader = new FileReader();
		fileReader.onload = function(e) {
			var data = e.target.result.replace(/[^\x20-\x7E]+/g, '');
			if(data != '') {
				data = data.replace(/</, '&lt;');
				data = data.replace(/>/, '&gt;');
				data = data.replace(/ /, '&nbsp;');
				if(data.match(/DB0HOR/)) {
					data = '<span class="red">' + data + '</span>';
				}
				var textarea = document.getElementById('radiodata');
				textarea.scrollTop = textarea.scrollHeight;
				textarea.innerHTML += data + "<br>\n";
			}
		}.bind(this);
		fileReader.readAsText(blob);
	}
}

function bufferSquelch(buffer) {
	var squelchThreshold = 0.05;
	var samples = buffer.getChannelData(0);
	
	var newBuffer = context.createBuffer(1, samples.length, buffer.sampleRate);
	var data = newBuffer.getChannelData(0);
	
	for(var i = 0; i < samples.length; i++) {
		var squelch = false;
		squelchBuffer[squelchBufferIndex] = samples[i];
		if(squelchBuffer[squelchBufferIndex] < squelchThreshold) {
			squelch = true;
			for(var j = 0; j < squelchBuffer.length; j++) {
				if(squelchBuffer[j] >= squelchThreshold) {
					squelch = false;
					break;
				}
			}
		}
		data[i] = squelch ? 0 : samples[i];
		squelchBufferIndex = (squelchBufferIndex + 1) % squelchBuffer.length;
	}
	//return buffer;
	return newBuffer;
}









function createSubBuffer(buffer, start, size) {
	var subbuffer = context.createBuffer(1, size, buffer.sampleRate);
	var subdata = subbuffer.getChannelData(0);
	var data = buffer.getChannelData(0);
	var lastValue = 0;
	var writeIndex = 0;
	var readIndex = start;
	var endIndex = readIndex + size;
	while(readIndex < data.length && (readIndex < endIndex || Math.abs(lastValue - data[readIndex]) > Math.abs(lastValue))) {
		subdata[writeIndex++] = data[readIndex++];
		lastValue = data[readIndex];
	}
	return subbuffer;
}

function playBuffer(buffer) {
	var bufferNode = context.createBufferSource();
	
	//drawWaveformToCanvas(localBuffer.getChannelData(0));
	
	//bufferNode.bufferIndex = index;
	bufferNode.buffer = buffer;
	bufferNode.connect(context.destination); // Connect to speakers
	bufferNode.onended = function() {
		/*if(this.bufferIndex < this.fullBuffer.length) {
		//	playBuffer(bufferNode.fullBuffer, this.bufferIndex + this.buffer.length);
		//}*
	}
	bufferNode.start(0); // play immediately
}

function drawWaveformToCanvas(buffer) {
	var canvas = document.getElementById('wavStrip');
	var strip = canvas.getContext('2d');
	
	var h = strip.canvas.height;
	var w = strip.canvas.width;
	var bufferWidth = 20;
	
	var imageData = strip.getImageData(bufferWidth, 0, canvas.width - bufferWidth, canvas.height);
	strip.putImageData(imageData, 0, 0);
	strip.clearRect(canvas.width - bufferWidth, 0, bufferWidth, canvas.height);
	
	strip.strokeStyle = "#000";
	strip.lineWidth = 1.0;
	
	var lastSample = (buffer[0] + 1) / 2; // map -1..1 to 0..1
	
	var cl = canvas.width - bufferWidth;
	var cr = canvas.width;
	var bufferResample = 8;
	var bufferLength = buffer.length/bufferResample;
	
	for (var i = 1; i < bufferLength; i++) {
		var sample = (buffer[i*bufferResample] + 1) / 2;
		
		var x1 = cl + (i - 1) * (cr - cl) / bufferLength;
		var x2 = cl + i * (cr - cl) / bufferLength;
		
		strip.beginPath();
		strip.moveTo(x1, h - lastSample * h);
		strip.lineTo(x2, h - sample * h);
		strip.stroke();
		lastSample = sample;
	}
	
}
*/
