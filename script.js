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
            const asciiContent = await generateAsciiFromJson(parsedData);
            downloadAsciiFile(asciiContent);
        } catch (error) {
            alert(`Invalid JSON format: ${error.message}`);
        }
    });
});

// פונקציה ליצירת תוכן ה-ASCII
async function generateAsciiFromJson(data) {
    let asciiContent = "/* :INFILE = 'C:\\tmp\\INFILE.txt'; */\n";
    asciiContent += createAsciiContent(data);
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

function createAsciiContent(data, isFirst = true) {
    let content = isFirst ? `SELECT '{' FROM DUMMY ASCII :infile;\n` : `SELECT '{' FROM DUMMY ASCII ADDTO :infile;\n`;

    if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        keys.forEach((key, index) => {
            const upperKey = key.toUpperCase();
            const value = data[key];

            if (typeof value === 'object' && !Array.isArray(value)) {
                content += `SELECT '"${upperKey}": {' FROM DUMMY ASCII ADDTO :infile;\n`;
                content += createAsciiContent(value, false);
                content += `SELECT '}' FROM DUMMY ASCII ADDTO :infile;\n`;
            } else if (Array.isArray(value)) {
                content += `SELECT '"${upperKey}": [' FROM DUMMY ASCII ADDTO :infile;\n`;
                value.forEach((item, idx) => {
                    content += `SELECT '{' FROM DUMMY ASCII ADDTO :infile;\n`;
                    content += createAsciiContent(item, false);
                    content += `SELECT '}' FROM DUMMY ASCII ADDTO :infile${idx < value.length - 1 ? ',' : ''};\n`;
                });
                content += `SELECT ']' FROM DUMMY ASCII ADDTO :infile;\n`;
            } else {
                content += createLine(upperKey, value, index < keys.length - 1);
            }
        });
    }
    return content;
}

function createLine(key, value, hasComma) {
    return `SELECT STRCAT('"${key}":"', :${key}, '"${hasComma ? ',' : ''}') FROM DUMMY ASCII ADDTO :infile;\n`;
}

function downloadAsciiFile(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asciifile.txt';
    a.click();
    URL.revokeObjectURL(url);
}
