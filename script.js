document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const clearButton = document.getElementById('clearButton');
    const downloadAsciiButton = document.getElementById('downloadAscii');
    const downloadXmlButton = document.getElementById('downloadXml');

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
            downloadFile(asciiContent, 'output.ascii');
        } catch (error) {
            alert('Invalid JSON format.');
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
            downloadFile(xmlContent, 'output.xml');
        } catch (error) {
            alert('Invalid JSON format.');
        }
    });
});

function generateAsciiFromJson(data) {
    let content = "/* :INFILE = 'C:\\tmp\\infile.txt'; */\n";
    content += "SELECT '{' FROM DUMMY ASCII UNICODE :infile;\n";
    content += createAsciiContent(data);
    content += "SELECT '} ${isLastItem ? '' : ','}' FROM DUMMY ASCII UNICODE ADDTO :infile;\n";
    return content;
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
    xmlContent += jsonToXml(data);
    return xmlContent;
}

function jsonToXml(obj) {
    let xml = '';
    for (const key in obj) {
        if (Array.isArray(obj[key])) {
            xml += `<${key}>\n`;
            obj[key].forEach(item => {
                xml += `<item>\n${jsonToXml(item)}</item>\n`;
            });
            xml += `</${key}>\n`;
        } else if (typeof obj[key] === 'object') {
            xml += `<${key}>\n${jsonToXml(obj[key])}</${key}>\n`;
        } else {
            xml += `<${key}>${obj[key]}</${key}>\n`;
        }
    }
    return xml;
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
