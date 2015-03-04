// from Packet.java
//
// Only methods used here are bytesWithoutCRC, addByte, terminate
function Packet() {
	this.data = new Uint8Array(this.MAX_SIZE);
	this.dataSize = 0;
}
Packet.prototype = {
	data: null,
	dataSize: 0,

	MAX_SIZE: 16384, // XXX I'm lazy, this should just realloc.

	addByte: function(val) {
		this.data[this.dataSize++] = val;
		// XXX skipped some CRC stuff
		return true;
	},

	terminate: function() {
		return true;
	},

	bytesWithoutCRC: function() {
		return this.data.subarray(0, this.dataSize);
	},
};

// Not implementing: 8000 -> 16000 supersampling.
//
// Orig code takes a "filter_length" argument. Not sure what this was being
// used for. The each filter type has two sets of coefficients (each set
// being broken down into data for specific sample rates). Seems the
// difference between the two sets is how many terms there are in the
// rate-specific data, with the second set having twice (?) as many terms
// as the first. TODO: read the paper again to see what this is for.
// The sample code's test construct with filter_length == 1, which matches
// nothing, and forces the fallback code to use the last (longer) set. So
// we'll just bake that in here.
function AfskDecoder(sampleRate, baud, onStatus) {
	this.sampleRate = sampleRate;
	this.baud = baud;
	this.emphasis = true; // TODO
	this.onStatus = onStatus;
	
	console.log(sampleRate);

	this.samplesPerBit = sampleRate / baud; // Not rounded! Floating point!
	this.td_filter = AfskFilters.getBandpassFilter(sampleRate, this.emphasis);
	this.cd_filter = AfskFilters.getCorrelationFilter(sampleRate);

	this.state.x	= new Float32Array(this.td_filter.length);
	this.state.u1 = new Float32Array(this.td_filter.length);

	var spb = Math.ceil(this.samplesPerBit);
	this.state.c0_real = new Float32Array(spb);
	this.state.c0_imag = new Float32Array(spb);
	this.state.c1_real = new Float32Array(spb);
	this.state.c1_imag = new Float32Array(spb);

	this.state.diff = new Float32Array(this.cd_filter.length);

	// Explain this?
	this.phaseIncrementFreqHi = 2 * Math.PI * this.freqHi / sampleRate;
	this.phaseIncrementFreqLo = 2 * Math.PI * this.freqLo / sampleRate;
	
	this.hdlc = new hdlc();
}


