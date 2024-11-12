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
            downloadFile(asciiContent, 'ascii.txt');
        } catch (error) {
            alert('Invalid JSON format');
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
            alert('Invalid JSON format');
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

function createAsciiContent(data, isLastItem) {
    let content = '';
    const keys = Object.keys(data);
    keys.forEach((key, index) => {
        const value = data[key];
        const isLast = index === keys.length - 1;
        if (Array.isArray(value)) {
            content += `SELECT '"${key}": [' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
            value.forEach((item, idx) => {
                content += `SELECT '{' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                content += createAsciiContent(item);
                content += `SELECT '} ${idx < value.length - 1 ? ',' : ''}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
            });
            content += `SELECT '] ${isLast ? '' : ','}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
        } else if (typeof value === 'object') {
            content += `SELECT '"${key}": {' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
            content += createAsciiContent(value);
            content += `SELECT '} ${isLast ? '' : ','}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
        } else {
            content += `SELECT STRCAT('"${key}":"', :${key}, '"${isLast ? '' : ','}') FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
        }
    });
    return content;
}

function generateXmlFromJson(data) {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += createXmlContent(data);
    return xmlContent;
}

function createXmlContent(data) {
    let content = '';
    for (const key in data) {
        const value = data[key];
        if (Array.isArray(value)) {
            value.forEach(item => {
                content += `<${key}>${createXmlContent(item)}</${key}>\n`;
            });
        } else if (typeof value === 'object') {
            content += `<${key}>${createXmlContent(value)}</${key}>\n`;
        } else {
            content += `<${key}>${value}</${key}>\n`;
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
    a.click();
    URL.revokeObjectURL(url);
}