// @ts-ignore
import validateSchema from "yaml-schema-validator";

if (process.argv.length < 3) {
    throw new Error("Missing files to validate");
}
const files = process.argv.slice(2);
for (const file of files) {
    if (!file.endsWith("yml")) {
        continue;
    }
    console.log("Validating: ", file);
    validateSchema(file, {
        schemaPath: 'schema.yml'
    });
}