AfskDecoder.prototype = {
	sampleRate: 0,
	baud: 0,
	onStatus: null, // callback
	emphasis: false,

	freqHi: 2200,
	freqLo: 1200,
	phaseIncrementFreqHi: 0,
	phaseIncrementFreqLo: 0,
	samplesPerBit: 0.0,
	hdlc: null,

	state: {
		current: 0,
		WAITING: 0,
		JUST_SEEN_FLAG: 1,
		DECODING: 2,

		data: 0,
		bitcount: 0,

		x: null,
		u1: null,
		c0_real: null,
		c0_imag: null,
		c1_real: null,
		c1_imag: null,
		diff: null,
		j_td: 0,	// "time domain index"
		j_cd: 0,	// "correlation differential index" (?)
		j_corr: 0,	// correlation index
		t: 0,		// running sample counter
		last_transition: 0,
		phase_f0: 0.0,
		phase_f1: 0.0,
		previous_fdiff: 0.0,
		flag_count: 0,
		flag_separator_seen: false,
	},

	packet: null,

	_haveCarrier: false,
	
	
	
	get data_carrier() {
		return this._haveCarrier;
	},
	
	set data_carrier(val) {
		var change = val != this._haveCarrier;
		this._haveCarrier = val;
		if(change) {
			//this.onStatus("carrier", this._haveCarrier);
		}
	},

	dataAvailable: function(data) {
		var packet = this.hdlc.ax25_disp_packet(data, data.length);
		if(packet == false) {
			packet = { type: 'frame' };
		}
		packet['raw'] = data;
		ui.handleData(packet);
	},

	correlation: function(x, y, j) { // (float[] x, float[] y, int j)
		var c = 0.0;
		for(var i = 0; i < x.length; i++) {
			c += x[j] * y[j];
			j--;
			if(j == -1)
				j = x.length - 1;
		}
		return c;
	},

	sum: function(x, j) { //(float[] x, int j)
		c = 0.0;
		for(var i = 0; i < x.length; i++) {
			c += x[j];
			j--;
			if(j == -1)
				j = x.length - 1;
		}
		return c;
	},


	// filter a signal x stored in a cyclic buffer with a FIR filter f
	// The length of x must be larger than the length of the filter.
	filter: function(x, j, f) {
		// from Filter.filter()
		var c = 0.0;
		for(var i = 0; i < f.length; i++) {
			c += x[j] * f[i];
			j--;
			if(j == -1)
				j = x.length - 1;
		}
		return c;
	},

	addSamplesPrivate: function(s, n) { //(float[] s, int n)
		var state = this.state;
		for(var i = 0; i < n; i++) {
			var sample = s[i];
			//if(sample < 0.05) sample = 0;
			if(sample == 0) continue;
			
			//console.log(sample);
			
			// Bandpass filter 1200-2200Hz (ish)
			state.u1[state.j_td] = sample;
			state.x[state.j_td]	= this.filter(state.u1, state.j_td, this.td_filter);

			// compute correlation running value
			state.c0_real[state.j_corr] = state.x[state.j_td] * Math.cos(state.phase_f0);
			state.c0_imag[state.j_corr] = state.x[state.j_td] * Math.sin(state.phase_f0);

			state.c1_real[state.j_corr] = state.x[state.j_td] * Math.cos(state.phase_f1);
			state.c1_imag[state.j_corr] = state.x[state.j_td] * Math.sin(state.phase_f1);

			state.phase_f0 += this.phaseIncrementFreqLo;
			if(state.phase_f0 >= 2 * Math.PI)
				state.phase_f0 -= 2 * Math.PI;

			state.phase_f1 += this.phaseIncrementFreqHi;
			if(state.phase_f1 >= 2 * Math.PI)
				state.phase_f1 -= 2 * Math.PI;

			var cr, ci, c0, c1;
			cr = this.sum(state.c0_real, state.j_corr);
			ci = this.sum(state.c0_imag, state.j_corr);
			c0 = Math.sqrt(cr * cr + ci * ci);

			cr = this.sum(state.c1_real, state.j_corr);
			ci = this.sum(state.c1_imag, state.j_corr);
			c1 = Math.sqrt(cr * cr + ci * ci);

			state.diff[state.j_cd] = c0 - c1;
			var fdiff = this.filter(state.diff, state.j_cd, this.cd_filter);
			
			if(state.previous_fdiff * fdiff < 0 || state.previous_fdiff == 0) {
				// we found a transition
				var p = state.t - state.last_transition;
				state.last_transition = state.t;
				
				var bits = Math.round(p / this.samplesPerBit);
				//console.log('bits[' + i + '] ' + bits + ', state ' + state.current);

				if(bits == 0 || bits > 7) {
					state.current = state.WAITING;
					//console.log('change state to waiting');
					this.data_carrier = false;
					state.flag_count = 0;
				}
				else {
					if(bits == 7) {
						state.flag_count++;
						
						state.flag_separator_seen = false;

						state.data = 0;
						state.bitcount = 0;

						switch(state.current) {
							case state.WAITING:
								state.current = state.JUST_SEEN_FLAG;
								//console.log('change state to just seen');
								this.data_carrier = true;
								break;
							case state.JUST_SEEN_FLAG:
								break;
							case state.DECODING:
								if(this.packet && this.packet.terminate()) {
									this.dataAvailable(this.packet.bytesWithoutCRC());
								}
								this.packet = null;
								state.current = state.JUST_SEEN_FLAG;
								//console.log('change state to just seen');
								break;
						}
					}
					else {
						switch(state.current) {
							case state.WAITING:
								break;
							case state.JUST_SEEN_FLAG:
								state.current = state.DECODING;
								//console.log('change state to decoding');
								break;
							case state.DECODING:
								break;
						}

						if(state.current == state.DECODING) {
							// If this is the 0-bit after a flag, set seperator_seen
							if(bits != 1) {
									state.flag_count = 0;
							}
							else {
								if (state.flag_count > 0 && !state.flag_separator_seen)
									state.flag_separator_seen = true;
								else
									state.flag_count = 0;
							}

							for(var k = 0; k < bits - 1; k++) {
								state.bitcount++;
								state.data >>>= 1;
								state.data += 128;
								//console.log('cp1 ' + state.data);
								if(state.bitcount == 8) {
									if(!this.packet)
										this.packet = new Packet();
									//console.log(state.data);
									if(!this.packet.addByte(state.data)) {
										state.current = state.WAITING;
										//console.log('change state to waiting');
										this.data_carrier = false;
									}
									state.data = 0;
									state.bitcount = 0;
								}
							}

							if(bits - 1 != 5) { // the zero after the ones is not a stuffing
								state.bitcount++;
								state.data >>= 1;
								//console.log('cp2 ' + state.data);
								if(state.bitcount == 8) {
									if(!this.packet)
										this.packet = new Packet();
									//console.log(state.data);
									if(!this.packet.addByte(state.data)) {
										state.current = state.WAITING;
										//console.log('change state to waiting');
										this.data_carrier = false;
									}
									state.data = 0;
									state.bitcount = 0;
								}
							}
						}
					}
				}
			}
			
			state.previous_fdiff = fdiff;
			state.t++;
			state.j_td++;
			if(state.j_td == this.td_filter.length)
				state.j_td = 0;

			state.j_cd++;
			if(state.j_cd == this.cd_filter.length)
				state.j_cd = 0;

			state.j_corr++;
			if(state.j_corr == state.c0_real.length) // samples_per_bit
				state.j_corr=0;
		} // main while loop
	},

	demodulate: function(samples) {
		this.addSamplesPrivate(samples, samples.length);
	},
};

