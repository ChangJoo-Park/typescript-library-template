import * as greeting from "../src/";

describe("Source code docs", () => {
  test("test", () => {
    expect(greeting.sayHello()).toBe("Hello");
  });
});
