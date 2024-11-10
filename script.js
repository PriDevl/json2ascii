document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const clearButton = document.getElementById('clearButton');
    const downloadButton = document.getElementById('downloadButton');

    // כפתור לניקוי התוכן בתיבת הטקסט
    clearButton.addEventListener('click', () => {
        jsonInput.value = '';
    });

    // כפתור להורדת קובץ ה-ASCII
    downloadButton.addEventListener('click', async () => {
        const jsonData = jsonInput.value.trim();
        if (!jsonData) {
            showAlert('Please paste your JSON data first.');
            return;
        }

        try {
            const parsedData = JSON.parse(jsonData);
            const asciiContent = await generateAscii(parsedData);
            downloadAsciiFile(asciiContent);
        } catch (error) {
            showAlert(`Invalid JSON format: ${error.message}`);
        }
    });
});

// פונקציה ליצירת קובץ ה-ASCII
async function generateAscii(data) {
    let asciiContent = "/* :INFILE = 'C:\\tmp\\INFILE.txt'; */\n";
    asciiContent += `SELECT '{' FROM DUMMY ASCII :infile;\n`;
    asciiContent += processJson(data);
    asciiContent += `SELECT '}' FROM DUMMY ASCII :infile;\n`;
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

// פונקציה לעיבוד ה-JSON והפיכתו לתוכן ASCII
function processJson(data) {
    let content = '';
    const keys = Object.keys(data);

    keys.forEach((key, index) => {
        const value = data[key];
        const hasComma = index < keys.length - 1;

        // בדיקה אם הערך הוא אובייקט
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

// פונקציה ליצירת שורה ב-ASCII עבור מפתח וערך
function createAsciiLine(key, value, hasComma) {
    return `SELECT STRCAT('"${key}":"', :${key}, '"${hasComma ? ',' : ''}') FROM DUMMY ASCII ADDTO :infile;\n`;
}

// פונקציה להורדת הקובץ
function downloadAsciiFile(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asciifile.txt';
    a.click();
    URL.revokeObjectURL(url);
}

// פונקציה להצגת הודעות שגיאה
function showAlert(message) {
    alert(message);
}
