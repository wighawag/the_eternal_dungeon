package base;

class IOUtil{
	/*
 * Converts a UintArray into a hexadecimal string
 * @param {UintArray} bytes
 * @returns {String}
 */
	public static function convertBytesToHex(bytes : js.html.Uint8Array) {
	    // Grabbed from https://github.com/ricmoo/aes-js
	    var result = [];
	    var hex = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
	  
	    for (i in 0...bytes.length) {
	        var v = bytes[i];
	        result.push(hex[(v & 0xf0) >> 4] + hex[v & 0x0f]);
	    }
	   
	    return "0x" + result.join('');
	 }

	 public static function generateRandomHexString(numBytes : UInt){
	 	var array = new js.html.Uint8Array(numBytes);
	 	try{
	 		js.Browser.window.crypto.getRandomValues(array);
	 	}catch(e :Dynamic){
	 		for(i in 0...numBytes){
	 			array[i] = Std.int(Math.random() * 255); //TODO better
	 		}
	 	}
	 	return convertBytesToHex(array);
	 }
}