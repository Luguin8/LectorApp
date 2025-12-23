const fs = require('fs');
const path = require('path');

const inputPath = 'c:/Remoto/LectorApp/assets/books/libro1.txt';
// Output to a temp file first to verify
const outputPath = 'c:/Remoto/LectorApp/assets/books/libro1_extracted.json';

try {
    const content = fs.readFileSync(inputPath, 'utf8');

    // Finding the array start
    const startMarker = 'const FLORECILLAS_CAPITULOS = [';
    const startIndex = content.indexOf(startMarker);

    if (startIndex === -1) {
        console.error('Could not find start of array');
        process.exit(1);
    }

    const arrayStartIndex = content.indexOf('[', startIndex);
    const arrayEndIndex = content.lastIndexOf(']');

    if (arrayStartIndex === -1 || arrayEndIndex === -1) {
        console.error('Could not find array boundaries');
        process.exit(1);
    }

    // Extract the string
    const arrayString = content.substring(arrayStartIndex, arrayEndIndex + 1);

    // Evaluate safely
    const data = eval(arrayString);

    if (!Array.isArray(data)) {
        console.error('Extracted data is not an array');
        process.exit(1);
    }

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Success extracting data to ' + outputPath);

} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
