function toBinaryStr(num, length) {
    return num.toString(2).padStart(length, '0');
}

function hexStringToBytes(str) {
    // Accepts hex values separated by space, comma, or nothing
    str = str.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    if (!str) return [];
    return str.split(' ').map(x => parseInt(x, 16));
}

function crc15(dataBits) {
    // Standard CRC-15 for CAN
    let poly = 0x4599; // x^15 + x^14 + x^10 + x^8 + x^7 + x^4 + x^3 + 1
    let crc = 0;
    for (let bit of dataBits) {
        let c15 = ((crc >> 14) & 1) ^ bit;
        crc = ((crc << 1) & 0x7fff);
        if (c15) crc ^= poly;
    }
    return crc;
}

// Converts an array of bytes to a string of bits
function bytesToBits(bytes) {
    return bytes.map(b => toBinaryStr(b, 8)).join('');
}

function parseCANID(input) {
    input = input.trim();
    if (/^0x/i.test(input)) return parseInt(input, 16);
    if (/^[0-9a-fA-F]+$/.test(input)) {
        // Guess hex if all are in 0-9a-f
        if (input.length > 3) return parseInt(input, 16);
        else return parseInt(input, 10);
    }
    return parseInt(input, 10);
}

function getBitFields(id, dlc, dataBytes) {
    // CAN 2.0A (standard frame)
    // Start(1), Arbitration(ID[11]+RTR[1]), Control(IDE[1]+r0[1]+DLC[4]), Data, CRC(15), CRC Delimiter(1), ACK(1), ACK Delim(1), EOF(7)
    let fields = [];

    // 1. Start of Frame
    fields.push({label: "Start of Frame", bits: "0"});

    // 2. Arbitration Field
    let idBits = toBinaryStr(id, 11);
    let rtr = "0"; // Data frame
    fields.push({
        label: "Arbitration Field",
        bits: idBits + rtr,
        details: [
            {label: "Identifier", bits: idBits},
            {label: "RTR", bits: rtr}
        ]
    });

    // 3. Control Field
    let ide = "0"; // Standard frame
    let r0 = "0";  // Reserved
    let dlcBits = toBinaryStr(dlc, 4);
    fields.push({
        label: "Control Field",
        bits: ide + r0 + dlcBits,
        details: [
            {label: "IDE", bits: ide},
            {label: "r0", bits: r0},
            {label: "DLC", bits: dlcBits}
        ]
    });

    // 4. Data Field
    let dataBits = bytesToBits(dataBytes.slice(0, dlc));
    fields.push({
        label: "Data Field",
        bits: dataBits ? dataBits : "(none)"
    });

    // 5. CRC Field (calculated over fields up to Data)
    // Build bit array for CRC: Start + Arbitration + Control + Data
    let crcInputBits = [];
    crcInputBits.push(0); // Start of Frame
    for (let b of idBits) crcInputBits.push(Number(b));
    crcInputBits.push(0); // RTR
    crcInputBits.push(0); // IDE
    crcInputBits.push(0); // r0
    for (let b of dlcBits) crcInputBits.push(Number(b));
    for (let b of dataBits) crcInputBits.push(Number(b));
    let crcVal = crc15(crcInputBits);
    let crcBits = toBinaryStr(crcVal, 15);
    fields.push({
        label: "CRC Field",
        bits: crcBits
    });

    // 6. CRC Delimiter
    fields.push({label: "CRC Delimiter", bits: "1"});

    // 7. ACK Slot
    fields.push({label: "ACK Slot", bits: "1"});

    // 8. ACK Delimiter
    fields.push({label: "ACK Delimiter", bits: "1"});

    // 9. End of Frame (EOF)
    fields.push({label: "End of Frame", bits: "1111111"});

    return fields;
}

function renderBitFields(fields) {
    let html = '';
    for (let field of fields) {
        html += `<div class="bit-field"><span class="bit-label">${field.label}:</span> <span class="bit-bits">${field.bits}</span>`;
        if (field.details) {
            html += `<div style="margin-left:20px;">`;
            for (let d of field.details) {
                html += `<div><span class="bit-label">${d.label}:</span> <span class="bit-bits">${d.bits}</span></div>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
    }
    return html;
}

document.getElementById('generate-btn').addEventListener('click', function() {
    // Clear previous output
    document.getElementById('bit-pattern-output').innerHTML = "";

    // Get and validate inputs
    const idStr = document.getElementById('can-id').value.trim();
    const dlc = parseInt(document.getElementById('dlc').value, 10);
    const dataStr = document.getElementById('data').value.trim();

    // CAN-ID
    let canid = parseCANID(idStr);
    if (isNaN(canid) || canid < 0 || canid > 0x7FF) {
        document.getElementById('bit-pattern-output').innerHTML = "<span style='color:red;'>Invalid CAN-ID. Enter a value between 0 and 0x7FF (11 bits).</span>";
        return;
    }

    // DLC
    if (isNaN(dlc) || dlc < 0 || dlc > 8) {
        document.getElementById('bit-pattern-output').innerHTML = "<span style='color:red;'>Invalid DLC. Enter a value between 0 and 8.</span>";
        return;
    }

    // Data
    let dataBytes = hexStringToBytes(dataStr);
    if (dataBytes.length < dlc) {
        document.getElementById('bit-pattern-output').innerHTML = "<span style='color:red;'>Not enough data bytes for DLC.</span>";
        return;
    }
    if (dataBytes.find(b => isNaN(b) || b < 0 || b > 0xFF)) {
        document.getElementById('bit-pattern-output').innerHTML = "<span style='color:red;'>Invalid data bytes. Enter hex values 00-FF.</span>";
        return;
    }

    // Generate bit fields
    let fields = getBitFields(canid, dlc, dataBytes);
    document.getElementById('bit-pattern-output').innerHTML = renderBitFields(fields);
});
