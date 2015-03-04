

function mac(a, i1, b, i2, size) {
	var sum = 0;
	for(var i = 0; i < size; i++) {
		sum += a[i1+i] * b[i2+i];
	}
	return sum;
}

function fsqr(f) {
	return f * f;
}