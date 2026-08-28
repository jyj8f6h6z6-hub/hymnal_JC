"use strict";


/* =========================================================
   基本設定
========================================================= */


/*
  CSS 每一格高度也是 70px。
  如果之後修改 CSS 的 wheel-option 高度，
  這裡也必須一起修改。
*/

const ITEM_HEIGHT = 70;


/*
  使用者停止滑動後多久進行吸附。
*/

const SNAP_DELAY = 55;


/*
  每個滾輪實際建立 5 組 0～9。

  使用者看到像無限循環：

  8
  9
  0
  1
  2
*/

const REPEAT_COUNT = 5;


/*
  一開始放在第 3 組，
  也就是中間位置。
*/

const MIDDLE_SET = 2;


/*
  滾輪停穩後，
  稍微延遲再載入詩歌。

  目的是：
  滾輪歸滾輪，
  詩歌載入歸詩歌。
*/

const HYMN_LOAD_DELAY = 180;



/* =========================================================
   詩歌本
========================================================= */

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



/* =========================================================
   主題
========================================================= */

const THEMES = [

  {
    id: "default",
    name: "灰藍",
    themeColor: "#f8fafc"
  },

  {
    id: "paper",
    name: "米白",
    themeColor: "#f8f4ec"
  },

  {
    id: "green",
    name: "護眼",
    themeColor: "#e8f1e8"
  },

  {
    id: "pink",
    name: "暖粉",
    themeColor: "#f8e8ea"
  },

  {
    id: "dark",
    name: "夜間",
    themeColor: "#171b20"
  }

];


let currentThemeIndex = 0;



/* =========================================================
   DOM
========================================================= */

const bookList =
  document.getElementById(
    "bookList"
  );


const currentBookName =
  document.getElementById(
    "currentBookName"
  );


const numberDisplay =
  document.getElementById(
    "numberDisplay"
  );



/* 滾輪 */

const wheelThousands =
  document.getElementById(
    "wheelThousands"
  );


const wheelHundreds =
  document.getElementById(
    "wheelHundreds"
  );


const wheelTens =
  document.getElementById(
    "wheelTens"
  );


const wheelOnes =
  document.getElementById(
    "wheelOnes"
  );


const wheels = [

  wheelThousands,
  wheelHundreds,
  wheelTens,
  wheelOnes

];



/* 詩歌區 */

const emptyState =
  document.getElementById(
    "emptyState"
  );


const hymnArea =
  document.getElementById(
    "hymnArea"
  );


const hymnCard =
  document.getElementById(
    "hymnCard"
  );


const notFound =
  document.getElementById(
    "notFound"
  );


const hymnBook =
  document.getElementById(
    "hymnBook"
  );


const hymnTitle =
  document.getElementById(
    "hymnTitle"
  );


const hymnNumber =
  document.getElementById(
    "hymnNumber"
  );


const hymnLyrics =
  document.getElementById(
    "hymnLyrics"
  );


const notFoundNumber =
  document.getElementById(
    "notFoundNumber"
  );



/* 主題 */

const themeButton =
  document.getElementById(
    "themeButton"
  );


const themeName =
  document.getElementById(
    "themeName"
  );



/* 搜尋 */

const searchInput =
  document.getElementById(
    "searchInput"
  );

const searchClear =
  document.getElementById(
    "searchClear"
  );

const searchSummary =
  document.getElementById(
    "searchSummary"
  );

const searchResults =
  document.getElementById(
    "searchResults"
  );

let searchTimer = null;



/* =========================================================
   APP 狀態
========================================================= */


/*
  預設：
  詩歌本
*/

let selectedBook = 1;


/*
  預設歌號：
  0001
*/

let selectedDigits = [

  0,
  0,
  0,
  1

];


/*
  每一個滾輪自己的停止計時器。
*/

const scrollTimers =
  new WeakMap();


/*
  詩歌載入 debounce。
*/

let hymnLoadTimer = null;



/* =========================================================
   建立詩歌索引
========================================================= */


/*
  hymns.js 本身是一個大型陣列。

  每筆資料：

  {
    book: 1,
    code: 1,
    title: "...",
    lyrics: "..."
  }


  我們先轉成 Map：

  "1-101"
  "2-35"
  "5-442"

  之後查歌就很快。
*/

const hymnIndex =
  new Map();


