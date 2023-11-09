import { spawn } from "child_process";

export async function renderGraphvizCode(code: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const process = spawn("dot", [ "-Tpng" ]);

		let output = Buffer.from("");
		let errorOutput = "";
  
		process.stdout.on("data", (data) => {
			output = Buffer.concat([ output, data ]);
		});
  
		process.stderr.on("data", (data) => {
			errorOutput += data;
		});
  
		process.on("error", (error) => {
			reject(error);
		});
  
		process.on("close", (code) => {
			if (code === 0) {
				resolve(output.toString("base64"));
			} else {
				reject(new Error(`dot process exited with code ${code}: ${errorOutput}`));
			}
		});
 
		process.stdin.write(code);
		process.stdin.end();
	});
}