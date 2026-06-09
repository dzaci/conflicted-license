"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var csv_parse_1 = require("csv-parse");
// processing arguments from console
// argv[0] - path to node
// argv[1] - path to executed file
// argv[2...] - arguments from console
// TODO: 
// console.log(process.cwd());
var output = process.cwd();
process.argv[111];
for (var i = 2; i < process.argv.length; i++) {
    switch (process.argv[i]) {
        case "-o":
        case "--output":
            if (process.argv[++i])
                output = process.argv[i];
            else {
                console.error("missing process arg");
                process.exit(1);
            }
            break;
    }
    //console.log(process.argv[i]);
}
console.log();
console.log(output);
var data = [];
(0, fs_1.createReadStream)("output.csv")
    .pipe((0, csv_parse_1.parse)({ columns: true, trim: true }))
    .on("data", function (row) {
    data.push(row);
}).on("end", function () {
    // TODO: 
});
function empty_arg() {
}