function buildHymnIndex() {


  if (
    typeof hymns === "undefined" ||
    !Array.isArray(hymns)
  ) {

    console.error(
      "找不到 hymns.js，或 hymns 不是陣列。"
    );

    return;

  }


  hymnIndex.clear();


  for (const hymn of hymns) {


    const book =
      Number(
        hymn.book
      );


    const code =
      Number(
        hymn.code
      );


    if (
      !Number.isFinite(book) ||
      !Number.isFinite(code)
    ) {

      continue;

    }


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



/* =========================================================
   主題
========================================================= */

function applyTheme(index) {


  /*
    保證永遠在有效範圍。
  */

  currentThemeIndex =
    (
      index +
      THEMES.length
    ) %
    THEMES.length;


  const theme =
    THEMES[
      currentThemeIndex
    ];


  /*
    default 不需要 data-theme。
  */

  if (
    theme.id === "default"
  ) {

    document.body.removeAttribute(
      "data-theme"
    );

  }

  else {

    document.body.dataset.theme =
      theme.id;

  }


  /*
    更新按鈕文字。
  */

  if (themeName) {

    themeName.textContent =
      theme.name;

  }


  /*
    更新瀏覽器 toolbar 顏色。
  */

  const themeMeta =
    document.querySelector(
      'meta[name="theme-color"]'
    );


  if (themeMeta) {

    themeMeta.setAttribute(
      "content",
      theme.themeColor
    );

  }


  /*
    儲存使用者偏好。
  */

  try {

    localStorage.setItem(
      "hymnalTheme",
      theme.id
    );

  }

  catch (error) {

    /*
      localStorage 被封鎖時，
      主題仍然可以正常使用。
    */

  }

}



function loadSavedTheme() {


  let savedTheme = null;


  try {

    savedTheme =
      localStorage.getItem(
        "hymnalTheme"
      );

  }

  catch (error) {

    savedTheme = null;

  }


  const savedIndex =
    THEMES.findIndex(
      theme =>
        theme.id === savedTheme
    );


  applyTheme(
    savedIndex >= 0
      ? savedIndex
      : 0
  );

}



function setupThemeButton() {


  if (!themeButton) {

    return;

  }


  themeButton.addEventListener(
    "click",
    () => {


      const nextTheme =
        (
          currentThemeIndex + 1
        ) %
        THEMES.length;


      applyTheme(
        nextTheme
      );

    }
  );

}



/* =========================================================
   建立歌本按鈕
========================================================= */

function createBookButtons() {


  bookList.innerHTML = "";


  BOOKS.forEach(
    book => {


      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "book-button";


      button.dataset.book =
        String(
          book.id
        );


      button.setAttribute(
        "aria-label",
        `選擇${book.name}`
      );


      /*
        有圖片：
        顯示書封。

        沒圖片：
        紅本 / 藍本暫時用文字。
      */

      const coverContent =
        book.image

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
        book.id ===
        selectedBook
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

    }
  );

}



/* =========================================================
   選擇歌本
========================================================= */

function selectBook(bookId) {


  selectedBook =
    Number(
      bookId
    );


  document
    .querySelectorAll(
      ".book-button"
    )
    .forEach(
      button => {


        const buttonBook =
          Number(
            button.dataset.book
          );


        const active =
          buttonBook ===
          selectedBook;


        button.classList.toggle(
          "active",
          active
        );


        button.setAttribute(
          "aria-pressed",
          active
            ? "true"
            : "false"
        );

      }
    );


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
    換歌本後，
    不影響滾輪。

    直接用目前歌號重新查歌。
  */

  scheduleHymnUpdate();

}



/* =========================================================
   建立數字滾輪
========================================================= */

function createWheel(
  wheel,
  initialValue
) {


  wheel.innerHTML = "";


  /*
    上方留白。

    讓第一個數字可以停在中央。
  */

  const topPadding =
    document.createElement(
      "div"
    );


  topPadding.className =
    "wheel-padding";


  wheel.appendChild(
    topPadding
  );



  /*
    建立多組 0～9。
  */

  for (
    let set = 0;
    set < REPEAT_COUNT;
    set++
  ) {


    for (
      let number = 0;
      number <= 9;
      number++
    ) {


      const option =
        document.createElement(
          "div"
        );


      option.className =
        "wheel-option";


      option.dataset.value =
        String(
          number
        );


      option.textContent =
        String(
          number
        );


      wheel.appendChild(
        option
      );

    }

  }



  /*
    下方留白。
  */

  const bottomPadding =
    document.createElement(
      "div"
    );


  bottomPadding.className =
    "wheel-padding";


  wheel.appendChild(
    bottomPadding
  );



  /*
    一開始直接移到中間那一組。
  */

  requestAnimationFrame(
    () => {


      const initialIndex =
        MIDDLE_SET * 10 +
        initialValue;


      wheel.scrollTop =
        initialIndex *
        ITEM_HEIGHT;


      updateWheelVisual(
        wheel,
        initialValue
      );

    }
  );



  /*
    滾動。
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
    鍵盤 ↑ ↓。
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



/* =========================================================
   鍵盤移動一格
========================================================= */

function stepWheel(
  wheel,
  direction
) {


  const index =
    Math.round(
      wheel.scrollTop /
      ITEM_HEIGHT
    );


  const newIndex =
    index +
    direction;


  wheel.scrollTo({

    top:
      newIndex *
      ITEM_HEIGHT,

    behavior:
      "smooth"

  });

}



/* =========================================================
   滾輪正在滑動
========================================================= */

function handleWheelScroll(
  wheel
) {


  const value =
    getWheelValue(
      wheel
    );


  /*
    只更新滾輪視覺。
  */

  updateWheelVisual(
    wheel,
    value
  );


  /*
    更新這一位數的狀態。
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


  /*
    即時更新 4 位數。

    這很輕量，
    不會載入詩歌。
  */

  numberDisplay.textContent =
    formatNumber(
      getSelectedNumber()
    );


  /*
    清除上一個吸附計時。
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
    停止滑動後才吸附。
  */

  const timer =
    setTimeout(
      () => {

        snapWheel(
          wheel
        );

      },
      SNAP_DELAY
    );


  scrollTimers.set(
    wheel,
    timer
  );

}



/* =========================================================
   滾輪吸附
========================================================= */

function snapWheel(
  wheel
) {


  const index =
    Math.round(
      wheel.scrollTop /
      ITEM_HEIGHT
    );


  const value =
    normalizeWheelValue(
      index
    );


  const target =
    index *
    ITEM_HEIGHT;


  /*
    已經非常接近中央時，
    不再開 smooth 動畫。

    避免畫面輕微抖動。
  */

  if (
    Math.abs(
      wheel.scrollTop -
      target
    ) < 2
  ) {

    wheel.scrollTop =
      target;

  }

  else {

    wheel.scrollTo({

      top: target,

      behavior: "smooth"

    });

  }


  /*
    記錄值。
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
    等吸附動作完成後，
    再處理循環位置。

    如果太靠近頂端或底端，
    偷偷搬回中間。

    使用者看到的數字完全一樣，
    所以不會發現。
  */

  setTimeout(
    () => {


      if (
        index < 10 ||
        index >=
          (
            REPEAT_COUNT - 1
          ) * 10
      ) {


        const middleIndex =
          MIDDLE_SET * 10 +
          value;


        wheel.scrollTop =
          middleIndex *
          ITEM_HEIGHT;

      }


      /*
        到這裡才通知：
        可以準備載入詩歌。

        滾輪操作和歌詞載入完全分開。
      */

      scheduleHymnUpdate();


    },
    110
  );

}



/* =========================================================
   將滾輪位置轉成 0～9
========================================================= */

function normalizeWheelValue(
  index
) {


  return (
    (
      index % 10
    ) + 10
  ) % 10;

}



/* =========================================================
   取得單一滾輪的值
========================================================= */

function getWheelValue(
  wheel
) {


  const index =
    Math.round(
      wheel.scrollTop /
      ITEM_HEIGHT
    );


  return normalizeWheelValue(
    index
  );

}



/* =========================================================
   滾輪選中樣式
========================================================= */

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
        value ===
        selectedValue
      );

    }
  );

}



