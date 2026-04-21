
import fs from 'fs';
try {
    const raw = fs.readFileSync('final_result.txt', 'utf16le');
    const jsonStart = raw.indexOf('{');
    const jsonStr = raw.substring(jsonStart);
    const data = JSON.parse(jsonStr);
    console.log('--- TRACES ---');
    data.traces.forEach(t => console.log(t));
    console.log('--- ERROR ---');
    console.log(data.details);
    console.log('--- STACK ---');
    console.log(data.stack);
} catch (err) {
    console.error('Extraction failed:', err.message);
}
