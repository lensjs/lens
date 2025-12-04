const { execSync } = require("child_process");
const { platform } = require("os");

try {
  if (platform() === "win32") {
    console.log("Copying files for Windows...");
    execSync('xcopy /E /I /Y "src/ui/dist" "dist/ui\\"', { stdio: "inherit" });
  } else {
    console.log("Copying files for Unix/Linux...");
    execSync("cp -r src/ui/dist/ dist/ui --force", { stdio: "inherit" });
  }
  console.log("Files copied successfully!");
} catch (error) {
  console.error("Error copying files:", error);
  process.exit(1);
}
