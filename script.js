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
            showAlert('Please paste your JSON data first.');
            return;
        }

        try {
            const parsedData = JSON.parse(jsonData);
            const asciiContent = await generateAsciiFromJson(parsedData);
            downloadAsciiFile(asciiContent);
        } catch (error) {
            showAlert(`Invalid JSON format: ${error.message}`);
        }
    });
});

// פונקציה ליצירת תוכן ה-ASCII בפורמט הנכון
async function generateAsciiFromJson(data) {
    let asciiContent = "/* :INFILE = 'C:\\tmp\\INFILE.txt'; */\n";
    asciiContent += createAsciiContent(data, true);
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

function createAsciiContent(data, isFirst = true) {
    let content = isFirst ? `SELECT '{' FROM DUMMY ASCII UNICODE :INFILE;\n` : `SELECT '{' FROM DUMMY ASCII UNICODE :INFILE;\n`;

    if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        keys.forEach((key, index) => {
            const upperKey = key.toUpperCase();
            const value = data[key];
            const isLast = index === keys.length - 1;

            if (typeof value === 'object' && !Array.isArray(value)) {
                content += `SELECT '"${upperKey}":' FROM DUMMY ASCII UNICODE :INFILE;\n`;
                content += createAsciiContent(value, false);
            } else if (Array.isArray(value)) {
                content += `SELECT '"${upperKey}":' FROM DUMMY ASCII UNICODE :INFILE;\n`;
                value.forEach((item) => {
                    content += `SELECT '{' FROM DUMMY ASCII UNICODE :INFILE;\n`;
                    content += createAsciiContent(item, false);
                    content += `SELECT '}' FROM DUMMY ASCII UNICODE :INFILE;\n`;
                });
            } else {
                content += createLine(upperKey, value, !isLast);
            }
        });
        content += `SELECT '}' FROM DUMMY ASCII UNICODE :INFILE;\n`;
    }
    return content;
}

function createLine(key, value, hasComma) {
    return `SELECT '"${key}": "':${key}"'${hasComma ? "',' " : " "}FROM DUMMY ASCII UNICODE :INFILE;\n`;
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

function showAlert(message) {
    alert(message);
}
