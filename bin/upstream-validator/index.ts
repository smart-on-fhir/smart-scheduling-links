const Ajv = require("ajv");
const fs = require("fs").promises;
const path = require("path");

async function main() {
    if (process.argv.length < 3) {
        throw new Error("Missing files to validate");
    }

// Read and compile the schema
    const ajv = new Ajv();

    const jsonFile = await fs.readFile("./schema.json");

    const validate = ajv.compile(JSON.parse(jsonFile));

    console.log("Done");

    const files = process.argv.slice(2);
    let allValid = true;
    for (const file of files) {
        if (!file.endsWith("json")) {
            continue;
        }
        console.log("Validating: ", file);
        const pathFromValidator = path.join("..", "..", file);
        const upstream = JSON.parse(await fs.readFile(pathFromValidator));
        const valid = validate(upstream);
        if (!valid) {
            console.error("File failed validation: ", validate.errors);
            allValid = false;
        }
    }
    if (!allValid) {
        throw new Error("Files failed validation, see logs for details");
    }
}

main()
    .then(() => console.log("Validation completed successfully"))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
