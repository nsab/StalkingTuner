

function NSABRadioAPRS() { }
NSABRadioAPRS.prototype = {
	buffer: null,
	offset: 0,
	length: 0,
	
	getAPRSAddress: function(is_repeater) {
		var callsign = '';
		
		for(var i = 0; i < 6; i++)
			if((this.buffer[this.offset+i] & 0xfe) != 0x40)
				callsign +=  String.fromCharCode(this.buffer[this.offset+i] >> 1);
		
		var ssid = (this.buffer[this.offset+6] >> 1) & 0xf;
		if(ssid)
			callsign += "-" + ssid;
		
		if(is_repeater && (this.buffer[this.offset+6] & 0x80))
			callsign += "*";
		
		return callsign;
	},
	
	parse: function(buffer, offset, length) {
		this.buffer = buffer;
		this.length = length;
		this.offset = offset;
		
		var hdr = this.offset + 14;
		var hlen = this.length - 14;
		
		while((!(this.buffer[hdr-1] & 1)) && (hlen >= 7)) {
			hdr += 7;
			hlen -= 7;
		}
		if(this.buffer[hdr++] != 0x03) { // Ctrl 0x03 = UI frame
			return false;
		}
		if(this.buffer[hdr++] != 0xf0) { // PID 0xf0 = no layer 3 protocol
			return false;
		}
		
		var to = this.getAPRSAddress(0);
		this.offset += 7;
		var from = this.getAPRSAddress(0);
		this.offset += 7;
		
		var via = [ ];
		while((!(this.buffer[this.offset-1] & 1)) && (this.length - this.offset >= 7)) {
			via.push( this.getAPRSAddress(1) );
			this.offset += 7;
		}
		
		// end of header
		this.offset += 2;
		if(this.length - this.offset <= 0) {
			return false;
		}
		
		var dataType = this.buffer[this.offset++];
		var payload = { type: 'unimplemented', dataType: dataType };
		var displayString = '';
		
		switch(dataType) {
			case 0x1c:
				// Current Mic-E Data (Rev 0 beta)
				console.log('Unimplemented APRS Data Type: 0x1c');
				break;
			case 0x1d:
				// Old Mic-E Data (Rev 0 beta) 
				console.log('Unimplemented APRS Data Type: 0x1d');
				break;
			case 0x21:
				// Position without timestamp (no APRS messaging), or Ultimeter 2000 WX Station
				// frb`??j??b®°j??@ô®?j??@à®?j?²¨ä®???f@áð!2922.26NS10050.47W#PHG54304/DRT ON THE BORDER!/2¨&
				payload = this.parseLocation({ messaging: 0, timestamp: 0});
				
				displayString = 'Location: ' + from + '>' + to;
				if(payload.location && payload.location.longitude && payload.location.latitude) {
					var longitude = payload.location.longitude.toFixed(5);
					var latitude = payload.location.latitude.toFixed(5);
					
					if(longitude < 0) longitude = (-longitude) + 'W';
					else longitude += 'E';
					
					if(latitude < 0) latitude = (-latitude) + 'S';
					else latitude += 'N';
					
					displayString += ' ' + longitude + ' / ' + latitude;
				}
				
				if(payload.attributes && payload.attributes.altitude) {
					displayString += ', altitude ' + payload.attributes.altitude + 'ft';
				}
				
				break;
			case 0x23:
				// Peet Bros U-II Weather Station 
				console.log('Unimplemented APRS Data Type: 0x23');
				break;
			case 0x24:
				// Raw GPS data or Ultimeter 2000 
				console.log('Unimplemented APRS Data Type: 0x24');
				break;
			case 0x25:
				// Agrelo DFJr / MicroFinder
				console.log('Unimplemented APRS Data Type: 0x25');
				break;
			case 0x26:
				// [Reserved — Map Feature]
				console.log('Unimplemented APRS Data Type: 0x26');
				break;
			case 0x27:
				// Old Mic-E Data (but Current data for TM-D700)
				console.log('Unimplemented APRS Data Type: 0x27');
				break;
			case 0x29:
				// Item
				console.log('Unimplemented APRS Data Type: 0x29');
				break;
			case 0x2a:
				// Peet Bros U-II Weather Station
				console.log('Unimplemented APRS Data Type: 0x2a');
				break;
			case 0x2b:
				// [Reserved — Shelter data with time] 
				console.log('Unimplemented APRS Data Type: 0x2b');
				break;
			case 0x2e:
				// [Reserved — Space weather]
				console.log('Unimplemented APRS Data Type: 0x2e');
				break;
			case 0x2f:
				// Position with timestamp (no APRS messaging)
				// ¨fbh`??j¨¦?j®°j??@ô®???b@à®?j??@à®?j?²¨ä®???d@áð/022847h2934.93N/09828.47Wk032/000/A=000774|(h%['X|!wCI!Óó
				payload = this.parseLocation({ messaging: 0, timestamp: 1});
				
				displayString = 'Location: ' + from + '>' + to;
				if(payload.location && payload.location.longitude && payload.location.latitude) {
					var longitude = payload.location.longitude.toFixed(5);
					var latitude = payload.location.latitude.toFixed(5);
					
					if(longitude < 0) longitude = (-longitude) + 'W';
					else longitude += 'E';
					
					if(latitude < 0) latitude = (-latitude) + 'S';
					else latitude += 'N';
					
					displayString += ' ' + longitude + ' / ' + latitude;
				}
				
				if(payload.attributes && payload.attributes.altitude) {
					displayString += ', altitude ' + payload.attributes.altitude + 'ft';
				}
				
				break;
			case 0x3a:
				// Message
				console.log('Unimplemented APRS Data Type: 0x3a');
				break;
			case 0x3b:
				// Object
				console.log('Unimplemented APRS Data Type: 0x3b');
				break;
			case 0x3c:
				// Station Capabilities
				console.log('Unimplemented APRS Data Type: 0x3c');
				break;
			case 0x3d:
				// Position without timestamp (with APRS messaging)
				// b`d`??h¤?@ä®?j??@à®???b@à®?j?²¨ä®???d@áð=2934.97N/09808.47W_025/007g   t045r000p001P   h95b10219KDvsÞ$
				payload = this.parseLocation({ messaging: 1, timestamp: 0});
				
				displayString = 'Location: ' + from + '>' + to;
				if(payload.location && payload.location.longitude && payload.location.latitude) {
					var longitude = payload.location.longitude.toFixed(5);
					var latitude = payload.location.latitude.toFixed(5);
					
					if(longitude < 0) longitude = (-longitude) + 'W';
					else longitude += 'E';
					
					if(latitude < 0) latitude = (-latitude) + 'S';
					else latitude += 'N';
					
					displayString += ' ' + longitude + ' / ' + latitude;
				}
				
				if(payload.attributes && payload.attributes.altitude) {
					displayString += ', altitude ' + payload.attributes.altitude + 'ft';
				}
				
				break;
			case 0x3e:
				// Status
				// ¨fbb`®d??@@r®?j?²¨ä®???b@à®???d@eð>TinyTrak3 v1.16Ý
				payload = this.parseStatus();
				
				displayString = 'Status: ';
				if(payload.status) {
					displayString += payload.status;
				}
				
				break;
			case 0x3f:
				// Query
				console.log('Unimplemented APRS Data Type: 0x3f');
				break;
			case 0x40:
				// Position with timestamp (with APRS messaging)
				// ¤¦@@`®?j??´n?ª¤??¨à®?j?²¨ä®???d@áð@000007z3048.36N/09857.54W_072/001g003t038r000P003h97b10268/ 05314,12.2V44F66%,F=0,V051606 Nomad1
				payload = this.parseLocation({ messaging: 1, timestamp: 1});
				
				displayString = 'Location: ' + from + '>' + to;
				if(payload.location && payload.location.longitude && payload.location.latitude) {
					var longitude = payload.location.longitude.toFixed(5);
					var latitude = payload.location.latitude.toFixed(5);
					
					if(longitude < 0) longitude = (-longitude) + 'W';
					else longitude += 'E';
					
					if(latitude < 0) latitude = (-latitude) + 'S';
					else latitude += 'N';
					
					displayString += ' ' + longitude + ' / ' + latitude;
				}
				
				if(payload.attributes && payload.attributes.altitude) {
					displayString += ', altitude ' + payload.attributes.altitude + 'ft';
				}
				
				break;
			case 0x54:
				// Telemetry data
				// ¨f`à??j???ü®°j??@ô®???b@à®?j??@à®?j?²¨ä®???d@áðT#002,069,000,000,000,000,00000000Ä?
				console.log('Unimplemented APRS Data Type: 0x54');
				break;
			case 0x5b:
				// Maidenhead grid locator beacon (obsolete)
				console.log('Unimplemented APRS Data Type: 0x5b');
				break;
			case 0x5f:
				// Weather Report (without position)
				console.log('Unimplemented APRS Data Type: 0x5f');
				break;
			case 0x60:
				// Current Mic-E Data (not used in TM-D700)
				// ¦`¤°jª`®d??@@r®?j?²¨ä®???b@à®???d@eð`}NGl".v/"73}l?
				console.log('Unimplemented APRS Data Type: 0x60');
				break;
			case 0x7b:
				// User-Defined APRS packet format
				console.log('Unimplemented APRS Data Type: 0x7b');
				break;
			case 0x7d:
				// Third-party traffic
				console.log('Unimplemented APRS Data Type: 0x7d');
				break;
			default:
				console.log('Unimplemented APRS Data Type: ' + dataType);
				break;
		}
		
		return { type: 'aprs', data: { to: to, from: from, via: via, payload: payload, displayString: displayString } };
	},
	
	parseStatus: function() {
		var status = '';
		while(this.offset < this.length) {
			status += String.fromCharCode(this.buffer[this.offset++]);
		}
		
		return { type: 'status', status: status };
	},
	
	parseLocation: function(params) {
		var timestamp = 0;
		var location = { };
		var attributes = { };
		
		if(params.timestamp) {
			timestamp = this.parseTimestamp();
			if(timestamp == false) {
				return false;
			}
		}
		
		var poschar = this.buffer[this.offset];
		if(poschar >= 48 && poschar <= 57) {
			location = this.parseLocationNormal();
			if(location == false) {
				return false;
			}
			if(this.length - this.offset && location.symbol_code != '_') {
				attributes = this.parseAttributes();
				if(attributes == false) {
					return false;
				}
			}
		}
		else if(poschar == 47 || poschar == 92 || (poschar >= 65 && poschar <= 90) || (poschar >= 97 && poschar <= 106)) {
			location = this.parseLocationCompressed();
			/*if(location == false) {
				return false;
			}
			if(this.length - this.offset && location.symbol_code != '_') {
				attributes = this.parseAttributes();
				if(attributes == false) {
					return false;
				}
			}*/
		}
		else if(poschar == 33) {
			// TODO
		}
		else {
			// ! can occur within the first 40 chars so we may have a packet like this
			// TODO
			return false;
		}
		
		return { type: 'location', messaging: params.messaging, timestamp: timestamp, location: location, attributes: attributes };
	},
	
	parseLocationNormal: function() {
		var location = { latitude: 0, longitude: 0, resolution: 0, symbol_table: '', symbol_code: '' };
		var latitude = 0;
		var longitude = 0;
		
		if(this.length - this.offset < 19) {
			return false;
		}
		
		if(this.buffer[this.offset+18] != 0x7d && (this.buffer[this.offset+18] < 0x21 || this.buffer[this.offset+18] > 0x7b)) {
			return false;
		}
		
		var sind = String.fromCharCode(this.buffer[this.offset+7]).toUpperCase();
		var wind = String.fromCharCode(this.buffer[this.offset+17]).toUpperCase();
		
		location.symbol_table = String.fromCharCode(this.buffer[this.offset+8]);
		location.symbol_code = String.fromCharCode(this.buffer[this.offset+18]);
		
		var lat_deg = parseFloat(String.fromCharCode(this.buffer[this.offset+0]) + String.fromCharCode(this.buffer[this.offset+1]));
		var lat_min = parseFloat(String.fromCharCode(this.buffer[this.offset+2]) + String.fromCharCode(this.buffer[this.offset+3]) + String.fromCharCode(this.buffer[this.offset+4]) + String.fromCharCode(this.buffer[this.offset+5]) + String.fromCharCode(this.buffer[this.offset+6]));
		var lon_deg = parseFloat(String.fromCharCode(this.buffer[this.offset+9]) + String.fromCharCode(this.buffer[this.offset+10]) + String.fromCharCode(this.buffer[this.offset+11]));
		var lon_min = parseFloat(String.fromCharCode(this.buffer[this.offset+12]) + String.fromCharCode(this.buffer[this.offset+13]) + String.fromCharCode(this.buffer[this.offset+14]) + String.fromCharCode(this.buffer[this.offset+15]) + String.fromCharCode(this.buffer[this.offset+16]));
		
		if(!((location.symbol_table == '/') || (location.symbol_table == '\\') || (location.symbol_table >= 'A' && location.symbol_table <= 'Z') || (Number(location.symbol_table) == location.symbol_table && location.symbol_table % 1 === 0))) {
			return false;
		}
		
		if(lat_deg > 89 || lon_deg > 179) {
			return false;
		}
		
		var tmp_5b = String.fromCharCode(this.buffer[this.offset+2]) + String.fromCharCode(this.buffer[this.offset+3]) + String.fromCharCode(this.buffer[this.offset+5]) + String.fromCharCode(this.buffer[this.offset+6])
		var tmp_5bc = tmp_5b.replace(/\s/g, '');
		
		var pos_ambiguity = tmp_5bc.length - tmp_5b.length;
		
		switch(pos_ambiguity) {
			case 0:
				location.latitude = lat_deg + (lat_min / 60);
				location.longitude = lon_deg + (lon_min / 60);
				break;
			case 4:
				location.latitude = lat_deg + 0.5;
				location.longitude = lon_deg + 0.5;
				break;
			case 1:
			case 2:
				location.latitude = lat_deg + (lat_min / 60);
				location.longitude = lon_deg + (lon_min / 60);
				break;
			case 3:
				lat_min = String.fromCharCode(this.buffer[this.offset+2]) + '5';
				lon_min = String.fromCharCode(this.buffer[this.offset+12]) + String.fromCharCode(this.buffer[this.offset+13]) + '5';
				location.latitude = lat_deg + (lat_min / 60);
				location.longitude = lon_deg + (lon_min / 60);
				break;
			default:
				return false;
		}
		
		if(sind == 'S') {
			location.latitude = -location.latitude;
		}
		if(wind == 'W') {
			location.longitude = -location.longitude;
		}
		
		var minute_digit_count = (2 - pos_ambiguity);
		location.resolution =  (minute_digit_count  <= -2)  ? 1111.2 * Math.pow(10, -minute_digit_count): 1852 * Math.pow(10, -minute_digit_count);
		this.offset += 19;
		
		return location;
	},
	
	parseLocationCompressed: function() {
		if(this.length - this.offset < 13) {
			return false;
		}
		
		// TODO
		
	},
	
	parseAttributes: function() {
		var attributes = { phg: '', course: 0, speed: 0, radio_range: 0, altitude: 0 };
		
		if(this.length - this.offset >= 9 && this.buffer[this.offset+4] >= 0x30 && this.buffer[this.offset+4] <= 0x7e && String.fromCharCode.apply(null, this.buffer.subarray(this.offset, this.offset+9)).match(/^PHG([0-9].[0-9]{2}[1-9A-Z])\//)) {
			attributes.phg = String.fromCharCode.apply(null, this.buffer.subarray(this.offset+3, this.offset+8));
			this.offset += 8;
		}
		else if(this.length - this.offset >= 7 && String.fromCharCode.apply(null, this.buffer.subarray(this.offset, this.offset+7)).match(/^([0-9\\. ]{3})\/([0-9\. ]{3})/)) {
			attributes.course = parseInt(String.fromCharCode.apply(null, this.buffer.subarray(this.offset, this.offset+3)));
			attributes.speed = parseFloat(String.fromCharCode.apply(null, this.buffer.subarray(this.offset+4, this.offset+7))) * 1.852;
			this.offset += 7;
		}
		else if(this.length - this.offset >= 7 && String.fromCharCode.apply(null, this.buffer.subarray(this.offset, this.offset+7)).match(/^PHG([0-9].[0-9]{2})/ && this.buffer[this.offset+4] >= 0x30 && this.buffer[this.offset+4] <= 0x7e)) {
			attributes.phg = String.fromCharCode.apply(null, this.buffer.subarray(this.offset+3, this.offset+4));
			this.offset += 7;
		}
		else if(this.length - this.offset >= 7 && String.fromCharCode.apply(null, this.buffer.subarray(this.offset, this.offset+7)).match(/^RNG([0-9]{4})/)) {
			attributes.radio_range = parseFloat(String.fromCharCode.apply(null, this.buffer.subarray(this.offset+3, this.offset+7))) * 1.609344;
			this.offset += 7;
		}
		
		if(this.length - this.offset >= 9) {
			var str = String.fromCharCode.apply(null, this.buffer.subarray(this.offset, this.offset+9));
			if(str.match(/\/A=(-[0-9]{5}|[0-9]{6})/)) {
				attributes.altitude = parseInt(String.fromCharCode.apply(null, this.buffer.subarray(this.offset+3, this.offset+9)));
				this.offset += 9;
			}
		}
		
		// rest is TODO
		
		return attributes;
	},
	
	parseTimestamp: function() {
		var timestamp = 0;
		
		var first = String.fromCharCode(this.buffer[this.offset++]) + String.fromCharCode(this.buffer[this.offset++]);
		var second = String.fromCharCode(this.buffer[this.offset++]) + String.fromCharCode(this.buffer[this.offset++]);
		var third = String.fromCharCode(this.buffer[this.offset++]) + String.fromCharCode(this.buffer[this.offset++]);
		var type = String.fromCharCode(this.buffer[this.offset++]);
		
		if(Number(first) != first || first % 1 !== 0) return false;
		if(Number(second) != second || second % 1 !== 0) return false;
		if(Number(third) != third || third % 1 !== 0) return false;
		
		var date = new Date;
		var now = date.getTime() / 1000;
		
		if(type == 'h') {
			if(first > 23 || second > 59 || third > 59) {
				return false;
			}
			
			date.setHours(first);
			date.setMinutes(second);
			date.setSeconds(third);
			
			timestamp = date.getTime() / 1000;
			
			if(now + 3600 < timestamp) {
				timestamp -= 86400;
			}
			else if(now - 82800 > timestamp) {
				timestamp += 86400;
			}
		}
		else if(type == '/' || type == 'z') {
			if(first < 1 || first > 31 || second > 23 || third > 59) {
				return false;
			}
			
			date.setDate(first);
			date.setHours(second);
			date.setMinutes(third);
			date.setSeconds(0);
			
			var current = date.getTime() / 1000;
			
			date.setMonth((date.getMonth() + 1) % 12);
			var next = date.getTime() / 1000;
			
			date.setMonth((date.getMonth() + 12 - 1) % 12);
			var last = date.getTime() / 1000;
			
			if(next - now < 43400) {
				timestamp = next;
			}
			else if(current - now < 43400) {
				timestamp = current;
			}
			else {
				timestamp = last;
			}
			
			if(type == '/') {
				timestamp += date.getTimezoneOffset() * 60;
			}
		}
		else {
			return false;
		}
		
		return Math.floor(timestamp);
	},
	
	
};