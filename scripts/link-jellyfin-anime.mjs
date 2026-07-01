import { mkdir, readdir, symlink } from "node:fs/promises";
import path from "node:path";

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function requireArg(name) {
  const value = getArg(name);
  if (!value) {
    throw new Error(`Missing required argument --${name}`);
  }
  return value;
}

function sanitizeName(value) {
  return value.replace(/[/:*?"<>|]/g, "").trim();
}

function parseAbsoluteEpisodeNumber(fileName) {
  const match = fileName.match(/-\s*(\d+)(?:v\d+)?\s*\(/i);
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

async function main() {
  const sourceDir = path.resolve(requireArg("source"));
  const libraryRoot = path.resolve(requireArg("library-root"));
  const showName = sanitizeName(requireArg("show"));
  const seasonNumber = Number(requireArg("season"));
  const absoluteOffset = Number(getArg("offset") || "0");

  if (Number.isNaN(seasonNumber) || seasonNumber <= 0) {
    throw new Error("--season must be a positive number");
  }

  if (Number.isNaN(absoluteOffset) || absoluteOffset < 0) {
    throw new Error("--offset must be zero or a positive number");
  }

  const seasonFolder = `Season ${String(seasonNumber).padStart(2, "0")}`;
  const targetDir = path.join(libraryRoot, showName, seasonFolder);

  await mkdir(targetDir, { recursive: true });

  const entries = await readdir(sourceDir, { withFileTypes: true });
  const videoFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.(mkv|mp4|avi|mov)$/i.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

  if (videoFiles.length === 0) {
    throw new Error("No video files found in source directory");
  }

  const created = [];

  for (const fileName of videoFiles) {
    const extension = path.extname(fileName);
    const absoluteEpisode = parseAbsoluteEpisodeNumber(fileName);
    const derivedEpisode =
      absoluteEpisode != null ? absoluteEpisode - absoluteOffset : null;

    if (derivedEpisode == null || derivedEpisode <= 0) {
      throw new Error(
        `Could not derive a valid episode number for "${fileName}". Check the --offset value.`
      );
    }

    const episodeLabel = String(derivedEpisode).padStart(2, "0");
    const linkName = `${showName} - S${String(seasonNumber).padStart(
      2,
      "0"
    )}E${episodeLabel}${extension}`;
    const sourcePath = path.join(sourceDir, fileName);
    const linkPath = path.join(targetDir, linkName);

    try {
      await symlink(sourcePath, linkPath);
      created.push(linkPath);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
        created.push(linkPath);
        continue;
      }

      throw error;
    }
  }

  console.log(
    JSON.stringify(
      {
        sourceDir,
        targetDir,
        createdCount: created.length,
        files: created
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
