import { newUnibeautify, Beautifier } from "unibeautify";
import beautifier from "../../src";

import * as fs from "fs";
import * as path from "path";

describe("should successfully beautify PHP files", () => {
  // tslint:disable-next-line:mocha-no-side-effect-code
  testFile("test1.php");
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
        expect(results).toMatchSnapshot();
      });
  });
}
