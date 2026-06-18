import { stat, constants, access, writeFile } from "node:fs/promises";
import { parse as parsePath, format as formatPath, join as joinPath, isAbsolute, resolve } from "node:path"; // path formatting differs for windows and linux

// processing arguments from console
export interface IParsedArgs {
	outputPath: string;
	inputPath: string;
	format: string;
	autoConfirm: boolean;
}
export async function parseArgs(argv: string[], cwd: string): Promise<IParsedArgs> {
	let defaultOut = joinPath(cwd, "conflicts");
	let format: string = ".md";
	let autoConfirm = false;
	let inputPath: string = cwd;
	let outputPath: string;
	let userPath: string | undefined;


	for (let i = 0; i < argv.length; i++) {
		switch (argv[i]) {
			case "-o":
			case "--output":
				const arg = argv[++i];
				if (arg) {
					// specify output file
					userPath = arg.trim();
				}
				else {
					throw new Error("missing argument: output");
				}
				break;
			case "--html":
				format = ".html";
				break;
			case "--md":
				format = ".md";
				break;
			case "-y":
				autoConfirm = true;
				break;
			default:
				inputPath = argv[i] ?? "";
				break;
		}
	}

	inputPath = isAbsolute(inputPath) ? inputPath : resolve(cwd, inputPath);
	const iPath = parsePath(inputPath);

	if (!iPath.ext) { // the path points to directory
		inputPath = joinPath(inputPath, "package.json");
	}
	else if (iPath.base !== "package.json") {
		throw new Error("input path does not point to package.json");
	}

	if (!userPath) {
		outputPath = defaultOut + format;
		return { outputPath, format, inputPath, autoConfirm };
	}

	userPath = isAbsolute(userPath) ? userPath : resolve(cwd, userPath);
	const uPath = parsePath(userPath);

	if (uPath.ext && ![".md", ".html"].includes(uPath.ext)) {
		throw new Error("output extension must be .md or .html");
	} else {
		// if user defined output path contains valid extension, use it
		if (uPath.ext) {
			format = uPath.ext;
			outputPath = userPath;
		}
		else { // expecting the path to be a folder
			outputPath = joinPath(userPath, "conflicts" + format);
		}
	}

	return { outputPath, inputPath, format, autoConfirm };
}

export async function validateInputFile(inputPath: string) {
	try {
		await access(inputPath, constants.R_OK);
		const stats = await stat(inputPath);
		if (!stats.isFile())
			throw new Error();
	} catch (err) {
		throw new Error(`path ${inputPath} does not exist, cannot be accessed or is not a regular file`);
	}
}

export async function validateOutputFile(outputPath: string) {
	try {
		await access(outputPath, constants.W_OK);
	} catch (err: any) {
		if (err.code === "EACCES")
			throw new Error(`user does not have permisions for the file ${outputPath}`);
	}
	try {
		// try to write to file, fail if file exists
		await writeFile(outputPath, "", { flag: "wx" });
		console.log("output file is located at:", outputPath);
	}
	catch (err: any) {
		if (err.code === "EACCES") {
			throw new Error(`user does not have permisions for the file ${outputPath}`);
		} else if (err.code === "EEXIST") {
			throw new Error(`file ${outputPath} already exists`, { cause: "EEXIST" });
		}
		throw new Error(`cannot write to file ${outputPath}`);
	}
}
