document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const clearButton = document.getElementById('clearButton');
    const downloadButton = document.getElementById('downloadAsciiButton');

    // ניקוי שדה ה־JSON
    clearButton.addEventListener('click', () => {
        jsonInput.value = '';
    });

    // יצירת קובץ ASCII מתוך JSON
    downloadButton.addEventListener('click', () => {
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

// פונקציה ליצירת תוכן ה־ASCII
function generateAsciiFromJson(data) {
    let asciiContent = "/* :INFILE = 'C:\\tmp\\infile.txt'; */\n";
    asciiContent += `SELECT '{'\nFROM DUMMY ASCII UNICODE :infile;\n`;
    asciiContent += createAsciiContent(data);
    asciiContent += `SELECT '}'\nFROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
    return asciiContent.replace(/;\s*/g, ';\n').trim();
}

// פונקציה גנרית ליצירת התוכן של ASCII לפי המבנה של ה־JSON
function createAsciiContent(data) {
    let content = '';
    if (typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        keys.forEach((key, index) => {
            const value = data[key];
            const isLastItem = index === keys.length - 1;

            if (typeof value === 'object' && !Array.isArray(value)) {
                content += `SELECT '"${key}": {'\nFROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                content += createAsciiContent(value);
                content += `SELECT '}${isLastItem ? '' : ','}'\nFROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
            } else if (Array.isArray(value)) {
                content += `SELECT '"${key}": ['\nFROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                value.forEach((item, idx) => {
                    content += `SELECT '{'\nFROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                    content += createAsciiContent(item);
                    content += `SELECT '}${idx < value.length - 1 ? ',' : ''}'\nFROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
                });
                content += `SELECT ']${isLastItem ? '' : ','}'\nFROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
            } else {
                content += createLine(key, value, !isLastItem);
            }
        });
    }
    return content;
}

// פונקציה ליצירת שורה עבור ערך יחיד עם שמות פרמטרים דינמיים
function createLine(key, value, hasComma) {
    // יצירת שורת ASCII מתוך JSON לפי שמות הפרמטרים המקוריים
    return `SELECT STRCAT('"${key}":"', :${key}, '"${hasComma ? ',' : ''}')\nFROM DUMMY ASCII UNICODE ADDTO :infile;\n`;
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
