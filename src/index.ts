#!/usr/bin/env node
import * as readLine from "node:readline/promises";
import { parse } from "csv-parse";
import * as parseArgs from "./parse-args";
import * as files from "./files"
import { parse as parsePath, join as joinPath, resolve as resolvePath } from "node:path";
import { access, constants } from "node:fs/promises";
import { createReadStream } from "node:fs";

// processing arguments from console

// argv[0] - path to node
// argv[1] - path to executed file
// argv[2...] - arguments from console

async function ask(question: string, autoConfirm: boolean, rl: readLine.Interface): Promise<boolean> {
	if (autoConfirm) return true;

	const ans = await rl.question(question);
	switch (ans.trim().toLowerCase()) {
		case "y":
		case "yes":
			return true;
		default: return false;
	}
}

async function main() {
	let overwrite: boolean = false;
	const args: parseArgs.IParsedArgs = await parseArgs.parseArgs(process.argv.slice(2), process.cwd());
	const rl = readLine.createInterface(process.stdin, process.stdout);

	try {
		await parseArgs.validateInputFile(args.inputPath);
		await parseArgs.validateOutputFile(args.outputPath);
	} catch (err: any) {
		if (err?.cause === "EEXIST") {
			console.error(err.message);
			overwrite = await ask(`do you want to overwrite it? [y/N]`, args.autoConfirm, rl);
			if (!overwrite) {
				console.log("operation cancelled by user")
				rl.close();
				process.exit(0);
			}
		} else {
			rl.close();
			console.error(err.message);
			process.exit(1);
		}
	}
	// input parsing and validation done

	rl.close();

	// read the package.json file
	const deps: files.IPkg = await files.getDepsFromPkg(args.inputPath);
	let data: files.IPkg[] = [];
	const depsWithouLicense = new Set<string>(Object.keys(deps?.dependencies ?? {}));

	// check package-lock.json for license
	let lockFile: string = "";
	let directory = parsePath(args.inputPath); // traverse upwards from package.json folder
	do {
		try {
			await parseArgs.validateInputFile(directory.dir + "/package-lock.json");
			// package-lock.json found
			lockFile = directory.dir + "/package-lock.json";
			break;
		} catch {
			directory = parsePath(directory.dir);
		}
	} while (directory.dir !== directory.root);

	if (lockFile) {
		try {
			data.push(...(await files.getDepsFromPkgLock(lockFile, depsWithouLicense)));
			const foundNames = new Set(data.map(pkg => pkg.name));
			for (let found of foundNames) {
				depsWithouLicense.delete(found);
			}
		} catch { }
	}

	// if some licenses were not found in package-lock.json
	if (depsWithouLicense.size > 0) {
		// => search node_modules
		let modulesFile: string = "";
		directory = parsePath(args.inputPath);
		do {
			try {
				await access(directory.dir + "/node_modules", constants.X_OK);
				modulesFile = directory.dir + "/node_modules";
				break;
			} catch {
				directory = parsePath(directory.dir);
			}
		} while (directory.dir !== directory.root);

		if (modulesFile) {
			for (let miss of [...depsWithouLicense]) {
				const moduleFile = joinPath(modulesFile, miss);
				const pkgFile = joinPath(moduleFile, "package.json");
				// const licenseFile = joinPath(moduleFile, "LICENSE");

				try {
					const deps: files.IPkg = await files.getDepsFromPkg(pkgFile);
					if (deps?.license) {
						data.push(deps);
						depsWithouLicense.delete(miss);
					}
				} catch { }
			}
		}
	}

	// search npm registry if other methods fail
	for (const name of [...depsWithouLicense]) {
		// TODO: fetch current version, may not be able because package.json may specify range of versions
		const res = await fetch(`https://registry.npmjs.org/${name}/latest`);
		if (res.ok) {
			const resJson = await res.json();
			if (resJson.license) {
				data.push({ name: name, license: resJson.license, dependencies: resJson.dependencies });
				depsWithouLicense.delete(name);
			} else {
				console.error("could not find license for", name);
			}
		} else {
			console.error("could not find license for", name);
		}
	}

	// data: IPkg[] is now populated
	const parser = createReadStream(resolvePath(joinPath(__dirname + "/../src/resources/output.csv"))).pipe(
		parse({ columns: true, trim: true })
	);
	let restrinctions = [];
	for await (const row of parser) {
		restrinctions.push(row);
	}
	console.log(restrinctions);
}
main()

//const data: any[] = [];
/*
createReadStream("output.csv")
	.pipe(parse({ columns: true, trim: true }))
	.on("data", (row) => {
		data.push(row);
	}).on("end", () => {
		// TODO: 
	});
*/

