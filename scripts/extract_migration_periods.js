import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, i) => {
      const value = values[i];
      // Convert numeric values
      if (!isNaN(value) && value !== "") {
        row[header] = parseFloat(value);
      } else {
        row[header] = value;
      }
    });
    return row;
  });
}

// Extract migration periods for each species
function extractMigrationPeriods(data) {
  const speciesPeriods = {};

  // Group data by species
  const speciesData = {};
  data.forEach((row) => {
    const species = row.species;
    if (!speciesData[species]) {
      speciesData[species] = [];
    }
    speciesData[species].push(row);
  });

  // For each species, find DOY ranges where median > 1
  Object.keys(speciesData).forEach((species) => {
    const rows = speciesData[species].sort((a, b) => a.doy - b.doy);
    const activeDays = rows.filter((row) => row.median > 0.1);

    if (activeDays.length > 0) {
      // Create single range from first to last active day
      const start = activeDays[0].doy;
      const end = activeDays[activeDays.length - 1].doy;

      speciesPeriods[species] = [{ start, end }];
    }
  });

  return speciesPeriods;
}

// Convert DOY to month-day for easier understanding
function doyToMonthDay(doy) {
  const date = new Date(2024, 0, doy); // Use 2024 (leap year) as reference
  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

// Main execution
function main() {
  try {
    const csvPath = path.join(__dirname, "../public/species_doy_statistics.csv");
    const outputPath = path.join(__dirname, "../src/migration_periods.json");

    console.log("Reading CSV file...");
    const data = parseCSV(csvPath);

    console.log("Extracting migration periods...");
    const migrationPeriods = extractMigrationPeriods(data);

    // Since each species now has only one range, simplify output
    const output = {};
    Object.keys(migrationPeriods).forEach((species) => {
      const range = migrationPeriods[species][0]; // Only one range per species
      output[species] = {
        startDoy: range.start,
        endDoy: range.end,
      };
    });

    console.log("Writing JSON file...");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log("Migration periods extracted successfully!");
    console.log(`Output saved to: ${outputPath}`);

    // Print summary
    Object.keys(output).forEach((species) => {
      console.log(`\n${species}: DOY ${output[species].startDoy}-${output[species].endDoy}`);
    });
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
