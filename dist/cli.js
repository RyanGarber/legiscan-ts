#!/usr/bin/env node
import { LegiscanClient } from "./client.js";
import fs from "node:fs";
import path from "node:path";
import { parse } from "comment-parser";
import { Command } from "commander";
// Ensure the API key is set
const key = process.env.LEGISCAN_API_KEY;
if (!key) {
    console.error("Error: LEGISCAN_API_KEY environment variable not set.");
    process.exit(1);
}
// Initialize cli and client
const client = new LegiscanClient();
const program = new Command();
program.name("legiscan").description("CLI for Legiscan API").version("1.0.0");
const clientSource = fs.readFileSync(path.resolve(import.meta.dirname, import.meta.dirname.includes("/dist") ? "client.js" : "client.ts"), "utf-8");
const parsed = parse(clientSource);
// Find @cli comments and add them as commands
for (const comment of parsed) {
    const cli = comment.tags.find((t) => t.tag == "cli");
    if (!cli)
        continue;
    const method = cli.name;
    const description = comment.description;
    const params = comment.tags.filter((t) => t.tag == "param" && t.name != "params");
    const command = program.command(method).description(description);
    for (const param of params) {
        if (param.optional) {
            command.option(`--${param.name} <${param.name}>`, param.description);
        }
        else {
            command.requiredOption(`--${param.name} <${param.name}>`, param.description);
        }
    }
    command.action(async (options) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await client[method](options);
            if (result instanceof Array) {
                for (const item of result) {
                    console.log(JSON.stringify(item));
                }
            }
            else {
                console.log(JSON.stringify(result));
            }
        }
        catch (error) {
            console.error(`Error executing ${method}:`, error.message);
            process.exit(1);
        }
    });
}
program.parse();
//# sourceMappingURL=cli.js.map