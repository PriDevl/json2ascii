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
            alert('Please paste your JSON data first.');
            return;
        }
        try {
            const parsedData = JSON.parse(jsonData);
            const asciiContent = generateAsciiFromJson(parsedData);
            downloadFile(asciiContent, 'asciifile.txt');
        } catch (error) {
            alert(`Invalid JSON format: ${error.message}`);
        }
    });

    downloadXmlButton.addEventListener('click', () => {
        const jsonData = jsonInput.value.trim();
        if (!jsonData) {
            alert('Please paste your JSON data first.');
            return;
        }
        try {
            const parsedData = JSON.parse(jsonData);
            const xmlContent = generateXmlFromJson(parsedData);
            downloadFile(xmlContent, 'data.xml');
        } catch (error) {
            alert(`Invalid JSON format: ${error.message}`);
        }
    });
});

function generateAsciiFromJson(data) {
    let asciiContent = "/* :INFILE = 'C:\\tmp\\infile.txt'; */\n";
    asciiContent += `SELECT '{' FROM DUMMY ASCII UNICODE :infile;\n`;
    asciiContent += createAsciiContent(data, true);
    asciiContent += `SELECT '} ${isLastItem()}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
    return asciiContent;
}

function createAsciiContent(data, isFirst) {
    let content = '';
    if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        keys.forEach((key, index) => {
            const value = data[key];
            const isLastItem = index === keys.length - 1;

            if (typeof value === 'object' && !Array.isArray(value)) {
                content += `SELECT '"${key}": {' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                content += createAsciiContent(value);
                content += `SELECT '} ${isLastItem ? '' : ','}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
            } else if (Array.isArray(value)) {
                content += `SELECT '"${key}": [' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                value.forEach((item, idx) => {
                    content += `SELECT '{' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                    content += createAsciiContent(item);
                    content += `SELECT '} ${idx < value.length - 1 ? ',' : ''}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                });
                content += `SELECT '] ${isLastItem ? '' : ','}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
            } else {
                content += `SELECT STRCAT('"${key}":"', :${key}, '"${isLastItem ? '' : ','}') FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
            }
        });
    }
    return content;
}

function generateXmlFromJson(data) {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += createXmlContent(data);
    return xmlContent;
}

function createXmlContent(data, indent = '') {
    let content = '';
    for (const key in data) {
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
    }
    return content;
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}