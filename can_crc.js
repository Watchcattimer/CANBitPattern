// CAN 2.0A standard CRC-15 (polynomial 0x4599, initial value 0)
// Returns CRC as array of bits (most significant bit first, 15 bits)
function calcCANCRC15(bitsArr) {
    // bitsArr: array of bits (0 or 1), MSB first
    let crc = 0;
    const poly = 0x4599;

    for (let i = 0; i < bitsArr.length; i++) {
        const bit = bitsArr[i];
        const crcMsb = (crc >> 14) & 1;

        if ((crcMsb ^ bit) !== 0) {
            crc = ((crc << 1) ^ poly) & 0x7fff;
        } else {
            crc = (crc << 1) & 0x7fff;
        }
    }

    // Output as array of bits, MSB first
    const crcBits = [];
    for (let i = 14; i >= 0; i--) {
        crcBits.push((crc >> i) & 1);
    }
    return crcBits;
}
