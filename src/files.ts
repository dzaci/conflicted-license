import { constants, readFile } from "node:fs/promises";

// dependencies: possible to expand functionality to also check dependencies of dependencies
export interface IPkg {
	name: string,
	license?: string,
	dependencies?: Record<string, string>
}

export async function getDepsFromPkg(path: string): Promise<IPkg> {
	const raw = await readFile(path, { encoding: "utf8" });
	const json = JSON.parse(raw);
	let data: IPkg = { name: json.name, license: json.license, dependencies: json.dependencies }

	return data;
}

export async function getDepsFromPkgLock(path: string, missing: Set<string>): Promise<IPkg[]> {
	const raw = await readFile(path, { encoding: "utf8" });
	const json = JSON.parse(raw);

	let data: IPkg[] = [];
	for (let miss of missing) {
		let pkgJson = json.packages[`node_modules/${miss}`];

		// if license is not present, do not add data
		if (!pkgJson?.license) {
			continue;
		}
		let pkg = {
			name: miss,
			license: pkgJson.license,
			dependencies: pkgJson.dependencies
		} as IPkg;
		data.push(pkg);
	}
	return data;
}

