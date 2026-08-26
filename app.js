"use strict";


/* =========================================
   基本設定
========================================= */


/*
  hymns.js 裡面的資料格式：

  {
    book: 1,
    code: 1,
    title: "...",
    lyrics: "...",
    favorite: 0
  }

  所以新版只需要依照：

  book + code

  找出指定詩歌。
*/


const ITEM_HEIGHT = 70;


/*
  歌本名稱目前先暫時使用「歌本 1～6」。

  之後知道正式名稱後，
  只需要改這裡即可。

  icon 也可以之後換成圖片。
*/

const BOOKS = [

  {
    id: 1,
    name: "詩歌本",
    image: "./images/詩歌本.webp"
  },

  {
    id: 2,
    name: "詩歌補充本",
    image: "./images/詩歌補充本.webp"
  },

  {
    id: 3,
    name: "新歌頌詠",
    image: "./images/新歌頌詠.webp"
  },

  {
    id: 4,
    name: "紅本新詩",
    image: null,
    textIcon: "紅本"
  },

  {
    id: 5,
    name: "兒童詩歌",
    image: "./images/兒童詩歌.webp"
  },

  {
    id: 6,
    name: "藍本新詩",
    image: null,
    textIcon: "藍本"
  }

];


/* =========================================
   DOM
========================================= */

const bookList =
  document.getElementById("bookList");

const currentBookName =
  document.getElementById("currentBookName");

const numberDisplay =
  document.getElementById("numberDisplay");


const wheelThousands =
  document.getElementById("wheelThousands");

const wheelHundreds =
  document.getElementById("wheelHundreds");

const wheelTens =
  document.getElementById("wheelTens");

const wheelOnes =
  document.getElementById("wheelOnes");


const wheels = [

  wheelThousands,
  wheelHundreds,
  wheelTens,
  wheelOnes

];


const emptyState =
  document.getElementById("emptyState");

const hymnCard =
  document.getElementById("hymnCard");

const notFound =
  document.getElementById("notFound");


const hymnBook =
  document.getElementById("hymnBook");

const hymnTitle =
  document.getElementById("hymnTitle");

const hymnNumber =
  document.getElementById("hymnNumber");

const hymnLyrics =
  document.getElementById("hymnLyrics");

const notFoundNumber =
  document.getElementById("notFoundNumber");


/* =========================================
   APP 狀態
========================================= */

let selectedBook = 1;


/*
  預設第 1 首

  0001
*/

let selectedDigits = [
  0,
  0,
  0,
  1
];


let scrollTimers =
  new WeakMap();


/* =========================================
   資料庫索引

   建立 Map 可以讓查歌速度非常快。
========================================= */

const hymnIndex =
  new Map();


function buildHymnIndex() {

  if (
    typeof hymns === "undefined" ||
    !Array.isArray(hymns)
  ) {

    console.error(
      "找不到 hymns.js 或 hymns 不是陣列"
    );

    return;
  }


  for (const hymn of hymns) {

    const book =
      Number(hymn.book);

    const code =
      Number(hymn.code);


    const key =
      `${book}-${code}`;


    hymnIndex.set(
      key,
      hymn
    );

  }


  console.log(
    `已載入 ${hymnIndex.size} 首詩歌`
  );

}


/* =========================================
   歌本 UI
========================================= */

function createBookButtons() {

  bookList.innerHTML = "";


  BOOKS.forEach(book => {

    const button =
      document.createElement("button");


    button.type =
      "button";


    button.className =
      "book-button";


    button.dataset.book =
      String(book.id);


    const coverContent = book.image
  ? `
      <img
        class="book-cover-image"
        src="${book.image}"
        alt="${book.name}"
      >
    `
  : `
      <div class="book-text-cover">
        ${book.textIcon}
      </div>
    `;


    button.innerHTML = `
    <div class="book-cover">
        ${coverContent}
    </div>

    <div class="book-name">
        ${book.name}
    </div>
    `;


    if (
      book.id === selectedBook
    ) {

      button.classList.add(
        "active"
      );

    }


    button.addEventListener(
      "click",
      () => {

        selectBook(
          book.id
        );

      }
    );


    bookList.appendChild(
      button
    );

  });

}


/* =========================================
   選擇歌本
========================================= */

