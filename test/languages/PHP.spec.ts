import * as fs from "fs";
import * as path from "path";

import { newUnibeautify, Beautifier } from "unibeautify";
import beautifier from "../../src";
import { raw } from "../utils";

describe("should successfully beautify PHP files", () => {
  // tslint:disable:mocha-no-side-effect-code
  testFile("test1.php");
  testFile("test2.php");
  testFile("test3.php");
});

function testFile(fixtureFileName: string) {
  test(`should successfully beautify file ${fixtureFileName}`, () => {
    const text: string = fs
      .readFileSync(path.resolve(__dirname, `../fixtures/${fixtureFileName}`))
      .toString();
    const unibeautify = newUnibeautify();
    unibeautify.loadBeautifier(beautifier);
    return unibeautify
      .beautify({
        languageName: "PHP",
        options: {
          PHP: {
            indent_style: "space",
            indent_size: 2
          }
        },
        text
      })
      .then(results => {
        expect(raw(results)).toMatchSnapshot();
      });
  });
}
