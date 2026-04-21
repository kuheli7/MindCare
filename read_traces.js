
import fs from 'fs';
try {
    const raw = fs.readFileSync('final_result.txt', 'utf16le');
    // Find the last { and try to parse it
    const lastBrace = raw.lastIndexOf('{');
    const jsonStr = raw.substring(lastBrace);
    const data = JSON.parse(jsonStr);
    console.log('Details:', data.details);
    console.log('Traces:', data.traces);
} catch (err) {
    console.log('Raw content:', fs.readFileSync('final_result.txt', 'utf16le'));
}