function selectBook(bookId) {

  selectedBook =
    Number(bookId);


  document
    .querySelectorAll(
      ".book-button"
    )
    .forEach(button => {

      const buttonBook =
        Number(
          button.dataset.book
        );


      button.classList.toggle(
        "active",
        buttonBook === selectedBook
      );

    });


  const book =
    BOOKS.find(
      item =>
        item.id === selectedBook
    );


  currentBookName.textContent =
    book
      ? book.name
      : `歌本 ${selectedBook}`;


  /*
    切換歌本後
    立即查目前歌號
  */

  updateHymn();

}


/* =========================================
   建立數字滾輪
========================================= */

function createWheel(
  wheel,
  initialValue
) {

  wheel.innerHTML = "";


  /*
    上方留白

    讓數字 0 可以停在中央。
  */

  const topPadding =
    document.createElement("div");

  topPadding.className =
    "wheel-padding";

  wheel.appendChild(
    topPadding
  );


  /*
    0 ～ 9
  */

  for (
    let number = 0;
    number <= 9;
    number++
  ) {

    const option =
      document.createElement("div");


    option.className =
      "wheel-option";


    option.dataset.value =
      String(number);


    option.textContent =
      String(number);


    wheel.appendChild(
      option
    );

  }


  /*
    下方留白

    讓數字 9 也可以停在中央。
  */

  const bottomPadding =
    document.createElement("div");

  bottomPadding.className =
    "wheel-padding";

  wheel.appendChild(
    bottomPadding
  );


  /*
    設定初始位置
  */

  requestAnimationFrame(
    () => {

      wheel.scrollTop =
        initialValue *
        ITEM_HEIGHT;


      updateWheelVisual(
        wheel,
        initialValue
      );

    }
  );


  /*
    滾動事件
  */

  wheel.addEventListener(
    "scroll",
    () => {

      handleWheelScroll(
        wheel
      );

    },
    {
      passive: true
    }
  );


  /*
    鍵盤 ↑ ↓
  */

  wheel.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "ArrowUp"
      ) {

        event.preventDefault();

        stepWheel(
          wheel,
          -1
        );

      }


      if (
        event.key ===
        "ArrowDown"
      ) {

        event.preventDefault();

        stepWheel(
          wheel,
          1
        );

      }

    }
  );

}


/* =========================================
   滾輪上下移動
========================================= */

function stepWheel(
  wheel,
  direction
) {

  let value =
    getWheelValue(
      wheel
    );


  value +=
    direction;


  value =
    Math.max(
      0,
      Math.min(
        9,
        value
      )
    );


  wheel.scrollTo({

    top:
      value *
      ITEM_HEIGHT,

    behavior:
      "smooth"

  });

}


/* =========================================
   滾動中
========================================= */

function handleWheelScroll(
  wheel
) {

  const value =
    getWheelValue(
      wheel
    );


  updateWheelVisual(
    wheel,
    value
  );


  /*
    清除上一個計時器
  */

  const oldTimer =
    scrollTimers.get(
      wheel
    );


  if (oldTimer) {

    clearTimeout(
      oldTimer
    );

  }


  /*
    使用者停止滑動約 90ms 後
    自動吸附到最近數字
  */

  const timer =
    setTimeout(
      () => {

        snapWheel(
          wheel
        );

      },
      90
    );


  scrollTimers.set(
    wheel,
    timer
  );

}


/* =========================================
   吸附
========================================= */

function snapWheel(
  wheel
) {

  const value =
    getWheelValue(
      wheel
    );


  wheel.scrollTo({

    top:
      value *
      ITEM_HEIGHT,

    behavior:
      "smooth"

  });


  /*
    更新選擇的數字
  */

  const wheelIndex =
    wheels.indexOf(
      wheel
    );


  if (
    wheelIndex !== -1
  ) {

    selectedDigits[
      wheelIndex
    ] = value;

  }


  updateWheelVisual(
    wheel,
    value
  );


  /*
    查詢詩歌
  */

  updateHymn();

}


/* =========================================
   取得滾輪目前數字
========================================= */

function getWheelValue(
  wheel
) {

  const value =
    Math.round(
      wheel.scrollTop /
      ITEM_HEIGHT
    );


  return Math.max(
    0,
    Math.min(
      9,
      value
    )
  );

}


/* =========================================
   滾輪視覺
========================================= */

function updateWheelVisual(
  wheel,
  selectedValue
) {

  const options =
    wheel.querySelectorAll(
      ".wheel-option"
    );


  options.forEach(
    option => {

      const value =
        Number(
          option.dataset.value
        );


      option.classList.toggle(
        "selected",
        value === selectedValue
      );

    }
  );

}


