import { createReadStream } from "fs";
import { parse } from "csv-parse";

// processing arguments from console

// argv[0] - path to node
// argv[1] - path to executed file
// argv[2...] - arguments from console

// TODO: 
// console.log(process.cwd());

let output: string = process.cwd();
let format: string = "md";

for (let i = 2; i < process.argv.length; i++) {
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
		case "--html":
			format = "html";
			break;
	}
	//console.log(process.argv[i]);
}

// TODO: check empty file - output || do naming system for files

console.log();
console.log(output);
const data: any[] = []

createReadStream("output.csv")
	.pipe(parse({ columns: true, trim: true }))
	.on("data", (row) => {
		data.push(row);
	}).on("end", () => {
		// TODO: 
	});




