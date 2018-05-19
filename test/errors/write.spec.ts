import { newUnibeautify, Beautifier } from "unibeautify";
import beautifier from "../../src";
import { raw } from "../utils";
// tslint:disable:mocha-no-side-effect-code
const fs = require("fs");
fs.writeFile = jest.fn((filepath, content, cb) =>
  cb(new Error("Write file failed"))
);
test(`should error writing file`, () => {
  const text: string = `<?php $temp = 1; ?>`;
  const unibeautify = newUnibeautify();
  unibeautify.loadBeautifier(beautifier);
  return expect(
    unibeautify
    .beautify({
      languageName: "PHP",
      options: {
        PHP: {},
      },
      text,
    })
  ).rejects.toThrowError("Write file failed");
});
afterAll(() => {
  jest.resetAllMocks();
  fs.writeFile = fs.stat.bind(fs);
});
