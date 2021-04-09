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
        let cols = [];
        for (let i = 1; i < rows.length; i += 1) {
            for (let j = 0; j < pos.length; j += 1) {
                cols.push(
                    rows[i].slice(pos[j], pos[j] + len[j] - 1).trim()
                );
            }
            cols.push('end_row');
        }
        return cols;
    } 
    catch (e) {
        console.log("Error", e);
    }
}

columns = parserFun('file.SUN', [0, 15, 48, 77, 92], [15, 33, 29, 15, 239]);
columns.then(function(result){
    console.log(result);
});
module.exports = parserFun;
