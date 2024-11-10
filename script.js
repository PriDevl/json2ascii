async function generateAscii(data) {
    let asciiContent = "/* :INFILE = 'C:\\tmp\\INFILE.txt'; */\n";
    asciiContent += `SELECT '{' FROM DUMMY ASCII :infile;\n`;
    asciiContent += processJson(data);
    asciiContent += `SELECT '}' FROM DUMMY ASCII :infile;\n`;
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

function processJson(data) {
    let content = '';
    const keys = Object.keys(data);

    keys.forEach((key, index) => {
        const value = data[key];
        const hasComma = index < keys.length - 1;

        if (typeof value === 'object' && !Array.isArray(value)) {
            content += `SELECT '"${key}": {' FROM DUMMY ASCII ADDTO :infile;\n`;
            content += processJson(value);
            content += `SELECT '}' FROM DUMMY ASCII ADDTO :infile${hasComma ? ',' : ''};\n`;
        } else if (Array.isArray(value)) {
            content += `SELECT '"${key}": [' FROM DUMMY ASCII ADDTO :infile;\n`;
            value.forEach((item, idx) => {
                content += `SELECT '{' FROM DUMMY ASCII ADDTO :infile;\n`;
                content += processJson(item);
                content += `SELECT '}' FROM DUMMY ASCII ADDTO :infile${idx < value.length - 1 ? ',' : ''};\n`;
            });
            content += `SELECT ']' FROM DUMMY ASCII ADDTO :infile${hasComma ? ',' : ''};\n`;
        } else {
            content += createAsciiLine(key, value, hasComma);
        }
    });

    return content;
}

function createAsciiLine(key, value, hasComma) {
    return `SELECT STRCAT('"${key}":"', :${key}, '"${hasComma ? ',' : ''}') FROM DUMMY ASCII ADDTO :infile;\n`;
}