/* =========================================================
   取得目前四位數
========================================================= */

function getSelectedNumber() {


  /*
    直接讀四個滾輪，
    保證畫面跟實際數字一致。
  */

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



/* =========================================================
   四位數顯示
========================================================= */

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



/* =========================================================
   詩歌載入排程
========================================================= */

function scheduleHymnUpdate() {


  /*
    如果使用者又滑了，
    前一個準備載入的詩歌取消。
  */

  if (
    hymnLoadTimer
  ) {

    clearTimeout(
      hymnLoadTimer
    );

  }


  hymnLoadTimer =
    setTimeout(
      () => {


        /*
          優先等瀏覽器空閒時處理。

          這樣比較不會干擾滾輪動畫。
        */

        if (
          "requestIdleCallback"
          in window
        ) {


          requestIdleCallback(
            () => {

              updateHymn();

            },
            {
              timeout: 350
            }
          );

        }

        else {


          /*
            Safari 等不支援
            requestIdleCallback 的瀏覽器。
          */

          setTimeout(
            () => {

              updateHymn();

            },
            0
          );

        }


      },
      HYMN_LOAD_DELAY
    );

}



/* =========================================================
   找詩歌
========================================================= */

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



/* =========================================================
   更新目前詩歌
========================================================= */

function updateHymn() {


  const code =
    getSelectedNumber();


  const formattedNumber =
    formatNumber(
      code
    );


  numberDisplay.textContent =
    formattedNumber;


  /*
    0000 不代表有效詩歌。
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



/* =========================================================
   顯示詩歌
========================================================= */

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
        Number(
          hymn.book
        )
    );


  hymnBook.textContent =
    book
      ? book.name
      : `歌本 ${hymn.book}`;


  hymnTitle.textContent =
    hymn.title
      ? String(
          hymn.title
        ).trim()
      : "未命名詩歌";


  hymnNumber.textContent =
    `第 ${hymn.code} 首`;


  /*
    同步手機橫向詩歌轉盤。
  */

  renderHymnCarousel(
    hymn
  );


  /*
    先整理歌詞，
    再於下一個畫面更新週期放進 DOM。
  */

  const lyrics =
    cleanLyrics(
      hymn
    );


  requestAnimationFrame(
    () => {

      hymnLyrics.textContent =
        lyrics;

    }
  );

}



