document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const clearButton = document.getElementById('clearButton');
    const downloadButton = document.getElementById('downloadButton');

    clearButton.addEventListener('click', () => {
        jsonInput.value = '';
    });

    downloadButton.addEventListener('click', async () => {
        const jsonData = jsonInput.value.trim();
        if (!jsonData) {
            alert('Please paste your JSON data first.');
            return;
        }

        try {
            const parsedData = JSON.parse(jsonData);
            const asciiContent = await generateAscii(parsedData);
            downloadAsciiFile(asciiContent);
        } catch (error) {
            alert(`Invalid JSON format: ${error.message}`);
        }
    });
});

// פונקציה ליצירת תוכן ה-ASCII בצורה גנרית
async function generateAscii(data) {
    let asciiContent = "/* :INFILE = 'C:\\tmp\\INFILE.txt'; */\n";
    asciiContent += `SELECT '{' FROM DUMMY ASCII :infile;\n`;
    asciiContent += processJson(data);
    asciiContent += `SELECT '}' FROM DUMMY ASCII ADDTO :infile;\n`;
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

function processJson(data, keyPrefix = '') {
    let content = '';

    // עיבוד לפי סוג הנתונים
    if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        keys.forEach((key, index) => {
            const fullKey = keyPrefix ? `${keyPrefix}_${key}` : key;
            const value = data[key];

            if (typeof value === 'object' && !Array.isArray(value)) {
                content += `SELECT '"${key.toUpperCase()}": {' FROM DUMMY ASCII ADDTO :infile;\n`;
                content += processJson(value, fullKey);
                content += `SELECT '}' FROM DUMMY ASCII ADDTO :infile;\n`;
            } else if (Array.isArray(value)) {
                content += `SELECT '"${key.toUpperCase()}": [' FROM DUMMY ASCII ADDTO :infile;\n`;
                value.forEach((item) => {
                    content += `SELECT '{' FROM DUMMY ASCII ADDTO :infile;\n`;
                    content += processJson(item, fullKey);
                    content += `SELECT '}' FROM DUMMY ASCII ADDTO :infile;\n`;
                });
                content += `SELECT '],' FROM DUMMY ASCII ADDTO :infile;\n`;
            } else {
                content += createAsciiLine(fullKey.toUpperCase(), value, index < keys.length - 1);
            }
        });
    }
    return content;
}

// פונקציה ליצירת שורה ב-ASCII
function createAsciiLine(key, value, hasComma) {
    return `SELECT STRCAT('"${key}":"', :${key}, '"${hasComma ? ',' : ''}"') FROM DUMMY ASCII ADDTO :infile;\n`;
}

// פונקציה להורדת הקובץ
function downloadAsciiFile(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asciifile.txt';
    a.click();
    URL.revokeObjectURL(url);
}
