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
        if (jsonData) {
            try {
                const parsedData = JSON.parse(jsonData);
                const asciiContent = generateAsciiFromJson(parsedData);
                downloadFile(asciiContent, 'output.ascii');
            } catch (error) {
                alert('Invalid JSON format.');
            }
        } else {
            alert('Please paste your JSON data first.');
        }
    });

    downloadXmlButton.addEventListener('click', () => {
        const jsonData = jsonInput.value.trim();
        if (jsonData) {
            try {
                const parsedData = JSON.parse(jsonData);
                const xmlContent = generateXmlFromJson(parsedData);
                downloadFile(xmlContent, 'output.xml');
            } catch (error) {
                alert('Invalid JSON format.');
            }
        } else {
            alert('Please paste your JSON data first.');
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

function createAsciiContent(data, isFirst = false) {
    let content = '';
    if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        keys.forEach((key, index) => {
            const value = data[key];
            const isLastItem = index === keys.length - 1;

            if (Array.isArray(value)) {
                content += `SELECT '"${key}": [' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                value.forEach((item, idx) => {
                    content += `SELECT '{' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                    content += createAsciiContent(item);
                    content += `SELECT '} ${idx < value.length - 1 ? ',' : ''}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                });
                content += `SELECT '] ${isLastItem ? '' : ','}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
            } else if (typeof value === 'object') {
                content += `SELECT '"${key}": {' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                content += createAsciiContent(value);
                content += `SELECT '} ${isLastItem ? '' : ','}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
            } else {
                content += createLine(key, value, !isLastItem);
            }
        });
    }
    return content;
}

function createLine(key, value, hasComma) {
    return `SELECT STRCAT('"${key}":"', :${key}, '"${hasComma ? ',' : ''}') FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
}

function generateXmlFromJson(data) {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += createXmlContent(data);
    return xmlContent;
}

function createXmlContent(data, tagName = '') {
    let content = '';
    if (typeof data === 'object' && !Array.isArray(data)) {
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (Array.isArray(value)) {
                value.forEach(item => {
                    content += `<${key}>\n`;
                    content += createXmlContent(item);
                    content += `</${key}>\n`;
                });
            } else if (typeof value === 'object') {
                content += `<${key}>\n`;
                content += createXmlContent(value);
                content += `</${key}>\n`;
            } else {
                content += `<${key}>${value}</${key}>\n`;
            }
        });
    }
    return content;
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}