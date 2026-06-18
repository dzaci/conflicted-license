import { IParsedArgs, parseArgs, validateInputFile, validateOutputFile } from "./parse-args";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { access, stat, writeFile, constants } from "node:fs/promises";

vi.mock("node:fs/promises", () => ({
	access: vi.fn(),
	stat: vi.fn(),
	writeFile: vi.fn(),
	constants: {
		R_OK: 4
	}
}));

describe("parseArgs input tests", () => {
	const cwd = "/mock/user/project";

	it("should pass", async () => {
		const result = await parseArgs([], cwd);

		expect(result.format).toBe(".md");
		expect(result.outputPath).toBe(cwd + "/conflicts.md");
		expect(result.inputPath).toBe(cwd + "/package.json");
	});
	it("should change input file", async () => {
		const result = await parseArgs(["/mock/user/dest-project"], cwd);

		expect(result.inputPath).toBe("/mock/user/dest-project/package.json");
	});
	it("should keep input file", async () => {
		const result = await parseArgs(["/mock/user/dest-project/package.json"], cwd);

		expect(result.inputPath).toBe("/mock/user/dest-project/package.json");
	});
	it.fails("unsupported format", async () => {
		await parseArgs(["-o", "/mock/files.txt"], cwd);
	});
	it.fails("missing argument", async () => {
		await parseArgs(["-o"], cwd);
	});
	it("should keep output format", async () => {
		const result1 = await parseArgs(["-o", "/mock/files.html"], cwd);
		expect(result1.outputPath).toBe("/mock/files.html");

		const result2 = await parseArgs(["-o", "/mock/files.html", "--md"], cwd);
		expect(result2.outputPath).toBe("/mock/files.html");
	});

	it("should set to default", async () => {
		const result = await parseArgs(["-o", " "], cwd);

		expect(result.outputPath).toBe(cwd + "/conflicts.md")
	});

	it("should convert relative input path to absolute", async () => {
		const result1 = await parseArgs(["next"], cwd);
		const result2 = await parseArgs(["../prev"], cwd);
		const result3 = await parseArgs(["./next/package.json"], cwd);

		expect(result1.inputPath).toBe(cwd + "/next/package.json");
		expect(result2.inputPath).toBe("/mock/user/prev/package.json");
		expect(result3.inputPath).toBe(cwd + "/next/package.json");
	});
	it("should convert relative output to absolute", async () => {
		const result1 = await parseArgs(["-o", "next"], cwd);
		expect(result1.outputPath).toBe(cwd + "/next/conflicts.md");
		const result2 = await parseArgs(["-o", "next/out.html"], cwd);
		expect(result2.outputPath).toBe(cwd + "/next/out.html");
		expect(result2.format).toBe(".html")
	});
});


describe("validate input and output paths", () => {
	const cwd = "/mock/user/project";
	let args: IParsedArgs;
	beforeAll(async () => {
		args = await parseArgs([], cwd);
	});

	it("should find input file", async () => {
		vi.mocked(access).mockResolvedValue();
		vi.mocked(stat).mockResolvedValue({
			isFile: () => true,
		} as any);
		await expect(validateInputFile(args.inputPath)).resolves.not.toThrow();
	});
	it("should throw if input path is not a regular file", async () => {
		vi.mocked(access).mockResolvedValue();
		vi.mocked(stat).mockResolvedValue({
			isFile: () => false,
		} as any);

		await expect(validateInputFile(args.inputPath)).rejects.toThrow();
	});
	it("should throw if input path is not existant", async () => {
		vi.mocked(access).mockRejectedValue(new Error("ENOENT"));

		await expect(validateInputFile(args.inputPath)).rejects.toThrow();
	});
	it("should throw if user has no read permissions for input file", async () => {
		vi.mocked(access).mockRejectedValue(new Error("EACCES"));

		await expect(validateInputFile(args.inputPath)).rejects.toThrow();
	});

	it("should be able to create new file if has access rights and file non existant", async () => {
		vi.mocked(writeFile).mockResolvedValue();
		vi.mocked(access).mockResolvedValue();

		await expect(validateOutputFile(args.outputPath)).resolves.not.toThrow();
	});
	it("should throw if has no access rights", async () => {
		vi.mocked(writeFile).mockResolvedValue();
		vi.mocked(access).mockRejectedValue({ code: "EACCES" });

		await expect(validateOutputFile(args.outputPath)).rejects.toThrow(`user does not have permisions for the file ${args.outputPath}`);
	});
	it("error should contain cause='EEXIST' if file exists", async () => {
		vi.mocked(writeFile).mockRejectedValue({ code: "EEXIST" });
		vi.mocked(access).mockResolvedValue();

		await expect(validateOutputFile(args.outputPath)).rejects.toThrow(expect.objectContaining({ cause: "EEXIST" }));
	});
	it("should throw on disk error", async () => {
		vi.mocked(writeFile).mockRejectedValue({});

		await expect(validateOutputFile(args.outputPath)).rejects.toThrow();
	});

})