/* =========================================================
   清理歌詞
========================================================= */

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
    很多資料的 lyrics 第一行
    本身又寫一次 title。

    如果完全相同，
    就把重複標題拿掉。
  */

  if (
    lines.length > 0 &&
    lines[0].trim() ===
      title
  ) {

    lines.shift();

  }


  return lines
    .join(
      "\n"
    )
    .trim();

}



/* =========================================================
   找不到詩歌
========================================================= */

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



/* =========================================================
   搜尋詩歌
========================================================= */

function normalizeSearchText(value) {

  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，。！？、；：,.!?;:\-—－「」『』（）()［］\[\]【】]/g, "");

}


function setupSearch() {

  if (!searchInput || !searchResults) {
    return;
  }

  searchInput.addEventListener(
    "input",
    () => {

      if (searchTimer) {
        clearTimeout(searchTimer);
      }

      searchTimer = setTimeout(
        () => {
          runSearch(searchInput.value);
        },
        120
      );

    }
  );

  searchInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        searchResults.querySelector(".search-result")
      ) {
        event.preventDefault();
        searchResults
          .querySelector(".search-result")
          .click();
      }

    }
  );

  if (searchClear) {

    searchClear.addEventListener(
      "click",
      () => {

        searchInput.value = "";
        clearSearchResults();
        searchInput.focus();

      }
    );

  }

}


function clearSearchResults() {

  if (searchResults) {
    searchResults.innerHTML = "";
    searchResults.classList.add("hidden");
  }

  if (searchSummary) {
    searchSummary.textContent = "";
    searchSummary.classList.add("hidden");
  }

  if (searchClear) {
    searchClear.classList.add("hidden");
  }

}


