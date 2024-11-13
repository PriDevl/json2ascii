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
            downloadFile(xmlContent, 'xmlfile.xml');
        } catch (error) {
            alert(`Invalid JSON format: ${error.message}`);
        }
    });
});

function generateAsciiFromJson(data) {
    let asciiContent = generateVariableDefinitions(data);
    asciiContent += "/*:infile = 'C:/tmp/infile.txt';*/\n";
    asciiContent += `SELECT '{' FROM DUMMY ASCII UNICODE :infile;\n`;
    asciiContent += createAsciiContent(data, true);
    asciiContent += `SELECT '} ' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
    return asciiContent;
}

function generateVariableDefinitions(data) {
    let variableDefinitions = '';
    const keys = Object.keys(data);
    keys.forEach(key => {
        const value = data[key];
        if (typeof value === 'string') {
            variableDefinitions += `:${key} = '';\n`;
        } else if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                variableDefinitions += `:${key} = 0;\n`;
            } else {
                variableDefinitions += `:${key} = 0.0;\n`;
            }
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            variableDefinitions += generateVariableDefinitions(value);
        } else if (Array.isArray(value)) {
            value.forEach(item => {
                variableDefinitions += generateVariableDefinitions(item);
            });
        }
    });
    return variableDefinitions;
}

function createAsciiContent(data, isLastItem = false) {
    let content = '';
    if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        keys.forEach((key, index) => {
            const value = data[key];
            const isLast = index === keys.length - 1;

            if (typeof value === 'object' && !Array.isArray(value)) {
                content += `SELECT '"${key}": {' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                content += createAsciiContent(value);
                content += `SELECT '} ${isLast ? '' : ','}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
            } else if (Array.isArray(value)) {
                content += `SELECT '"${key}": [' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                value.forEach((item, idx) => {
                    content += `SELECT '{' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                    content += createAsciiContent(item);
                    content += `SELECT '} ${idx < value.length - 1 ? ',' : ''}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                });
                content += `SELECT '] ${isLast ? '' : ','}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
            } else {
                content += createLine(key, value, isLast);
            }
        });
    }
    return content;
}

function createLine(key, value, isLastItem) {
    if (typeof value === 'number') {
        return `SELECT STRCAT('"${key}":', :${key}, '${isLastItem ? '' : ','}') FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
    } else {
        return `SELECT STRCAT('"${key}":"', :${key}, '"${isLastItem ? '' : ','}') FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
    }
}

function downloadFile(content, fileName) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

function generateXmlFromJson(data, indent = '') {
    let xmlContent = '';
    for (const key in data) {
        if (Array.isArray(data[key])) {
            data[key].forEach(item => {
                xmlContent += `${indent}<${key}>\n`;
                xmlContent += generateXmlFromJson(item, indent + '  ');
                xmlContent += `${indent}</${key}>\n`;
            });
        } else if (typeof data[key] === 'object') {
            xmlContent += `${indent}<${key}>\n`;
            xmlContent += generateXmlFromJson(data[key], indent + '  ');
            xmlContent += `${indent}</${key}>\n`;
        } else {
            xmlContent += `${indent}<${key}>${data[key]}</${key}>\n`;
        }
    }
    return xmlContent;
}