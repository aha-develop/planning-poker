export default function css(literals) {
    const values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      values[_i - 1] = arguments[_i];
    }
    let output = "";
    let index;
    for (index = 0; index < values.length; index++) {
      output += literals[index] + values[index];
    }
    output += literals[index];
    return output;
  }