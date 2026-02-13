const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../enic_utf8.html'), 'utf8');

// Helper to remove tags
function stripTags(str) {
    return str.replace(/<[^>]*>/g, '').trim();
}

// 1. Extract entry-content
const startMarker = '<div class="entry-content">';
const endMarker = '<div id="ftwp-postcontent">'; // or just find where content ends

let content = html;
const startIndex = html.indexOf(startMarker);
if (startIndex !== -1) {
    content = html.substring(startIndex);
}

// 2. We want to find all tables and their preceding headings
// Strategy: content is a sequence of <h3>...</h3> followed by <table>...</table> (mostly)
// Actually, looking at the user paste:
// <h3 id="ftoc-heading-X">...</h3>
// <table>...</table>
// Sometimes <h4> for sub-models.

const sections = [];
const regex = /<h3[^>]*>(.*?)<\/h3>([\s\S]*?)(?=<h3|$)/g;
// Verify if h3 is the main level. Yes, "1. Sản phẩm đèn...", "2. Sản phẩm sen..." are h3.
// Inside h3, there might be h4.

let match;
while ((match = regex.exec(content)) !== null) {
    const title = stripTags(match[1]);
    const body = match[2]; // Contains h4, tables, etc.

    // Check if this section has tables directly or subsections
    // Filter out "Showroom" sections
    if (title.includes("Showroom") || title.includes("Liên hệ") || title.includes("Hỗ trợ")) continue;

    const sectionData = {
        title,
        items: []
    };

    // Find tables in this section.
    // Case A: Direct table (e.g. "1. Sản phẩm đèn...")
    // Case B: Subsections with h4 (e.g. "2. Sản phẩm sen...")

    if (body.includes('<h4')) {
        // Has subsections
        const subRegex = /<h4[^>]*>(.*?)<\/h4>([\s\S]*?)(?=<h4|$)/g;
        let subMatch;
        while ((subMatch = subRegex.exec(body)) !== null) {
            const subTitle = stripTags(subMatch[1]);
            const subBody = subMatch[2];
            const tableData = extractTable(subBody);
            if (tableData) {
                sectionData.items.push({
                    name: subTitle,
                    table: tableData
                });
            }
        }
    } else {
        // Direct table
        const tableData = extractTable(body);
        if (tableData) {
            sectionData.items.push({
                name: title, // Or empty if redundant
                table: tableData
            });
        }
    }

    if (sectionData.items.length > 0) {
        sections.push(sectionData);
    }
}

function extractTable(htmlChunk) {
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/;
    const tableMatch = tableRegex.exec(htmlChunk);
    if (!tableMatch) return null;

    const tableContent = tableMatch[1];
    const rows = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
        const rowContent = rowMatch[1];
        const cells = [];
        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
        let cellMatch;
        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
            // content might contain <p>, <span>, etc.
            let cellText = stripTags(cellMatch[1].replace(/<p>/g, '\n').replace(/<\/p>/g, ''));
            cells.push(cellText);
        }
        if (cells.length > 0) rows.push(cells);
    }
    return rows;
}

// Also extract "I. PHẠM VI BẢO HÀNH" and "II. TỪ CHỐI" if possible, but let's focus on the pricing tables (Section III) first as that's the hard part.
// The user provided text for I and II in the paste, I can just use that static text if I want.
// Section III is "3. BẢNG GIÁ..."

console.log(JSON.stringify(sections, null, 2));
fs.writeFileSync(path.join(__dirname, '../warranty_data.json'), JSON.stringify(sections, null, 2));
