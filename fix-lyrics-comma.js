const fs = require("fs");
const path = require("path");

const inputFile = path.join(__dirname, "hymns.js");
const outputFile = path.join(__dirname, "hymns_fixed.js");

const source = fs.readFileSync(inputFile, "utf8");

let result = "";
let position = 0;

let lyricsCount = 0;
let changedLyricsCount = 0;
let commaCount = 0;

// 找出 "lyrics": "..."
const lyricsStartRegex = /("lyrics"\s*:\s*")/g;

let match;

while ((match = lyricsStartRegex.exec(source)) !== null) {

  // 先把 lyrics 前面的內容原封不動放進去
  result += source.slice(position, match.index);
  result += match[0];

  lyricsCount++;

  const start = lyricsStartRegex.lastIndex;

  let i = start;
  let lastPosition = start;
  let changed = false;

  // 找這個 lyrics 字串真正結束的位置
  while (i < source.length) {

    // 遇到雙引號時，要判斷是不是跳脫的 \"
    if (source[i] === '"') {

      let backslashCount = 0;
      let p = i - 1;

      while (p >= start && source[p] === "\\") {
        backslashCount++;
        p--;
      }

      // 偶數個反斜線，代表這是真正的結尾 "
      if (backslashCount % 2 === 0) {
        break;
      }
    }

    // 只處理 lyrics 裡面的半形逗號
    if (source[i] === ",") {

      result += source.slice(lastPosition, i);
      result += "，";

      commaCount++;
      changed = true;

      lastPosition = i + 1;
    }

    i++;
  }

  if (i >= source.length) {
    throw new Error("發現 lyrics 字串沒有正常結束，已停止處理。");
  }

  // 把剩下的 lyrics 加回去，包含結尾 "
  result += source.slice(lastPosition, i + 1);

  if (changed) {
    changedLyricsCount++;
  }

  position = i + 1;

  // 下一次搜尋從這裡繼續
  lyricsStartRegex.lastIndex = position;
}

// 加上最後剩餘內容
result += source.slice(position);

// 輸出新檔
fs.writeFileSync(outputFile, result, "utf8");

console.log("");
console.log("處理完成！");
console.log("--------------------------");
console.log(`找到 lyrics：${lyricsCount} 筆`);
console.log(`有修改的 lyrics：${changedLyricsCount} 筆`);
console.log(`共替換半形逗號：${commaCount} 個`);
console.log("--------------------------");
console.log("");
console.log("新檔案：hymns_fixed.js");
console.log("原本 hymns.js 沒有被修改。");