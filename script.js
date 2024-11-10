document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const clearButton = document.getElementById('clearButton');
    const downloadButton = document.getElementById('downloadButton');

    clearButton.addEventListener('click', () => {
        jsonInput.value = '';
    });

    downloadButton.addEventListener('click', () => {
        const jsonData = jsonInput.value.trim();
        if (!jsonData) {
            showAlert('Please paste your JSON data first.');
            return;
        }

        try {
            const parsedData = JSON.parse(jsonData);
            const asciiContent = generateAsciiFromJson(parsedData);
            downloadAsciiFile(asciiContent);
        } catch (error) {
            showAlert(`Invalid JSON format: ${error.message}`);
        }
    });
});

// פונקציה ליצירת תוכן ה-ASCII
function generateAsciiFromJson(data) {
    let asciiContent = "/* :INFILE = 'C:\\tmp\\INFILE.txt'; */\n";
    asciiContent += `SELECT '{' FROM DUMMY ASCII :infile;\n`;
    asciiContent += processObject(data);
    asciiContent += `SELECT '}' FROM DUMMY ASCII :infile;\n`;
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

function processObject(data) {
    let content = '';
    const keys = Object.keys(data);

    keys.forEach((key, index) => {
        const upperKey = key.toUpperCase();
        const value = data[key];
        const isLast = index === keys.length - 1;

        if (typeof value === 'object' && !Array.isArray(value)) {
            content += `SELECT '"${upperKey}": {' FROM DUMMY ASCII ADDTO :infile;\n`;
            content += processObject(value);
            content += `SELECT '}' FROM DUMMY ASCII ADDTO :infile${isLast ? '' : ','};\n`;
        } else if (Array.isArray(value)) {
            content += `SELECT '"${upperKey}": [' FROM DUMMY ASCII ADDTO :infile;\n`;
            value.forEach((item, itemIndex) => {
                content += `SELECT '{' FROM DUMMY ASCII ADDTO :infile;\n`;
                content += processObject(item);
                content += `SELECT '}' FROM DUMMY ASCII ADDTO :infile${itemIndex < value.length - 1 ? ',' : ''};\n`;
            });
            content += `SELECT ']' FROM DUMMY ASCII ADDTO :infile${isLast ? '' : ','};\n`;
        } else {
            content += createAsciiLine(upperKey, value, !isLast);
        }
    });

    return content;
}

function createAsciiLine(key, value, hasComma) {
    return `SELECT STRCAT('"${key}":"', :${key}, '"${hasComma ? ',' : ''}') FROM DUMMY ASCII ADDTO :infile;\n`;
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

function showAlert(message) {
    alert(message);
}
