import {
  Beautifier,
  Language,
  BeautifierBeautifyData,
  DependencyType,
  ExecutableDependency
} from "unibeautify";
import * as readPkgUp from "read-pkg-up";
import * as tmp from "tmp";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const { pkg } = readPkgUp.sync({ cwd: __dirname });

export const beautifier: Beautifier = {
  name: "PHP-CS-Fixer",
  package: pkg,
  options: {
    PHP: true
  },
  dependencies: [
    {
      type: DependencyType.Executable,
      name: "PHP-CS-Fixer",
      program: "php-cs-fixer",
      parseVersion: [/version (.*) by/, /PHP CS Fixer (\d+\.\d+\.\d+)/]
    }
  ],
  beautify({ text, dependencies, filePath }: BeautifierBeautifyData) {
    const phpCsFixer = dependencies.get<ExecutableDependency>("PHP-CS-Fixer");
    const basePath: string = os.tmpdir();
    return tmpFile({
      postfix: ".php"
    }).then(filePath =>
      writeFile(filePath, text).then(() =>
        phpCsFixer
          .run({
            args: relativizePaths(
              ["fix", "--rules=@PSR2", "--using-cache=no", filePath],
              basePath
            ),
            options: {
              cwd: basePath
            }
          })
          .then(({ exitCode, stderr }) => {
            if (exitCode) {
              return Promise.reject(stderr);
            }
            return readFile(filePath);
          })
      )
    );
  }
};

function tmpFile(options: tmp.Options): Promise<string> {
  return new Promise<string>((resolve, reject) =>
    tmp.file(
      {
        prefix: "unibeautify-",
        ...options
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
