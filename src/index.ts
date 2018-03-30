import * as prettier from "prettier";
import { BuiltInParserName } from "prettier";
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

import options from "./options";
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
  beautify({ text, dependencies }: BeautifierBeautifyData) {
    const phpCsFixer = dependencies.get<ExecutableDependency>("PHP-CS-Fixer");
    return tmpFile({
      postfix: ".php"
    }).then(filePath =>
      writeFile(filePath, text).then(() =>
        phpCsFixer
          .run(["fix", "--rules=@PSR2", "--", filePath])
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
        // mode: 0o666,
        prefix: "unibeautify-",
        ...options
      },
      (err, path, fd) => {
        if (err) {
          return reject(err);
        }
        // tslint:disable-next-line:no-console
        console.log(path, fd, err);
        return resolve(path);
      }
    )
  );
}

function writeFile(filePath: string, contents: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, contents, error => {
      console.error(error);
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

export default beautifier;
