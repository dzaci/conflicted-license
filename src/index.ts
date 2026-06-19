#!/usr/bin/env node
import * as readLine from "node:readline/promises";
import { parse } from "csv-parse";
import * as parseArgs from "./parse-args";
import * as files from "./files"
import { parse as parsePath, join as joinPath, resolve as resolvePath } from "node:path";
import { access, constants } from "node:fs/promises";
import { createReadStream, writeFile } from "node:fs";

// processing arguments from console

// argv[0] - path to node
// argv[1] - path to executed file
// argv[2...] - arguments from console

interface IConflictItem {
	conflict: string, // type of restriction that is in conflict
	type: "error" | "warning" // !!! => error, mismatch => warning
}
interface IConflict {
	with: string, // with which dependency 
	conflicts: IConflictItem[]
}

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

function mdFormat(conflicts: IConflict[]) {
	if (conflicts.length == 0) {
		return "### No conflicts found"
	}

	let md = "| Dependency | Conflict | Severity |\n";
	md += "|------------|----------|----------|\n";

	for (const conflict of conflicts) {
		for (const item of conflict.conflicts) {
			md += `| ${conflict.with} | ${item.conflict} | ${item.type}|\n`;
		}
	}

	return md;

}

function htmlFormat(conflicts: IConflict[]) {
	if (conflicts.length == 0) {
		return "<h2>No conflicts found</h2>"
	}
	let html = `
<table border="1" cellspacing="0" cellpadding="6">
  <thead>
    <tr>
      <th>Dependency</th>
      <th>Conflict</th>
      <th>Severity</th>
    </tr>
  </thead>
  <tbody>
`;
	for (const conflict of conflicts) {
		for (const item of conflict.conflicts) {
			html += `
    <tr>
      <td>${conflict.with}</td>
      <td>${item.conflict}</td>
      <td>${item.type}</td>
    </tr>`;
		}
	}

	html += `
  </tbody>
</table>`;

	return html;
}

async function formatConflicts(conflicts: IConflict[], name: string, format: string) {
	const needFormat: IConflict[] = conflicts.filter((con) => con.conflicts.length > 0);

	switch (format) {
		case ".md":
			return `# ${name}\n\n${mdFormat(needFormat)}`;
		case ".html":
			return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${name}</title>
</head>
<body>
  <h1>${name}</h1>
  ${htmlFormat(needFormat)}
</body>
</html>
`
		default:
			break
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

	if (!deps?.license) {
		console.error("package.json is missing license");
		process.exit(1);
	}

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
	let restrictions = [];
	for await (const row of parser) {
		restrictions.push(row);
	}

	const comparisonTable = [["can", "cannot", "must"], ["cannot", "cannot", "!!!"], ["must", "!!!", "must"]];
	const tableMap = { "can": 0, "cannot": 1, "must": 2 };
	const typeOfRestriction = [
		"Commercial Use(Competitive)",
		"Commercial Use(Non - Competitive)",
		"Compensate for Damages",
		"Contact Author",
		"Disclose Source",
		"Distribute",
		"Give Credit",
		"Hold Liable",
		"Include Copyright",
		"Include Install Instructions",
		"Include License",
		"Include Notice",
		"Include Original",
		"Modify",
		"Pay Above Use Threshold",
		"Place Warranty",
		"Private Use",
		"Relicense",
		"Rename",
		"State Changes",
		"Statically Link",
		"Sublicense",
		"Use in Production",
		"Use Internally",
		"Use Patent Claims",
		"Use Trademark"
	];

	const lic = restrictions.filter((license) => license.short.toLowerCase() === deps.license.toLowerCase())[0];
	let conflicts: IConflict[] = [];
	for (const mod of data) {
		const depLic = restrictions.filter((license) => license.short.toLowerCase() === mod.license.toLowerCase())[0];
		let conflict: IConflict = { with: mod.name, conflicts: [] };

		if (lic.short.toLowerCase() === depLic.short.toLowerCase()) {
			// no need to check
			continue;
		}

		for (let type of typeOfRestriction) {
			const stance = lic[type] as keyof typeof tableMap;
			const depStance = depLic[type] as keyof typeof tableMap;

			const rowKey: number = tableMap[depStance];
			const colKey: number = tableMap[stance];

			if (comparisonTable[rowKey]) {
				let comparison = comparisonTable[rowKey][colKey];

				if (comparison === "!!!") {
					conflict.conflicts.push({ conflict: type, type: "error" } as IConflictItem);
				}
				else if (comparison !== stance) {
					conflict.conflicts.push({ conflict: type, type: "warning" } as IConflictItem);
				}
			}
		}
		conflicts.push(conflict);
	}

	const format = await formatConflicts(conflicts, deps.name, args.format);
	console.log(typeof format)
	if (format) {
		writeFile(args.outputPath, format, "utf8", (err) => { if (err) console.error("could not write to file", args.outputPath) });
	} else {
		console.error("formating failed");
	}
}
main()
