document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const clearButton = document.getElementById('clearButton');
    const downloadButton = document.getElementById('downloadButton');

    clearButton.addEventListener('click', () => {
        jsonInput.value = '';
    });

    downloadButton.addEventListener('click', () => {
        const jsonData = jsonInput.value.trim();

        if (!jsonData) {
            alert('Please paste your JSON response first.');
            return;
        }

        try {
            const parsedData = JSON.parse(jsonData);
            const asciiContent = generateAsciiFromJson(parsedData);
            downloadAsciiFile(asciiContent);
        } catch (error) {
            alert(`Invalid JSON format. Error: ${error.message}`);
        }
    });
});

// פונקציה ליצירת תוכן ה-ASCII עם טיפול בהתחברות שורות
function generateAsciiFromJson(data, indent = 0, isFirstLine = true) {
    let asciiContent = '';

    if (isFirstLine) {
        asciiContent += "/* :INFILE = 'C:\\tmp\\INFILE.txt'; */\n";
        isFirstLine = false;
        asciiContent += `SELECT '{' FROM DUMMY TABS ASCII :INFILE;\n`;
    } else {
        asciiContent += `SELECT '{' FROM DUMMY TABS ADDTO ASCII :INFILE;\n`;
    }

    if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);

        keys.forEach((key, index) => {
            const upperKey = key.toUpperCase();
            const value = data[key];

            if (typeof value === 'object' && !Array.isArray(value)) {
                asciiContent += `SELECT '"${upperKey}":' FROM DUMMY TABS ADDTO ASCII :INFILE;\n`;
                asciiContent += generateAsciiFromJson(value, indent + 2, false);
            } else if (Array.isArray(value)) {
                asciiContent += `SELECT '"${upperKey}":' FROM DUMMY TABS ADDTO ASCII :INFILE;\n`;
                value.forEach(item => {
                    asciiContent += generateAsciiFromJson(item, indent + 2, false);
                });
            } else {
                let line = `SELECT '"${upperKey}": "':${upperKey}"'`;
                if (index < keys.length - 1) {
                    line += "','";
                }
                line += ` FROM DUMMY TABS ADDTO ASCII :INFILE;\n`;
                asciiContent += line;
            }
        });
        asciiContent += `SELECT '}' FROM DUMMY TABS ADDTO ASCII :INFILE;\n`;
    } else if (Array.isArray(data)) {
        data.forEach(item => {
            asciiContent += generateAsciiFromJson(item, indent, false);
        });
    }

    // טיפול בהתחברות שורות
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

// פונקציה להורדת הקובץ
function downloadAsciiFile(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asciifile.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
