// CAN Bit Pattern Generator
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('can-form');
    const input = document.getElementById('bit-sequence');
    const canvas = document.getElementById('pattern-canvas');
    const ctx = canvas.getContext('2d');
    const errorDiv = document.getElementById('pattern-error');

    function validateSequence(seq) {
        return /^[01]+$/.test(seq);
    }

    function drawCANPattern(bitSeq) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Canvas parameters
        const margin = 32;
        const height = canvas.height - 2 * margin;
        const width = canvas.width - 2 * margin;
        const bitCount = bitSeq.length;
        const bitWidth = width / (bitCount || 1);
        const y0 = margin + height * 0.25;
        const y1 = margin + height * 0.75;

        // Draw axis
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin, y0);
        ctx.lineTo(canvas.width - margin, y0);
        ctx.moveTo(margin, y1);
        ctx.lineTo(canvas.width - margin, y1);
        ctx.stroke();

        // Draw bits as Non-Return-to-Zero (NRZ) waveform
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.beginPath();

        let x = margin;
        let prevY = bitSeq[0] === '1' ? y0 : y1;
        ctx.moveTo(x, prevY);

        for (let i = 0; i < bitCount; i++) {
            const y = bitSeq[i] === '1' ? y0 : y1;

            // Vertical if bit changes
            if (i > 0 && bitSeq[i] !== bitSeq[i - 1]) {
                ctx.lineTo(x, y);
            }
            // Horizontal for bit
            ctx.lineTo(x + bitWidth, y);
            x += bitWidth;
        }
        ctx.stroke();

        // Draw bit values
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#111827';
        x = margin + bitWidth / 2;
        for (let i = 0; i < bitCount; i++) {
            ctx.fillText(bitSeq[i], x, y1 + 25);
            x += bitWidth;
        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const seq = input.value.trim();
        errorDiv.textContent = '';

        if (!validateSequence(seq)) {
            errorDiv.textContent = 'Please enter a valid sequence of 0s and 1s only.';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        if (seq.length > 128) {
            errorDiv.textContent = 'Sequence too long (max 128 bits).';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        drawCANPattern(seq);
    });

    // Draw an example on load
    drawCANPattern("11010011");
});
