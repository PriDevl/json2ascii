document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const clearButton = document.getElementById('clearButton');
    const downloadAsciiButton = document.getElementById('downloadAsciiButton');
    const downloadXmlButton = document.getElementById('downloadXmlButton');

    clearButton.addEventListener('click', () => {
        jsonInput.value = '';
    });

    downloadAsciiButton.addEventListener('click', () => {
        const jsonData = jsonInput.value.trim();
        if (!jsonData) {
            showAlert('Please paste your JSON data first.');
            return;
        }

        try {
            const parsedData = JSON.parse(jsonData);
            const asciiContent = generateAsciiFromJson(parsedData);
            downloadFile(asciiContent, 'asciifile.txt');
        } catch (error) {
            showAlert(`Invalid JSON format: ${error.message}`);
        }
    });

    downloadXmlButton.addEventListener('click', () => {
        const jsonData = jsonInput.value.trim();
        if (!jsonData) {
            showAlert('Please paste your JSON data first.');
            return;
        }

        try {
            const parsedData = JSON.parse(jsonData);
            const xmlContent = generateXmlFromJson(parsedData);
            downloadFile(xmlContent, 'data.xml');
        } catch (error) {
            showAlert(`Invalid JSON format: ${error.message}`);
        }
    });
});

// פונקציה ליצירת תוכן ה-ASCII
function generateAsciiFromJson(data) {
    let asciiContent = "/*:infile = 'C:/tmp/infile.txt';*/\n";
    asciiContent += `SELECT '{' FROM DUMMY ASCII :infile;\n`;
    asciiContent += createAsciiContent(data);
    asciiContent += `SELECT '}' FROM DUMMY ASCII ADDTO :infile;\n`;
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

function createAsciiContent(data) {
    let content = '';
    if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        keys.forEach((key, index) => {
            const upperKey = key.toUpperCase();
            const value = data[key];
            const isLastItem = index === keys.length - 1;

            if (typeof value === 'object' && !Array.isArray(value)) {
                content += `SELECT '"${upperKey}": {' FROM DUMMY ASCII ADDTO :infile;\n`;
                content += createAsciiContent(value);
                content += `SELECT '}${isLastItem ? '' : ','}' FROM DUMMY ASCII ADDTO :infile;\n`;
            } else if (Array.isArray(value)) {
                content += `SELECT '"${upperKey}": [' FROM DUMMY ASCII ADDTO :infile;\n`;
                value.forEach((item, idx) => {
                    content += `SELECT '{' FROM DUMMY ASCII ADDTO :infile;\n`;
                    content += createAsciiContent(item);
                    content += `SELECT '}${idx < value.length - 1 ? ',' : ''}' FROM DUMMY ASCII ADDTO :infile;\n`;
                });
                content += `SELECT ']${isLastItem ? '' : ','}' FROM DUMMY ASCII ADDTO :infile;\n`;
            } else {
                content += `SELECT STRCAT('"${upperKey}":"', :${upperKey}, '"${!isLastItem ? ',' : ''}') FROM DUMMY ASCII ADDTO :infile;\n`;
            }
        });
    }
    return content;
}

// פונקציה ליצירת תוכן ה-XML
function generateXmlFromJson(data) {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += createXmlContent(data);
    return xmlContent;
}

function createXmlContent(data, indent = '') {
    let content = '';
    if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        keys.forEach(key => {
            const value = data[key];
            if (typeof value === 'object' && !Array.isArray(value)) {
                content += `${indent}<${key}>\n`;
                content += createXmlContent(value, indent + '  ');
                content += `${indent}</${key}>\n`;
            } else if (Array.isArray(value)) {
                content += `${indent}<${key}>\n`;
                value.forEach(item => {
                    content += `${indent}  <item>\n`;
                    content += createXmlContent(item, indent + '    ');
                    content += `${indent}  </item>\n`;
                });
                content += `${indent}</${key}>\n`;
            } else {
                content += `${indent}<${key}>${value}</${key}>\n`;
            }
        });
    }
    return content;
}

// פונקציה להורדת קובץ
function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// פונקציה להצגת הודעת שגיאה
function showAlert(message) {
    alert(message);
}