function runSearch(rawQuery) {

  const query = String(rawQuery || "").trim();

  if (searchClear) {
    searchClear.classList.toggle("hidden", !query);
  }

  if (!query) {
    clearSearchResults();
    return;
  }

  /*
    支援多關鍵字搜尋。

    例如：
    愛的 神 牧人

    會拆成：
    ["愛的", "神", "牧人"]

    空白數量不限；同一首詩歌只要
    每一個關鍵字都出現，就算符合。
  */
  const keywords = query
    .split(/\s+/)
    .map(normalizeSearchText)
    .filter(Boolean);

  if (keywords.length === 0) {
    clearSearchResults();
    return;
  }

  const normalizedQuery = normalizeSearchText(query);
  const numericQuery = keywords.length === 1 && /^\d{1,4}$/.test(query)
    ? Number(query)
    : null;

  const matches = [];

  for (const hymn of hymns) {

    const title = normalizeSearchText(hymn.title);
    const lyrics = normalizeSearchText(hymn.lyrics);
    const code = Number(hymn.code);

    /*
      標題與歌詞合併後做 AND 搜尋。
      這樣關鍵字可以一個在標題、一個在歌詞，
      也可以全部都在歌詞中。
    */
    const searchableText = `${title}${lyrics}`;
    const allKeywordsMatch = keywords.every(
      keyword => searchableText.includes(keyword)
    );

    let score = 99;

    if (numericQuery !== null && code === numericQuery) {
      score = 0;
    }
    else if (keywords.length === 1 && title === normalizedQuery) {
      score = 1;
    }
    else if (keywords.length === 1 && title.startsWith(normalizedQuery)) {
      score = 2;
    }
    else if (keywords.length === 1 && title.includes(normalizedQuery)) {
      score = 3;
    }
    else if (keywords.length === 1 && lyrics.includes(normalizedQuery)) {
      score = 4;
    }
    else if (allKeywordsMatch) {
      /*
        多關鍵字全部出現在標題者優先，
        再來才是分散在標題／歌詞中的結果。
      */
      const allInTitle = keywords.every(
        keyword => title.includes(keyword)
      );

      score = allInTitle ? 5 : 6;
    }
    else {
      continue;
    }

    matches.push({ hymn, score });

  }

  matches.sort(
    (a, b) =>
      a.score - b.score ||
      Number(a.hymn.book) - Number(b.hymn.book) ||
      Number(a.hymn.code) - Number(b.hymn.code)
  );

  renderSearchResults(matches);

}


function renderSearchResults(matches) {

  searchResults.innerHTML = "";
  searchResults.classList.remove("hidden");

  const total = matches.length;
  const visibleMatches = matches.slice(0, 50);

  if (searchSummary) {
    searchSummary.classList.remove("hidden");
    searchSummary.textContent = total > 50
      ? `找到 ${total} 首，顯示前 50 首`
      : `找到 ${total} 首`;
  }

  if (total === 0) {

    const empty = document.createElement("div");
    empty.className = "search-no-result";
    empty.textContent = "找不到符合的詩歌";
    searchResults.appendChild(empty);
    return;

  }

  for (const item of visibleMatches) {

    const hymn = item.hymn;
    const book = BOOKS.find(
      current => current.id === Number(hymn.book)
    );

    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";

    const top = document.createElement("div");
    top.className = "search-result-top";

    const bookName = document.createElement("span");
    bookName.className = "search-result-book";
    bookName.textContent = book ? book.name : `歌本 ${hymn.book}`;

    const number = document.createElement("span");
    number.className = "search-result-number";
    number.textContent = `第 ${hymn.code} 首`;

    const title = document.createElement("div");
    title.className = "search-result-title";
    title.textContent = hymn.title || "未命名詩歌";

    top.appendChild(bookName);
    top.appendChild(number);
    button.appendChild(top);
    button.appendChild(title);

    button.addEventListener(
      "click",
      () => {
        openSearchResult(hymn);
      }
    );

    searchResults.appendChild(button);

  }

}


function setSelectedNumber(number) {

  const safeNumber = Math.max(
    0,
    Math.min(9999, Number(number) || 0)
  );

  const formatted = formatNumber(safeNumber);

  selectedDigits = formatted
    .split("")
    .map(Number);

  wheels.forEach(
    (wheel, index) => {

      const value = selectedDigits[index];
      const middleIndex = MIDDLE_SET * 10 + value;

      wheel.scrollTop = middleIndex * ITEM_HEIGHT;
      updateWheelVisual(wheel, value);

    }
  );

  numberDisplay.textContent = formatted;

}


