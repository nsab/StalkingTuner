#include <stdio.h>
#include <fap.h>

int main() {
	fap_packet_t *packet;
	char error[128];
	unsigned char input[88] = { 130,160,174,174,98,96,224,156,106,174,178,156,64,104,150,106,134,134,152,64,228,174,136,106,146,178,168,228,174,146,136,138,100,64,99,3,240,47,49,56,53,55,48,48,104,47,62,46,111,63,54,49,
		69,36,95,32,115,84,48,54,53,47,48,48,48,103,48,48,52,116,48,52,54,114,48,48,50,112,48,51,54,80,48,48,55,154,135 };
	
	fap_init();
	packet = fap_parseaprs(input, 87, 0);
	if ( packet->error_code )
	{
		fap_explain_error(*packet->error_code, error);
		printf("Failed to parse packet (%s): %s\n", input, error);
	}
	else if ( packet->src_callsign )
	{
		printf("Got packet from %s.\n", packet->src_callsign);
	}
	fap_free(packet);
	
	fap_cleanup();
	
	return 0;
}