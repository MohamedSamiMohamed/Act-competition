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
 
module.exports = Watcher;
