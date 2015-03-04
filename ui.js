
var ui;
var radio;


window.onload = function() {
	radio = new NSABRadio();
	ui = new NSABRadioUI();
	
	document.getElementById('fullscreen-button').addEventListener('click', function(e) { ui.toggleFullscreen() } );
	document.addEventListener("fullscreenchange", function(e) { ui.exitFullscreen() }, false);      
	document.addEventListener("webkitfullscreenchange", function(e) { ui.exitFullscreen() }, false);
	document.addEventListener("mozfullscreenchange", function(e) { ui.exitFullscreen() }, false);
	
	document.getElementById('pause-button').addEventListener('click', function(e) { ui.togglePause() } );
	
	document.getElementById('mute-button').addEventListener('click', function(e) { ui.toggleMute() } );
	
	document.getElementById('settings-button').addEventListener('click', function(e) { ui.showSettings() } );
	document.getElementById('settings-cancel').addEventListener('click', function(e) { ui.cancelSettings() } );
	document.getElementById('settings-save').addEventListener('click', function(e) { ui.saveSettings() } );
	
	radio.play();
}



function NSABRadioSettings() { this.load(); }
NSABRadioSettings.prototype = {
	defaults: {
		audio: {
			mute: false,
			squelch: 0.05,
		},
		protocol: 'APRS',
		application: {
			identifier: '',
			filter_mismatches: 0
		},
		views: {
			radio_text: 1,
			radio_waterfall: 1,
			location_map: 0
		},
		sync_location: {
			nsab: {
				enabled: 0
			}
		}
	},
	current: { },
	
	load: function() {
		this.current = (localStorage.getItem("settings") === null) ? JSON.parse(JSON.stringify(this.defaults)) : JSON.parse(localStorage.getItem("settings"));
	},
	
	getDefault: function(key) {
		var keys = key.split('.');
		var root = this.defaults;
		for(var i = 0; i < keys.length; i++) {
			if(root[keys[i]] == undefined) return null;
			root = root[keys[i]];
		}
		return root;
	},
	get: function(key) {
		var keys = key.split('.');
		var root = this.current;
		for(var i = 0; i < keys.length; i++) {
			if(root[keys[i]] == undefined) return this.getDefault(key);
			root = root[keys[i]];
		}
		return root;
	},
	set: function(key, value, save) {
		var keys = key.split('.');
		var root = this.current;
		for(var i = 0; i < keys.length - 1; i++) {
			if(root[keys[i]] == undefined) root[keys[i]] = { };
			root = root[keys[i]];
		}
		
		root[keys[i]] = value;
		
		return (save != undefined && save) ? this.save() : true;
	},
	save: function() {
		localStorage.setItem("settings", JSON.stringify(this.current));
		return true;
	}
	
};


