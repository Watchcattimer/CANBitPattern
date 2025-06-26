// Convert number to bit array (MSB→LSB)
function numberToBits(num, length) {
    const bits = [];
    for (let i = length - 1; i >= 0; i--) {
        bits.push((num >> i) & 1);
    }
    return bits;
}

// Parse hex data string into byte array
function parseHexData(str, dlc) {
    if (!str.trim() || dlc === 0) return [];
    let arr = str.replace(/,/g, " ").split(/\s+/).filter(Boolean);
    if (arr.length > dlc) arr = arr.slice(0, dlc);
    let bytes = arr.map(x => parseInt(x, 16));
    if (bytes.some(isNaN)) throw new Error("Invalid data byte input.");
    while (bytes.length < dlc) bytes.push(0);
    return bytes;
}

function stuffBits(bits) {
    let res = [bits[0]], count = 1, stuffIndices = [];
    for (let i = 1; i < bits.length; i++) {
        if (bits[i] === bits[i - 1]) {
            count++;
            res.push(bits[i]);
            if (count === 5) {
                let stuff = bits[i] ^ 1;
                res.push(stuff);
                stuffIndices.push(res.length - 1);
                count = 0; // Reset to 0 after stuffing
            }
        } else {
            count = 1;
            res.push(bits[i]);
        }
    }
    return [res, stuffIndices];
}

// Render a labeled bit field as HTML
function renderBitField(label, bits, stuffIndices = [], dominantBit = 0, flip = false) {
    let html = `<span class="field-label">${label}:</span><div class="bit-field">`;
    for (let i = 0; i < bits.length; i++) {
        let val = bits[i];
        let displayBit = flip ? (val ^ 1) : val;
        let cls = (displayBit == dominantBit) ? "bit dominant" : "bit recessive";
        if (stuffIndices.includes(i)) cls += " stuff";
        html += `<span class="${cls}">${displayBit}</span>`;
    }
    html += "</div>";
    return html;
}

// Generate CAN frame and its visualization
function generateCANFrame(canId, dlc, dataBytes, flip, rtr) {
    const startBit = [0];
    const idBits = numberToBits(canId, 11);
    const rtrBit = [rtr ? 1 : 0];
    const ideBit = [0], r0Bit = [0];
    const dlcBits = numberToBits(dlc, 4);

    // Data: each byte = 8 bits
    let dataBits = [];
    for (const b of dataBytes) {
        dataBits = dataBits.concat(numberToBits(b, 8));
    }

    // Fields for CRC calculation (start to end of data)
    let crcInput = [].concat(
        startBit,
        idBits, rtrBit,
        ideBit, r0Bit, dlcBits,
        dataBits
    );

    // Add stuffing
    let [stuffedBits, stuffIndices] = stuffBits(crcInput);

    // CRC-15 (external function, assumed provided)
    let crcBits = calcCANCRC15(stuffedBits);

    // CRC delimiter, ACK slot & delimiter, EOF
    const crcDelim = [1];
    const ackSlot = [1], ackDelim = [1];
    const eof = Array(7).fill(1);

    // Calculate field ranges after stuffing
    let fieldEnds = {
        "Start bit": 1,
        "Arbitration (ID+RTR)": 1 + 11 + 1,
        "Control (IDE+r0+DLC)": 1 + 11 + 1 + 1 + 1 + 4,
        "Data": 1 + 11 + 1 + 1 + 1 + 4 + (8 * dlc),
    };

    function inRange(idx, start, end) { return idx >= start && idx < end; }
    let fieldRanges = [], prev = 0;
    for (let [label, end] of Object.entries(fieldEnds)) {
        let [stuffed] = stuffBits(crcInput.slice(0, end));
        let rangeEnd = stuffed.length;
        fieldRanges.push([label, prev === 0 ? 0 : fieldRanges[fieldRanges.length - 1][2], rangeEnd]);
        prev = end;
    }

    // Generate HTML per field
    let html = '';
    for (let [label, from, to] of fieldRanges) {
        let fieldStuffIndices = stuffIndices
            .filter(idx => idx >= from && idx < to)
            .map(idx => idx - from);
        let fieldBits = stuffedBits.slice(from, to);
        if (fieldBits.length === 0) continue;
        html += renderBitField(label, fieldBits, fieldStuffIndices, 0, flip);
    }
    html += renderBitField('CRC (15 bits)', crcBits, [], 0, flip);
    html += renderBitField('CRC Delimiter', crcDelim, [], 0, flip);
    html += renderBitField('ACK + Delimiter', ackSlot.concat(ackDelim), [], 0, flip);
    html += renderBitField('End of Frame', eof, [], 0, flip);

    // Bit pattern output
    let bitArray = [].concat(stuffedBits, crcBits, crcDelim, ackSlot, eof);
    const bitPatternString = bitArray.join('');
    document.getElementById('bit-pattern-count').textContent = `(${bitArray.length} bits)`;
    document.getElementById('bit-pattern-stream').value = bitPatternString;

    return html;
}

// Input: uppercase enforced for all text fields
document.querySelectorAll('input[type="text"]').forEach(input => {
    input.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
});

// Data field formatting: hex, spaced every 2 digits
document.getElementById('data').addEventListener('input', function() {
    let clean = this.value.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
    let spaced = clean.replace(/(.{2})/g, '$1 ').trim();
    if (this.value !== spaced) {
        this.value = spaced;
    }
});

// Generate button: assemble and display CAN frame
document.getElementById('generate-btn').addEventListener('click', function() {
    try {
        let canIdFormat = document.querySelector('input[name="can-id-format"]:checked').value;
        let canIdRaw = document.getElementById('can-id').value.trim();
        let canId = canIdFormat === 'hex'
            ? parseInt(canIdRaw, 16)
            : parseInt(canIdRaw, 10);
        let dlc = parseInt(document.getElementById('dlc').value, 10);
        let dataStr = document.getElementById('data').value;
        let flip = document.getElementById('flip-bits').checked;
        let rtr = document.getElementById('rtr-checkbox').checked;

        if (isNaN(canId) || canId < 0 || canId > 0x7FF)
            throw new Error("CAN ID must be 0..2047 or 0..0x7FF (11 bits).");
        if (isNaN(dlc) || dlc < 0 || dlc > 8)
            throw new Error("DLC must be between 0 and 8.");

        let dataBytes = parseHexData(dataStr, dlc);

        let html = generateCANFrame(canId, dlc, dataBytes, flip, rtr);
        document.getElementById('bit-pattern-output').innerHTML = html;
    } catch (e) {
        document.getElementById('bit-pattern-output').innerHTML =
            `<div style="color:red;font-weight:bold;">Error: ${e.message}</div>`;
    }
});