const events = require("events");
const fs = require("fs");

//extend events.EventEmitter to listen for event
  
class Watcher extends events.EventEmitter {
    constructor(file_path) {
        super();
        this.file_path = file_path;
    }
    //Cycles through directory and process any file found emitting a process event for each one

    watch() {
        const watcher = this;
        fs.readdir(this.file_path, function(err, files) {
            if (err) throw err;
            for (let index in files) {
                watcher.emit("process", files[index]);
                console.log('Done Processing');
            }
        });
    }
    start() {
        var watcher = this;
        fs.watchFile(file_path, function() {
            watcher.watch();
        });
    }
}
 
// let watcher = new Watcher(file_path, processedDir, [0, 15, 48, 77, 92, 331], [15, 33, 29, 15, 239, 1]);

// watcher.on("process", function process(file) {
//     const watchFile = this.file_path + "/" + file;
//     const processedFile = this.processedDir + "/" + file.toLowerCase();
//     fs.rename(watchFile, processedFile, function(err) {
//     if (err) throw err;
//     });
// });

// watcher.start();
module.exports = Watcher;
