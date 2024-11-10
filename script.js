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
            const asciiContent = generateAsciiFromJson(parsedData);
            downloadAsciiFile(asciiContent);
        } catch (error) {
            showAlert(`Invalid JSON format: ${error.message}`);
        }
    });
});

// פונקציה ליצירת תוכן ה-ASCII
function generateAsciiFromJson(data) {
    let asciiContent = "/* :infile = 'C:/tmp/infile.txt'; */\n";
    asciiContent += `SELECT '{' FROM DUMMY ASCII :infile;\n`;
    asciiContent += createAsciiContent(data);
    asciiContent += `SELECT '}' FROM DUMMY ASCII ADDTO :infile;\n`;
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

// פונקציה גנרית ליצירת התוכן של ASCII
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
                    const isLastArrayItem = idx === value.length - 1;
                    content += `SELECT '},' FROM DUMMY ASCII ADDTO :infile;\n`;
                    
                    // הוספת פסיק וסוגריים נפרדים לשורות נפרדות
                    if (!isLastArrayItem) {
                        content += `SELECT '{' FROM DUMMY ASCII ADDTO :infile;\n`;
                    }
                });
                content += `SELECT ']' FROM DUMMY ASCII ADDTO :infile;\n`;
            } else {
                content += createLine(upperKey, value, !isLastItem);
            }
        });
    }
    return content;
}

function createLine(key, value, hasComma) {
    return `SELECT STRCAT('"${key}":"', :${key}, '"${hasComma ? ',' : ''}') FROM DUMMY ASCII ADDTO :infile;\n`;
}

// פונקציה להורדת קובץ
function downloadAsciiFile(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asciifile.txt';
    a.click();
    URL.revokeObjectURL(url);
}

// פונקציה להצגת הודעת שגיאה
function showAlert(message) {
    alert(message);
}
