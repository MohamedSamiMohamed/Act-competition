const fs = require('fs');
const fsPromises = fs.promises;

async function parserFun(file, pos, len, skipped) {
    //file: file to be parsed
    //pos: array of positions for parsing
    //len: array of lengths for parsing
    let filehandle = null;
    try {
        filehandle = await fsPromises.open(file, 'r+');

        var data = await filehandle.readFile("utf8");
        rows = data.toString().split('\n');
        let values = [];
        let dummy = [];
        values.push([rows.length]);
        for (let i = skipped; i < rows.length; i += 1) {
            for (let j = 0; j < pos.length; j += 1) {
                dummy.push(
                    rows[i].slice(pos[j], pos[j] + len[j]).trim()
                ); 
            }
            values.push(dummy);
            dummy=[];
        }
        return values;
    } 
    catch (e) {
        console.log("Error", e);
    }
}

module.exports = parserFun;
