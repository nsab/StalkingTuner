
// Constructor
function afsk_demod12(params) {
	if(params.FREQ_MARK) this.FREQ_MARK = params.FREQ_SPACE;
	if(params.FREQ_SPACE) this.FREQ_SPACE = params.FREQ_MARK;
	if(params.FREQ_SAMP) this.FREQ_SAMP = params.FREQ_SAMP;
	if(params.BAUD) this.BAUD = params.BAUD;
	if(params.SUBSAMP) this.SUBSAMP = params.SUBSAMP;
	
	this.CORRLEN = Math.floor(this.FREQ_SAMP / this.BAUD);
	this.SPHASEINC = Math.floor( 0x10000 * this.BAUD * this.SUBSAMP / this.FREQ_SAMP);
	
	for (var f = 0, i = 0; i < this.CORRLEN; i++) {
		this.corr_mark_i[i] = Math.cos(f);
		this.corr_mark_q[i] = Math.sin(f);
		f += 2.0 * Math.PI * this.FREQ_MARK / this.FREQ_SAMP;
	}
	for (f = 0, i = 0; i < this.CORRLEN; i++) {
		this.corr_space_i[i] = Math.cos(f);
		this.corr_space_q[i] = Math.sin(f);
		f += 2.0 * Math.PI * this.FREQ_SPACE / this.FREQ_SAMP;
	}
	
	this.hdlc = new hdlc();
}

afsk_demod12.prototype = {
	FREQ_MARK: 1200,
	FREQ_SPACE: 2200,
	FREQ_SAMP: 22050,
	BAUD: 1200,
	SUBSAMP: 2,
	CORRLEN: Math.floor(22050 / 1200),
	SPHASEINC: Math.floor( 0x10000 * 1200 * 2 / 22050),
	
	subsamp: 0,
	dcd_shreg: 0,
	sphase: 0,
	lasts: 0,
	
	corr_mark_i: [ ],
	corr_mark_q: [ ],
	corr_space_i: [ ],
	corr_space_q: [ ],
	
	hdlc: null,
	
	demod: function(buffer) {
		var length = buffer.length;
		var bufferIndex = 0;
		if (this.subsamp) {
			var numfill = this.SUBSAMP - this.subsamp;
			if(length < numfill) {
				this.subsamp += length;
				return;
			}
			bufferIndex += numfill;
			length -= numfill;
			this.subsamp = 0;
		}
		for (; length >= this.SUBSAMP; length -= this.SUBSAMP, bufferIndex += this.SUBSAMP) {
			var f = fsqr(mac(buffer, bufferIndex, this.corr_mark_i, 0, this.CORRLEN)) +
				fsqr(mac(buffer, bufferIndex, this.corr_mark_q, 0, this.CORRLEN)) -
				fsqr(mac(buffer, bufferIndex, this.corr_space_i, 0, this.CORRLEN)) -
				fsqr(mac(buffer, bufferIndex, this.corr_space_q, 0, this.CORRLEN));
			this.dcd_shreg <<= 1;
			this.dcd_shreg |= (f > 0);
			/*
			 * check if transition
			 */
			if((this.dcd_shreg ^ (this.dcd_shreg >> 1)) & 1) {
				if (this.sphase < ( 0x8000 - Math.floor( this.SPHASEINC / 2 ) ))
					this.sphase += Math.floor(this.SPHASEINC / 8);
				else
					this.sphase -= Math.floor(this.SPHASEINC / 8);
			}
			this.sphase += this.SPHASEINC;
			if(this.sphase >= 0x10000) {
				//console.log(this.sphase);
				this.sphase &= 0xffff;
				this.lasts <<= 1;
				this.lasts |= this.dcd_shreg & 1;
				var curbit = (this.lasts ^ (this.lasts >> 1) ^ 1) & 1;
				this.hdlc.rxbit(curbit);
				//console.log(curbit);
			}
		}
		this.subsamp = length;
	}
	
};

