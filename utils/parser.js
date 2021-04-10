const fs = require('fs');
const fsPromises = fs.promises;

async function parserFun(file, pos, len) {
    //file: file to be parsed
    //pos: array of positions for parsing
    //len: array of lengths for parsing
    let filehandle = null;
    try {
        filehandle = await fsPromises.open(file, 'r+');

        var data = await filehandle.readFile("utf8");
        rows = data.toString().split('\n');
        let values = [];
        values.push(rows.length);
        for (let i = 1; i < rows.length; i += 1) {
            for (let j = 0; j < pos.length; j += 1) {
                values.push([i, rows[i].slice(pos[j], pos[j] + len[j] - 1).trim()]
                ); 
            }
        }
        return values;
    } 
    catch (e) {
        console.log("Error", e);
    }
}

module.exports = parserFun;
