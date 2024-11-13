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
            downloadFile(xmlContent, 'xmlfile.xml');
        } catch (error) {
            showAlert(`Invalid JSON format: ${error.message}`);
        }
    });
});

function generateAsciiFromJson(data) {
    let asciiContent = "/* :INFILE = 'C:\\tmp\\infile.txt'; */\n";
    asciiContent += `SELECT '{' FROM DUMMY ASCII UNICODE :infile;\n`;
    asciiContent += createAsciiContent(data);
    asciiContent += `SELECT '} ${isLastItem() ? '' : ','}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
    return asciiContent;
}

function createAsciiContent(data) {
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
    xmlContent += convertJsonToXml(data);
    return xmlContent;
}

function convertJsonToXml(obj, indent = '') {
    let xml = '';
    for (const key in obj) {
        if (Array.isArray(obj[key])) {
            obj[key].forEach(item => {
                xml += `${indent}<${key}>\n`;
                xml += convertJsonToXml(item, indent + '  ');
                xml += `${indent}</${key}>\n`;
            });
        } else if (typeof obj[key] === 'object') {
            xml += `${indent}<${key}>\n`;
            xml += convertJsonToXml(obj[key], indent + '  ');
            xml += `${indent}</${key}>\n`;
        } else {
            xml += `${indent}<${key}>${obj[key]}</${key}>\n`;
        }
    }
    return xml;
}

function downloadFile(content, fileName) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}

function showAlert(message) {
    alert(message);
}

function isLastItem() {
    return false;
}