function openSearchResult(hymn) {

  if (!hymn) {
    return;
  }

  selectBook(hymn.book);
  setSelectedNumber(hymn.code);
  showHymn(hymn);

  if (hymnArea) {
    hymnArea.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

}



/* =========================================================
   手機詩歌橫向轉盤
   - 顯示目前詩歌前後各 5 首
   - 可一次滑動 1～5 首
   - 放手後自動吸附
   - 歌號、四位數滾輪、歌名、歌詞同步更新
========================================================= */

let hymnCarousel = null;
let hymnCarouselTrack = null;
let hymnCarouselTimer = null;
let hymnCarouselIgnoreScroll = false;


function getHymnsForCurrentBook() {

  if (
    typeof hymns === "undefined" ||
    !Array.isArray(hymns)
  ) {
    return [];
  }


  return hymns
    .filter(
      hymn =>
        Number(hymn.book) ===
        Number(selectedBook)
    )
    .slice()
    .sort(
      (a, b) =>
        Number(a.code) -
        Number(b.code)
    );

}


function ensureHymnCarousel() {

  if (
    hymnCarousel
  ) {
    return;
  }


  const hymnTop =
    document.querySelector(
      ".hymn-top"
    );


  if (
    !hymnTop ||
    !hymnTop.parentNode
  ) {
    return;
  }


  hymnCarousel =
    document.createElement(
      "div"
    );


  hymnCarousel.className =
    "hymn-carousel";


  hymnCarousel.setAttribute(
    "aria-label",
    "左右滑動選擇鄰近詩歌"
  );


  hymnCarouselTrack =
    document.createElement(
      "div"
    );


  hymnCarouselTrack.className =
    "hymn-carousel-track";


  hymnCarousel.appendChild(
    hymnCarouselTrack
  );


  /*
    放在原本標題區後面。
    桌面仍顯示原本 hymn-top；
    手機用 CSS 改顯示這個橫向轉盤。
  */

  hymnTop.insertAdjacentElement(
    "afterend",
    hymnCarousel
  );


  hymnCarousel.addEventListener(
    "scroll",
    () => {


      if (
        hymnCarouselIgnoreScroll
      ) {
        return;
      }


      clearTimeout(
        hymnCarouselTimer
      );


      hymnCarouselTimer =
        setTimeout(
          () => {

            selectCenteredCarouselItem();

          },
          120
        );

    },
    {
      passive: true
    }
  );

}


function renderHymnCarousel(
  currentHymn
) {

  ensureHymnCarousel();


  if (
    !hymnCarousel ||
    !hymnCarouselTrack ||
    !currentHymn
  ) {
    return;
  }


  const bookHymns =
    getHymnsForCurrentBook();


  if (
    !bookHymns.length
  ) {
    return;
  }


  const currentIndex =
    bookHymns.findIndex(
      hymn =>
        Number(hymn.code) ===
        Number(currentHymn.code)
    );


  if (
    currentIndex === -1
  ) {
    return;
  }


  /*
    真正可滑動的範圍：
    目前詩歌前後最多各 5 首。
    因此一次手勢最多不會超過 5 首。
  */

  const startIndex =
    Math.max(
      0,
      currentIndex - 5
    );


  const endIndex =
    Math.min(
      bookHymns.length - 1,
      currentIndex + 5
    );


  const visibleHymns =
    bookHymns.slice(
      startIndex,
      endIndex + 1
    );


  const book =
    BOOKS.find(
      item =>
        item.id ===
        Number(currentHymn.book)
    );


  const bookName =
    book
      ? book.name
      : `歌本 ${currentHymn.book}`;


  hymnCarouselTrack.innerHTML =
    "";


  visibleHymns.forEach(
    hymn => {


      const item =
        document.createElement(
          "button"
        );


      item.type =
        "button";


      item.className =
        "hymn-carousel-item";


      item.dataset.code =
        String(
          hymn.code
        );


      item.dataset.bookIndex =
        String(
          bookHymns.indexOf(
            hymn
          )
        );


      if (
        Number(hymn.code) ===
        Number(currentHymn.code)
      ) {

        item.classList.add(
          "active"
        );

        item.setAttribute(
          "aria-current",
          "true"
        );

      }


      const number =
        document.createElement(
          "div"
        );


      number.className =
        "hymn-carousel-number";


      number.textContent =
        `第 ${hymn.code} 首`;


      const label =
        document.createElement(
          "div"
        );


      label.className =
        "hymn-carousel-book";


      label.textContent =
        bookName;


      const title =
        document.createElement(
          "div"
        );


      title.className =
        "hymn-carousel-title";


      title.textContent =
        hymn.title
          ? String(
              hymn.title
            ).trim()
          : "未命名詩歌";


      item.appendChild(
        number
      );


      item.appendChild(
        label
      );


      item.appendChild(
        title
      );


      item.addEventListener(
        "click",
        () => {

          selectCarouselHymn(
            hymn
          );

        }
      );


      hymnCarouselTrack.appendChild(
        item
      );

    }
  );


  /*
    讓目前詩歌位於轉盤中央。
    使用 instant/auto，不產生初始化滑動動畫。
  */

  requestAnimationFrame(
    () => {


      const active =
        hymnCarouselTrack.querySelector(
          ".hymn-carousel-item.active"
        );


      if (
        !active
      ) {
        return;
      }


      hymnCarouselIgnoreScroll =
        true;


      const targetLeft =
        active.offsetLeft -
        (
          hymnCarousel.clientWidth -
          active.offsetWidth
        ) /
        2;


      hymnCarousel.scrollTo({
        left:
          Math.max(
            0,
            targetLeft
          ),
        behavior:
          "auto"
      });


      requestAnimationFrame(
        () => {

          hymnCarouselIgnoreScroll =
            false;

        }
      );

    }
  );

}


function getCenteredCarouselItem() {

  if (
    !hymnCarousel ||
    !hymnCarouselTrack
  ) {
    return null;
  }


  const items =
    Array.from(
      hymnCarouselTrack.querySelectorAll(
        ".hymn-carousel-item"
      )
    );


  if (
    !items.length
  ) {
    return null;
  }


  const viewportCenter =
    hymnCarousel.scrollLeft +
    hymnCarousel.clientWidth / 2;


  let closest =
    null;


  let closestDistance =
    Infinity;


  for (
    const item of items
  ) {

    const itemCenter =
      item.offsetLeft +
      item.offsetWidth / 2;


    const distance =
      Math.abs(
        itemCenter -
        viewportCenter
      );


    if (
      distance <
      closestDistance
    ) {

      closest =
        item;

      closestDistance =
        distance;

    }

  }


  return closest;

}


function selectCenteredCarouselItem() {

  const item =
    getCenteredCarouselItem();


  if (
    !item
  ) {
    return;
  }


  const code =
    Number(
      item.dataset.code
    );


  if (
    !Number.isFinite(
      code
    )
  ) {
    return;
  }


  /*
    如果仍是目前這首，只把它精準吸附到中央。
  */

  if (
    code ===
    Number(
      getSelectedNumber()
    )
  ) {

    const targetLeft =
      item.offsetLeft -
      (
        hymnCarousel.clientWidth -
        item.offsetWidth
      ) /
      2;


    hymnCarouselIgnoreScroll =
      true;


    hymnCarousel.scrollTo({
      left:
        Math.max(
          0,
          targetLeft
        ),
      behavior:
        "auto"
    });


    requestAnimationFrame(
      () => {

        hymnCarouselIgnoreScroll =
          false;

      }
    );


    return;

  }


  const bookHymns =
    getHymnsForCurrentBook();


  const hymn =
    bookHymns.find(
      item =>
        Number(item.code) ===
        code
    );


  if (
    hymn
  ) {

    selectCarouselHymn(
      hymn
    );

  }

}


function selectCarouselHymn(
  hymn
) {

  if (
    !hymn
  ) {
    return;
  }


  /*
    同步上方四位數滾輪。
  */

  setSelectedNumber(
    hymn.code
  );


  /*
    更新標題、歌號、歌本與整首歌詞。
    showHymn 最後會重新建立以新歌為中心的轉盤。
  */

  showHymn(
    hymn
  );

}


function setupHymnCarousel() {

  ensureHymnCarousel();

}


/* =========================================================
   初始化
========================================================= */

function init() {


  /*
    1.
    載入上次使用的主題。
  */

  loadSavedTheme();


  /*
    2.
    主題按鈕。
  */

  setupThemeButton();


  /*
    3.
    建立詩歌索引。
  */

  buildHymnIndex();


  /*
    搜尋功能。
  */

  setupSearch();


  /*
    手機詩歌標題區啟用橫向轉盤，可一次滑動鄰近多首。
  */

  setupHymnCarousel();


  /*
    4.
    建立歌本。
  */

  createBookButtons();


  /*
    5.
    建立四個循環滾輪。
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
    6.
    預設歌本名稱。
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
    7.
    等滾輪初始位置放好後，
    顯示第 1 首。
  */

  setTimeout(
    () => {

      scheduleHymnUpdate();

    },
    180
  );

}



/* =========================================================
   啟動
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);