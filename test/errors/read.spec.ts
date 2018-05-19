import { newUnibeautify, Beautifier } from "unibeautify";
import beautifier from "../../src";
import { raw } from "../utils";
// tslint:disable:mocha-no-side-effect-code
const fs = require("fs");
fs.readFile = jest.fn((filepath, cb) => cb(new Error("Read file failed")));
test(`should error writing file`, () => {
  const text: string = `<?php $temp = 1; ?>`;
  const unibeautify = newUnibeautify();
  unibeautify.loadBeautifier(beautifier);
  return expect(
    unibeautify.beautify({
      languageName: "PHP",
      options: {
        PHP: {},
      },
      text,
    })
  ).rejects.toThrowError("Read file failed");
});
afterAll(() => {
  jest.resetAllMocks();
  fs.readFile = fs.stat.bind(fs);
});
