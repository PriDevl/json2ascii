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

async function generateAscii(data) {
    let asciiContent = "/* :INFILE = 'C:\\tmp\\INFILE.txt'; */\n";
    asciiContent += `SELECT '{' FROM DUMMY ASCII :infile;\n`;
    asciiContent += processJson(data);
    asciiContent += `SELECT '}' FROM DUMMY ASCII :infile;\n`;
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

function processJson(data, isRoot = true) {
    let content = '';
    const keys = Object.keys(data);

    keys.forEach((key, index) => {
        const value = data[key];
        const hasComma = index < keys.length - 1;

        if (typeof value === 'object' && !Array.isArray(value)) {
            content += `SELECT '"${key}": {' FROM DUMMY ASCII ADDTO :infile;\n`;
            content += processJson(value, false);
            content += `SELECT '}' FROM DUMMY ASCII ADDTO :infile${hasComma ? ',' : ''};\n`;
        } else if (Array.isArray(value)) {
            content += `SELECT '"${key}": [' FROM DUMMY ASCII ADDTO :infile;\n`;
            value.forEach((item, idx) => {
                content += `SELECT '{' FROM DUMMY ASCII ADDTO :infile;\n`;
                content += processJson(item, false);
                content += `SELECT '}' FROM DUMMY ASCII ADDTO :infile${idx < value.length - 1 ? ',' : ''};\n`;
            });
            content += `SELECT ']' FROM DUMMY ASCII ADDTO :infile${hasComma ? ',' : ''};\n`;
        } else {
            content += createAsciiLine(key, value, hasComma);
        }
    });

    return content;
}

function createAsciiLine(key, value, hasComma) {
    if (typeof value === 'string' || typeof value === 'number') {
        return `SELECT STRCAT('"${key}":"', :${key}, '"${hasComma ? ',' : ''}') FROM DUMMY ASCII ADDTO :infile;\n`;
    }
    return '';
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
