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
            const asciiContent = await generateAscii(parsedData);
            downloadAsciiFile(asciiContent);
        } catch (error) {
            showAlert(`Invalid JSON format: ${error.message}`);
        }
    });
});

// פונקציה ליצירת תוכן ה-ASCII באופן גנרי
async function generateAscii(data) {
    let asciiContent = "/* :INFILE = 'C:\\tmp\\INFILE.txt'; */\n";
    asciiContent += `SELECT '{' FROM DUMMY ASCII UNICODE :infile;\n`;
    asciiContent += parseJsonToAscii(data);
    asciiContent += `SELECT '}' FROM DUMMY ASCII UNICODE :infile;\n`;
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

function parseJsonToAscii(data, isFirst = false) {
    let content = '';

    if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);

        keys.forEach((key, index) => {
            const upperKey = key.toUpperCase();
            const value = data[key];
            const isLast = index === keys.length - 1;

            if (typeof value === 'object' && !Array.isArray(value)) {
                // עבור אובייקטים פנימיים
                content += `SELECT '"${upperKey}":' FROM DUMMY ASCII UNICODE :infile;\n`;
                content += `SELECT '{' FROM DUMMY ASCII UNICODE :infile;\n`;
                content += parseJsonToAscii(value);
                content += `SELECT '}' FROM DUMMY ASCII UNICODE :infile;\n`;
            } else if (Array.isArray(value)) {
                // עבור מערכים
                content += `SELECT '"${upperKey}":' FROM DUMMY ASCII UNICODE :infile;\n`;
                content += `SELECT '[' FROM DUMMY ASCII UNICODE :infile;\n`;
                value.forEach(item => {
                    content += `SELECT '{' FROM DUMMY ASCII UNICODE :infile;\n`;
                    content += parseJsonToAscii(item);
                    content += `SELECT '}' FROM DUMMY ASCII UNICODE :infile;\n`;
                });
                content += `SELECT ']' FROM DUMMY ASCII UNICODE :infile;\n`;
            } else {
                // עבור ערכים פשוטים
                content += createAsciiLine(upperKey, value, !isLast);
            }
        });
    }
    return content;
}

function createAsciiLine(key, value, hasComma = true) {
    return `SELECT '"${key}": "', '${value}'${hasComma ? "',' " : " "}FROM DUMMY ASCII UNICODE :infile;\n`;
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
