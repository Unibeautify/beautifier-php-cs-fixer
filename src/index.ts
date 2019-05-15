import {
  Beautifier,
  Language,
  BeautifierBeautifyData,
  DependencyType,
  ExecutableDependency,
} from "unibeautify";
import * as readPkgUp from "read-pkg-up";
import * as tmp from "tmp";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const pkg = readPkgUp.sync({ cwd: __dirname })!.package;

export const beautifier: Beautifier = {
  name: "PHP-CS-Fixer",
  package: pkg,
  badges: [
    {
      description: "Build Status",
      url:
        "https://travis-ci.com/Unibeautify/beautifier-php-cs-fixer.svg?branch=master",
      href: "https://travis-ci.com/Unibeautify/beautifier-php-cs-fixer",
    },
    {
      description: "Test Coverage",
      url:
        "https://api.codeclimate.com/v1/badges/5412cdac960ca7eda78f/test_coverage",
      href:
        "https://codeclimate.com/github/Unibeautify/beautifier-php-cs-fixer/test_covera" +
        "ge",
    },
    {
      description: "Maintainability",
      url:
        "https://api.codeclimate.com/v1/badges/5412cdac960ca7eda78f/maintainability",
      href:
        "https://codeclimate.com/github/Unibeautify/beautifier-php-cs-fixer/maintainabi" +
        "lity",
    },
    {
      description: "Greenkeeper",
      url:
        "https://badges.greenkeeper.io/Unibeautify/beautifier-php-cs-fixer.svg",
      href: "https://greenkeeper.io/",
    },
  ],
  options: {
    PHP: true,
  },
  dependencies: [
    {
      type: DependencyType.Executable,
      name: "PHP-CS-Fixer",
      program: "php-cs-fixer",
      parseVersion: [/version (.*) by/, /PHP CS Fixer (\d+\.\d+\.\d+)/],
      homepageUrl: "https://cs.sensiolabs.org/",
      installationUrl: "https://cs.sensiolabs.org/#installation",
      bugsUrl: "https://github.com/FriendsOfPHP/PHP-CS-Fixer/issues",
      badges: [
        {
          description: "Build Status (Travis CI)",
          url: "https://travis-ci.org/FriendsOfPHP/PHP-CS-Fixer.svg",
          href: "https://travis-ci.org/FriendsOfPHP/PHP-CS-Fixer",
        },
        {
          description: "Code Coverage",
          url:
            "https://coveralls.io/repos/FriendsOfPHP/PHP-CS-Fixer/badge.svg?service=github",
          href: "https://coveralls.io/github/FriendsOfPHP/PHP-CS-Fixer",
        },
      ],
    },
  ],
  resolveConfig: ({ filePath, projectPath }) => {
    const configFiles: string[] = [".php_cs", ".php_cs.dist"];
    return findFile({
      finishPath: projectPath,
      startPath: filePath,
      fileNames: configFiles,
    })
      .then(configFile => ({ filePath: configFile }))
      .catch(err => {
        // tslint:disable-next-line no-console
        console.error(err);
        return Promise.resolve({});
      });
  },
  beautify({
    text,
    dependencies,
    filePath,
    beautifierConfig,
  }: BeautifierBeautifyData) {
    const phpCsFixer = dependencies.get<ExecutableDependency>("PHP-CS-Fixer");
    const basePath: string = os.tmpdir();
    const config =
      beautifierConfig && beautifierConfig.filePath
        ? `--config=${beautifierConfig.filePath}`
        : "";
    // tslint:disable-next-line no-console
    console.error(`Using config: ${config}`);
    return tmpFile({ postfix: ".php" }).then(filePath =>
      writeFile(filePath, text).then(() =>
        phpCsFixer
          .run({
            args: relativizePaths(
              ["fix", config, "--using-cache=no", filePath],
              basePath
            ),
            options: {
              cwd: basePath,
            },
          })
          .then(({ exitCode, stderr }) => {
            if (exitCode) {
              return Promise.reject(stderr);
            }
            return readFile(filePath);
          })
      )
    );
  },
};

function findFile({
  finishPath = "/",
  startPath = finishPath,
  fileNames,
}: {
  startPath: string | undefined;
  finishPath: string | undefined;
  fileNames: string[];
}): Promise<string> {
  const filePaths = fileNames.map(fileName => path.join(startPath, fileName));
  return Promise.all(filePaths.map(doesFileExist))
    .then(exists => filePaths.filter((filePath, index) => exists[index]))
    .then(foundFilePaths => {
      if (foundFilePaths.length > 0) {
        return foundFilePaths[0];
      }
      if (startPath === finishPath) {
        return Promise.reject("No config file found");
      }
      const parentDir = path.resolve(startPath, "../");
      return findFile({ startPath: parentDir, finishPath, fileNames });
    });
}

function doesFileExist(filePath: string): Promise<boolean> {
  return new Promise(resolve => {
    fs.access(filePath, fs.constants.R_OK, error => resolve(!error));
  });
}

function tmpFile(options: tmp.FileOptions): Promise<string> {
  return new Promise<string>((resolve, reject) =>
    tmp.file(
      {
        prefix: "unibeautify-",
        ...options,
      },
      (err, path, fd) => {
        if (err) {
          return reject(err);
        }
        return resolve(path);
      }
    )
  );
}

function writeFile(filePath: string, contents: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, contents, error => {
      if (error) {
        return reject(error);
      }
      return resolve();
    });
  });
}

function readFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (error, data) => {
      if (error) {
        return reject(error);
      }
      return resolve(data.toString());
    });
  });
}

function relativizePaths(args: string[], basePath: string): string[] {
  return args.map(arg => {
    const isTmpFile =
      typeof arg === "string" &&
      !arg.includes(":") &&
      path.isAbsolute(arg) &&
      path.dirname(arg).startsWith(basePath);
    if (isTmpFile) {
      return path.relative(basePath, arg);
    }
    return arg;
  });
}

export default beautifier;
