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

// פונקציה גנרית ליצירת תוכן ה-ASCII
async function generateAscii(data) {
    let asciiContent = "/* :INFILE = 'C:\\tmp\\INFILE.txt'; */\n";
    asciiContent += `SELECT '{' FROM DUMMY ASCII :infile;\n`;
    asciiContent += createAsciiContent(data);
    asciiContent += `SELECT '}' FROM DUMMY ASCII ADDTO :infile;\n`;
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

function createAsciiContent(data) {
    let content = '';

    // התחלת מבנה ה-Data
    content += `SELECT '"Data": {' FROM DUMMY ASCII ADDTO :infile;\n`;

    // עיבוד כל פרמטר ב-JSON
    Object.keys(data).forEach((key, index) => {
        const upperKey = key.toUpperCase();
        const value = data[key];

        if (typeof value === 'object' && !Array.isArray(value)) {
            content += `SELECT '"${upperKey}": {' FROM DUMMY ASCII ADDTO :infile;\n`;
            content += createAsciiContent(value);
            content += `SELECT '}' FROM DUMMY ASCII ADDTO :infile;\n`;
        } else if (Array.isArray(value)) {
            content += `SELECT '"${upperKey}": [' FROM DUMMY ASCII ADDTO :infile;\n`;
            value.forEach(item => {
                content += `SELECT '{' FROM DUMMY ASCII ADDTO :infile;\n`;
                content += createAsciiContent(item);
                content += `SELECT '}' FROM DUMMY ASCII ADDTO :infile;\n`;
            });
            content += `SELECT '],' FROM DUMMY ASCII ADDTO :infile;\n`;
        } else {
            content += createLine(upperKey, value, index < Object.keys(data).length - 1);
        }
    });

    return content;
}

// פונקציה ליצירת שורות עבור ערכים פשוטים
function createLine(key, value, hasComma) {
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
