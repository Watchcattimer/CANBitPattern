// CAN 2.0A standard CRC-15 (polynomial 0x4599, initial value 0)
// Returns CRC as array of bits (most significant bit first, 15 bits)
function calcCANCRC15(bitsArr) {
    // bitsArr: array of bits (0/1 as numbers), most significant bit first
    let crc = 0;
    const poly = 0x4599; // x^15 + x^14 + x^10 + x^8 + x^7 + x^4 + x^3 + 1

    for (let i = 0; i < bitsArr.length; i++) {
        let bit = bitsArr[i];
        let crcMsb = (crc >> 14) & 1;
        crc = ((crc << 1) | bit) & 0x7fff; // 15 bits
        if (crcMsb) {
            crc ^= poly;
        }
    }
    // Output as array of bits, MSB first
    let crcBits = [];
    for (let i = 14; i >= 0; i--) {
        crcBits.push((crc >> i) & 1);
    }
    return crcBits;
}
