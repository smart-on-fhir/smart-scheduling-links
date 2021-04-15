// @ts-ignore
import validateSchema from "yaml-schema-validator";

console.log("Validating schema");

const fileName = process.argv[2];

if (!fileName) {
    throw new Error("Missing file to validate");
}

validateSchema(fileName, {
    schemaPath: 'schema.yml'
});