/* =========================================
   取得四位數歌號
========================================= */

function getSelectedNumber() {

  const thousands =
    getWheelValue(
      wheelThousands
    );


  const hundreds =
    getWheelValue(
      wheelHundreds
    );


  const tens =
    getWheelValue(
      wheelTens
    );


  const ones =
    getWheelValue(
      wheelOnes
    );


  selectedDigits = [

    thousands,
    hundreds,
    tens,
    ones

  ];


  return (
    thousands * 1000 +
    hundreds * 100 +
    tens * 10 +
    ones
  );

}


/* =========================================
   格式化四位數

   1 → 0001
   25 → 0025
   123 → 0123
========================================= */

function formatNumber(
  number
) {

  return String(
    number
  ).padStart(
    4,
    "0"
  );

}


/* =========================================
   查詢詩歌
========================================= */

function findHymn(
  book,
  code
) {

  const key =
    `${book}-${code}`;


  return (
    hymnIndex.get(
      key
    ) || null
  );

}


/* =========================================
   更新詩歌
========================================= */

function updateHymn() {

  const code =
    getSelectedNumber();


  const formattedNumber =
    formatNumber(
      code
    );


  /*
    更新畫面右上方歌號
  */

  numberDisplay.textContent =
    formattedNumber;


  /*
    0000 不查歌
  */

  if (
    code === 0
  ) {

    showNotFound(
      formattedNumber
    );

    return;
  }


  const hymn =
    findHymn(
      selectedBook,
      code
    );


  if (!hymn) {

    showNotFound(
      formattedNumber
    );

    return;
  }


  showHymn(
    hymn
  );

}


/* =========================================
   顯示詩歌
========================================= */

function showHymn(
  hymn
) {

  emptyState.classList.add(
    "hidden"
  );


  notFound.classList.add(
    "hidden"
  );


  hymnCard.classList.remove(
    "hidden"
  );


  const book =
    BOOKS.find(
      item =>
        item.id ===
        Number(hymn.book)
    );


  hymnBook.textContent =
    book
      ? book.name
      : `歌本 ${hymn.book}`;


  hymnTitle.textContent =
    hymn.title || "未命名詩歌";


  hymnNumber.textContent =
    `#${hymn.code}`;


  hymnLyrics.textContent =
    cleanLyrics(
      hymn
    );

}


/* =========================================
   清理歌詞

   因為資料庫的 lyrics 第一行
   很多時候與 title 相同。

   如果第一行就是標題，
   顯示時把重複標題拿掉。
========================================= */

function cleanLyrics(
  hymn
) {

  let lyrics =
    String(
      hymn.lyrics || ""
    )
      .replace(
        /\r\n/g,
        "\n"
      )
      .trim();


  const title =
    String(
      hymn.title || ""
    )
      .trim();


  if (!lyrics) {

    return "目前沒有歌詞資料。";

  }


  const lines =
    lyrics.split(
      "\n"
    );


  /*
    如果第一行等於 title
    移除第一行。
  */

  if (
    lines.length > 0 &&
    lines[0].trim() === title
  ) {

    lines.shift();

  }


  return lines
    .join("\n")
    .trim();

}


/* =========================================
   找不到詩歌
========================================= */

function showNotFound(
  number
) {

  emptyState.classList.add(
    "hidden"
  );


  hymnCard.classList.add(
    "hidden"
  );


  notFound.classList.remove(
    "hidden"
  );


  notFoundNumber.textContent =
    number;

}


/* =========================================
   初始化
========================================= */

function init() {

  /*
    1.
    建立 hymns 查詢索引
  */

  buildHymnIndex();


  /*
    2.
    建立歌本按鈕
  */

  createBookButtons();


  /*
    3.
    建立四個滾輪
  */

  createWheel(
    wheelThousands,
    selectedDigits[0]
  );


  createWheel(
    wheelHundreds,
    selectedDigits[1]
  );


  createWheel(
    wheelTens,
    selectedDigits[2]
  );


  createWheel(
    wheelOnes,
    selectedDigits[3]
  );


  /*
    4.
    初始歌本名稱
  */

  const book =
    BOOKS.find(
      item =>
        item.id ===
        selectedBook
    );


  currentBookName.textContent =
    book
      ? book.name
      : `歌本 ${selectedBook}`;


  /*
    5.
    等滾輪位置設定完成後
    顯示第一首
  */

  setTimeout(
    () => {

      updateHymn();

    },
    100
  );

}


/* =========================================
   啟動
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);