function NSABRadioUI() {
	var mute = this.settings.get('audio.mute');
	if(mute) {
		this.toggleMute();
	}
	
	this.reconfigureDisplay();
}
NSABRadioUI.prototype = {
	isFullscreenFlag: false,
	isPausedFlag: false,
	isMutedFlag: false,
	lastFullscreenAction: 'none',
	settings: new NSABRadioSettings(),
	
	getLastFullscreenAction: function() { return this.lastFullscreenAction; },
	
	toggleFullscreen: function(w) {
		if(w == undefined) w = this.isFullscreenFlag;
		
		if(w) {
			if(document.exitFullscreen) {
				document.exitFullscreen();
			}
			else if(document.msExitFullscreen) {
				document.msExitFullscreen();
			}
			else if(document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			}
			else if(document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
			else {
				return;
			}
			document.getElementById('fullscreen-button').className = 'fullscreen-off';
			this.isFullscreenFlag = false;
			this.lastFullscreenAction = 'exitFullscreen';
		}
		else {
			if(document.documentElement.requestFullscreen) {
				document.documentElement.requestFullscreen();
			}
			else if(document.documentElement.webkitRequestFullscreen) {
				document.documentElement.webkitRequestFullscreen();
			}
			else if(document.documentElement.mozRequestFullScreen) {
				document.documentElement.mozRequestFullScreen();
			}
			else if(document.documentElement.msRequestFullscreen) {
				document.documentElement.msRequestFullscreen();
			}
			else {
				return;
			}
			document.getElementById('fullscreen-button').className = 'fullscreen-on';
			this.isFullscreenFlag = true;
			this.lastFullscreenAction = 'enterFullscreen';
		}
	},
	isFullscreen: function() { return this.isFullscreenFlag; },
	
	exitFullscreen: function(e) {
		if(this.isFullscreen() == true && this.getLastFullscreenAction() != 'enterFullscreen') {
			this.toggleFullscreen(true);
		}
		this.lastFullscreenAction = '';
	},
	
	togglePause: function() {
		if(this.isPaused()) {
			document.getElementById('pause-button').className = 'pause-off';
			this.isPausedFlag = false;
			radio.play();
		}
		else {
			document.getElementById('pause-button').className = 'pause-on';
			this.isPausedFlag = true;
			radio.pause();
		}
	},
	isPaused: function() { return this.isPausedFlag; },
	
	toggleMute: function() {
		if(this.isMuted()) {
			document.getElementById('mute-button').className = 'mute-off';
			this.isMutedFlag = false;
			this.settings.set('audio.mute', 0, true);
		}
		else {
			document.getElementById('mute-button').className = 'mute-on';
			this.isMutedFlag = true;
			this.settings.set('audio.mute', 1, true);
		}
		radio.mute(this.isMutedFlag);
	},
	isMuted: function() { return this.isMutedFlag; },
	
	showSettings: function() {
		
		var audio_squelch = this.settings.get('audio.squelch');
		var protocol = this.settings.get('protocol');
		var identifier = this.settings.get('application.identifier');
		var radio_text = this.settings.get('views.radio_text');
		var radio_waterfall = this.settings.get('views.radio_waterfall');
		var location_map = this.settings.get('views.location_map');
		var sync_nsab_enabled = this.settings.get('sync_location.nsab.enabled');
		
		document.getElementById('audio.squelch').value = audio_squelch;
		document.getElementById('application.identifier').value = identifier;
		
		if(radio_text) document.getElementById('views.radio_text').checked = true;
		if(radio_waterfall) document.getElementById('views.radio_waterfall').checked = true;
		if(location_map) document.getElementById('views.location_map').checked = true;
		
		if(sync_nsab_enabled) document.getElementById('sync.nsab').checked = true;
		
		document.getElementById('settings-screen').className = 'show';
	},
	cancelSettings: function() {
		document.getElementById('settings-screen').className = 'hide';
	},
	saveSettings: function() {
		
		this.settings.set('application.identifier', document.getElementById('application.identifier').value);
		this.settings.set('views.radio_text', document.getElementById('views.radio_text').checked ? 1 : 0);
		this.settings.set('views.radio_waterfall', document.getElementById('views.radio_waterfall').checked ? 1 : 0);
		this.settings.set('views.location_map', document.getElementById('views.location_map').checked ? 1 : 0);
		this.settings.set('sync_location.nsab.enabled', document.getElementById('sync.nsab').checked ? 1 : 0);
		
		this.reconfigureDisplay();
		
		this.settings.save();
		this.cancelSettings();
	},
	
	reconfigureDisplay: function() {
		var count = 0;
		var radio_text = this.settings.get('views.radio_text');
		var radio_waterfall = this.settings.get('views.radio_waterfall');
		var location_map = this.settings.get('views.location_map');
		
		document.getElementById('radio-text').className = radio_text ? 'show' : 'hide';
		count += radio_text;
		
		document.getElementById('radio-waterfall').className = radio_waterfall ? 'show' : 'hide';
		count += radio_waterfall;
		
		document.getElementById('location-map').className = location_map ? 'show' : 'hide';
		count += location_map;
		
		if(count) {
			document.getElementById('radio-text').style.height = (100 / count) + '%';
			document.getElementById('radio-waterfall').style.height = (100 / count) + '%';
			document.getElementById('location-map').style.height = (100 / count) + '%';
		}
	},
	
	handleData: function(data) {
		if(data.type == 'aprs' && data.data && data.data.displayString) {
			//var str = String.fromCharCode.apply(null, data['raw']);
			//console.log(str);
			
			var scrollBottom = (document.getElementById('radio-text-content').scrollTop + document.getElementById('radio-text-content').clientHeight == document.getElementById('radio-text-content').scrollHeight);
			console.log(document.getElementById('radio-text-content').scrollTop);
			console.log(document.getElementById('radio-text-content').scrollHeight);
			console.log(document.getElementById('radio-text-content').clientHeight); // yes?
			console.log(document.getElementById('radio-text-content').offsetHeight); // no
			console.log(document.getElementById('radio-text-content').scrollHeight); // no
			console.log(scrollBottom);
			
			var div = document.createElement('div');
			div.innerHTML = data.data.displayString;
			document.getElementById('radio-text-content').appendChild(div);
			if(scrollBottom) document.getElementById('radio-text-content').scrollTop = document.getElementById('radio-text-content').scrollHeight;
			
		}
		//console.log(data);
	},
	
};

