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
  },

  {
    id: 7,
    name: "其他詩歌",
    image: null,
    textIcon: "其他\n詩歌"
  }

];

/* 歌詞標題列使用的歌本簡稱 */
function getCompactBookName(bookId) {
  const compactNames = {
    1: "詩歌本",
    2: "詩歌補充本",
    3: "新歌頌詠",
    4: "紅本新詩",
    5: "兒童詩歌",
    6: "藍本新詩",
    7: "其他詩歌"
  };

  return compactNames[Number(bookId)] || `歌本${bookId}`;
}





/* =========================================================
   主題
========================================================= */

/*
  v2.5.0：主題擴充為 13 種。
  group：面板分組（light／dark／special）；
  swatchBg、swatchText：面板色塊預覽用，需與 style.css 中該主題的 --card-bg、--text-main 一致。
*/
const THEMES = [
  {
    id: "default",
    name: "灰藍",
    group: "light",
    themeColor: "#f8fafc",
    swatchBg: "#ffffff",
    swatchText: "#172033"
  },
  {
    id: "paper",
    name: "米白",
    group: "light",
    themeColor: "#f8f4ec",
    swatchBg: "#fffdf8",
    swatchText: "#40362c"
  },
  {
    id: "green",
    name: "護眼",
    group: "light",
    themeColor: "#e8f1e8",
    swatchBg: "#f5f8f4",
    swatchText: "#33453a"
  },
  {
    id: "pink",
    name: "暖粉",
    group: "light",
    themeColor: "#f8e8ea",
    swatchBg: "#fff8f9",
    swatchText: "#533b40"
  },
  {
    id: "lavender",
    name: "薰衣草",
    group: "light",
    themeColor: "#eeeaf7",
    swatchBg: "#f9f7fd",
    swatchText: "#3b3552"
  },
  {
    id: "sky",
    name: "天藍",
    group: "light",
    themeColor: "#e6f0f8",
    swatchBg: "#f6fafd",
    swatchText: "#243b4d"
  },
  {
    id: "cream",
    name: "奶油黃",
    group: "light",
    themeColor: "#f7f0d2",
    swatchBg: "#fffbea",
    swatchText: "#4a3f1f"
  },
  {
    id: "dark",
    name: "夜間",
    group: "dark",
    themeColor: "#171b20",
    swatchBg: "#20262d",
    swatchText: "#f2f5f7"
  },
  {
    id: "midnight",
    name: "深藍夜",
    group: "dark",
    themeColor: "#0d141f",
    swatchBg: "#16202e",
    swatchText: "#e6edf7"
  },
  {
    id: "warm",
    name: "暖黑",
    group: "dark",
    themeColor: "#171410",
    swatchBg: "#231f1a",
    swatchText: "#eadfce"
  },
  {
    id: "black",
    name: "純黑",
    group: "dark",
    themeColor: "#000000",
    swatchBg: "#000000",
    swatchText: "#d9d9d9"
  },
  {
    id: "amber",
    name: "琥珀暗室",
    group: "special",
    themeColor: "#120d04",
    swatchBg: "#1c1408",
    swatchText: "#f0c27a"
  },
  {
    id: "contrast",
    name: "黑底黃字",
    group: "special",
    themeColor: "#000000",
    swatchBg: "#000000",
    swatchText: "#ffe74a"
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

const numberSection = document.querySelector(".number-section");
const emptyTitle = document.querySelector(".empty-title");
const emptyText = document.querySelector(".empty-text");



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


  /*
    v2.5.0：頂端按鈕改為展開「顯示設定」面板（enhancements.js），
    不再逐一切換主題。若面板尚未載入，退回原本的切換行為。
  */
  themeButton.addEventListener(
    "click",
    () => {

      if (typeof toggleDisplayPanel === "function") {

        toggleDisplayPanel();
        return;

      }

      applyTheme(
        (
          currentThemeIndex + 1
        ) %
        THEMES.length
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
   v2.0｜歌本操作模式
   - 1～6：正式首數，使用數字轉盤
   - 7：其他詩歌，只使用歌名／歌詞搜尋
========================================================= */

function isOtherSongsBook(bookId = selectedBook) {
  return Number(bookId) === 7;
}

function applyBookMode() {
  const otherMode = isOtherSongsBook();

  document.body.classList.toggle("other-songs-mode", otherMode);

  if (numberSection) {
    numberSection.classList.toggle("hidden", otherMode);
    numberSection.setAttribute("aria-hidden", otherMode ? "true" : "false");
  }

  if (searchInput) {
    searchInput.placeholder = otherMode
      ? "搜尋其他詩歌的歌名或歌詞"
      : "輸入歌號、歌名或歌詞搜尋";
    searchInput.setAttribute(
      "aria-label",
      otherMode ? "搜尋其他詩歌的歌名或歌詞" : "輸入歌號、歌名或歌詞搜尋"
    );
  }

  if (otherMode) {
    if (hymnLoadTimer) {
      clearTimeout(hymnLoadTimer);
      hymnLoadTimer = null;
    }
    hymnCard.classList.add("hidden");
    notFound.classList.add("hidden");
    emptyState.classList.remove("hidden");
    if (emptyTitle) emptyTitle.textContent = "搜尋其他詩歌";
    if (emptyText) emptyText.textContent = "輸入歌名或歌詞即可尋找";
  } else {
    if (emptyTitle) emptyTitle.textContent = "選一首詩歌";
    if (emptyText) emptyText.textContent = "滑動歌號，或從上方搜尋";
  }

  if (searchInput && searchInput.value.trim()) {
    runSearch(searchInput.value);
  } else {
    clearSearchResults();
  }
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


  /* v2.0：其他詩歌沒有對外顯示的固定首數，不使用數字轉盤。 */
  applyBookMode();

  if (!isOtherSongsBook()) {
    scheduleHymnUpdate();
  }

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



// v2.3.0：每幀最多更新一次轉盤選中樣式與歌號，避免高速滑動時反覆修改 DOM。
const pendingWheelVisuals = new Map();
let wheelVisualFrame = 0;
function scheduleWheelVisualUpdate(wheel, value) {
  pendingWheelVisuals.set(wheel, value);
  if (wheelVisualFrame) return;
  wheelVisualFrame = requestAnimationFrame(() => {
    wheelVisualFrame = 0;
    for (const [target, selected] of pendingWheelVisuals) updateWheelVisual(target, selected);
    pendingWheelVisuals.clear();
  });
}
let numberDisplayFrame = 0;
function scheduleNumberDisplayUpdate() {
  if (numberDisplayFrame) return;
  numberDisplayFrame = requestAnimationFrame(() => {
    numberDisplayFrame = 0;
    const value = formatNumber(getSelectedNumber());
    if (numberDisplay.textContent !== value) numberDisplay.textContent = value;
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

  scheduleWheelVisualUpdate(wheel, value);


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

  scheduleNumberDisplayUpdate();


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

  if (isOtherSongsBook()) {
    return;
  }

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


  const otherSong = isOtherSongsBook(hymn.book);

  hymnBook.textContent = otherSong
    ? ""
    : `${getCompactBookName(hymn.book)}．${hymn.code}`;

  hymnBook.classList.toggle("hidden", otherSong);
  hymnCard.classList.toggle("other-song-reading", otherSong);

  hymnTitle.textContent =
    hymn.title
      ? String(hymn.title).trim()
      : "未命名詩歌";

  /*
    首數已併入左側簡寫，例如「補．2」，
    不再另外顯示「第 2 首」。
  */
  hymnNumber.textContent = "";


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

      renderLyrics(hymnLyrics, lyrics);

    }
  );

}



/* =========================================================
   v2.8.0｜歌詞分段顯示
   資料（hymns.js）不變，仍以空白行分節；
   顯示時才依空白行切成一段一段，段與段的間距由「段距」控制。
========================================================= */

function renderLyrics(element, text) {

  if (!element) {
    return;
  }

  const blocks =
    String(text || "")
      .replace(/\r\n/g, "\n")
      .split(/\n[ \t\u3000]*\n+/)
      .map(block => block.replace(/^\n+|\n+$/g, ""))
      .filter(block => block.length > 0);

  const fragment =
    document.createDocumentFragment();

  blocks.forEach(
    block => {

      const paragraph =
        document.createElement("div");

      paragraph.className =
        "lyrics-para";

      paragraph.textContent =
        block;

      fragment.appendChild(
        paragraph
      );

    }
  );

  element.textContent = "";
  element.appendChild(fragment);

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


// v2.3.0：歌詞只正規化一次；索引保留原始 hymns 的排序與物件參照。
let cachedSearchIndex = null;
function getSearchIndex() {
  if (!cachedSearchIndex) {
    cachedSearchIndex = hymns.map(hymn => {
      const title = normalizeSearchText(hymn.title);
      const lyrics = normalizeSearchText(hymn.lyrics);
      return { hymn, title, lyrics, searchableText: title + lyrics, code: Number(hymn.code) };
    });
  }
  return cachedSearchIndex;
}

// 與原版相同：非重疊計數，避免重複關鍵字改變搜尋結果。
function countSearchOccurrences(text, keyword) {
  let count = 0, startIndex = 0;
  while (true) {
    const foundIndex = text.indexOf(keyword, startIndex);
    if (foundIndex === -1) return count;
    count++;
    startIndex = foundIndex + keyword.length;
  }
}


function setupSearch() {

  if (!searchInput || !searchResults) {
    return;
  }

  setupSearchSuggest();

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

      if (handleSuggestKey(event)) {
        return;
      }

      if (
        event.key === "Enter" &&
        searchResults.querySelector(".search-result")
      ) {
        closeSearchSuggest();
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
        closeSearchSuggest();
        clearSearchResults();
        searchInput.focus();

      }
    );

  }

}


/* =========================================================
   v2.4.0｜搜尋提示詞
   輸入一個字起，列出「歌名／詞語／短句」供點選。
   - 歌名：標題含有輸入文字
   - 詞語：從歌詞中把輸入文字往後延伸 1～3 字，取出現最多者
   - 短句：歌詞中以標點切開的短句
   純數字不提示（直接搜尋歌號）。
========================================================= */

const SUGGEST_MAX_TITLES = 3;
const SUGGEST_MAX_WORDS = 3;
const SUGGEST_MAX_CLAUSES = 4;

let suggestIndex = null;
let suggestBox = null;
let suggestItems = [];
let suggestActive = -1;
let suggestTimer = null;
let suggestToken = "";

const SUGGEST_STOP_END = "的了是所我你他她祂在與和就也都要把被對為以又並而有之這那不";
const CJK_PATTERN = /[㐀-鿿]/;

function buildSuggestIndex() {

  if (suggestIndex) return suggestIndex;

  const clauseMap = new Map();      // key -> { n }
  const titleMap = new Map();       // key -> { text, n }

  const hymnList = Array.isArray(hymns) ? hymns : [];

  hymnList.forEach((hymn, hymnIndex) => {

    const titleText = String(hymn.title || "").trim();
    const titleKey = normalizeSearchText(titleText);

    if (titleKey && CJK_PATTERN.test(titleKey)) {
      const old = titleMap.get(titleKey);
      if (old) old.n++;
      else titleMap.set(titleKey, { text: titleText, n: 1 });
    }

    const lines = String(hymn.lyrics || "").split(/\r?\n/);

    for (const line of lines) {

      // 略過調號、拍號、歌號等非歌詞行，例如「降 A大調4/4」「8583(英1)」。
      if (/\d\s*\/\s*\d|[大小]調|^\s*[\d(（]/.test(line)) continue;

      const parts = line.split(/[，。；：！？、,.;:!?「」『』（）()—\-－\s]+/);

      for (const part of parts) {

        const key = normalizeSearchText(part);
        if (key.length < 2 || key.length > 16) continue;
        if (!CJK_PATTERN.test(key)) continue;

        const entry = clauseMap.get(key);
        if (entry) {
          if (entry.last !== hymnIndex) {
            entry.n++;
            entry.last = hymnIndex;
          }
        } else {
          clauseMap.set(key, { n: 1, last: hymnIndex });
        }

      }

    }

  });

  suggestIndex = {
    clauses: Array.from(clauseMap, ([key, v]) => [key, v.n]),
    titles: Array.from(titleMap, ([key, v]) => [key, v.text, v.n])
  };

  return suggestIndex;

}

function getSuggestions(token) {

  const q = normalizeSearchText(token);

  if (!q || q.length > 10) return [];
  if (/^\d+$/.test(q)) return [];
  if (!CJK_PATTERN.test(q) && q.length < 2) return [];

  const index = buildSuggestIndex();
  const out = [];
  const used = new Set();

  /* 1. 歌名 */
  const titleHits = [];
  for (const [key, text, n] of index.titles) {
    const pos = key.indexOf(q);
    if (pos === -1) continue;
    titleHits.push({ key, text, n, starts: pos === 0 });
  }
  titleHits.sort(
    (a, b) =>
      (b.starts - a.starts) ||
      (b.n - a.n) ||
      (a.key.length - b.key.length)
  );
  for (const hit of titleHits.slice(0, SUGGEST_MAX_TITLES)) {
    out.push({ type: "title", label: "歌名", text: hit.text });
    used.add(hit.key);
  }

  /* 2. 詞語：輸入文字 + 往後 1～3 字 */
  if (q.length <= 3) {

    const grams = new Map();

    for (const [key, n] of index.clauses) {
      let from = 0;
      while (true) {
        const i = key.indexOf(q, from);
        if (i === -1) break;
        for (let k = 1; k <= 3; k++) {
          const end = i + q.length + k;
          if (end > key.length) break;
          const gram = key.slice(i, end);
          if (gram.length < 2) continue;
          grams.set(gram, (grams.get(gram) || 0) + n);
        }
        from = i + 1;
      }
    }

    const minCount = q.length >= 2 ? 2 : 3;

    // 若較長的詞出現次數與較短的差不多，只留較長者，避免「神的」「神的愛」重複。
    // 結尾是「的、了、是…」這類虛字的片段不像詞語，先排除。
    const list = Array.from(grams).filter(
      ([gram, n]) => n >= minCount && !SUGGEST_STOP_END.includes(gram[gram.length - 1])
    );
    const byText = new Map(list);
    const filtered = list.filter(([gram, n]) => {
      for (const [other, m] of byText) {
        if (other.length > gram.length && other.startsWith(gram) && m >= n * 0.8) {
          return false;
        }
      }
      return true;
    });

    filtered.sort((a, b) => b[1] - a[1] || a[0].length - b[0].length);

    let added = 0;
    for (const [gram] of filtered) {
      if (added >= SUGGEST_MAX_WORDS) break;
      if (gram === q || used.has(gram)) continue;
      out.push({ type: "word", label: "詞語", text: gram });
      used.add(gram);
      added++;
    }

  }

  /* 3. 短句：以輸入文字開頭者優先 */
  const clauseHits = [];
  for (const [key, n] of index.clauses) {
    if (key.length < 3 || key === q || used.has(key)) continue;
    const pos = key.indexOf(q);
    if (pos === -1) continue;
    clauseHits.push({ key, n, starts: pos === 0 });
  }
  clauseHits.sort(
    (a, b) =>
      (b.starts - a.starts) ||
      (b.n - a.n) ||
      (a.key.length - b.key.length)
  );
  for (const hit of clauseHits.slice(0, SUGGEST_MAX_CLAUSES)) {
    out.push({ type: "clause", label: "短句", text: hit.key });
  }

  return out;

}

function getSuggestToken() {
  // 以最後一個空白後的文字作為提示依據，其餘關鍵字保留。
  const value = searchInput.value;
  const match = value.match(/^(.*\s)?(\S*)$/);
  return { head: (match && match[1]) || "", token: (match && match[2]) || "" };
}

function closeSearchSuggest() {
  if (suggestTimer) {
    clearTimeout(suggestTimer);
    suggestTimer = null;
  }
  suggestItems = [];
  suggestActive = -1;
  if (suggestBox) {
    suggestBox.innerHTML = "";
    suggestBox.classList.add("hidden");
  }
  const section = searchInput && searchInput.closest(".search-section");
  if (section) section.classList.remove("suggest-open");
}

function highlightSuggestRow() {
  if (!suggestBox) return;
  suggestBox.querySelectorAll(".search-suggest-item").forEach((el, i) => {
    el.classList.toggle("active", i === suggestActive);
    el.setAttribute("aria-selected", i === suggestActive ? "true" : "false");
  });
}

function applySuggestion(item) {
  const { head } = getSuggestToken();
  searchInput.value = head + item.text;
  closeSearchSuggest();
  if (searchTimer) clearTimeout(searchTimer);
  runSearch(searchInput.value);
}

function showAllResultsFromSuggest() {
  closeSearchSuggest();
  if (searchTimer) clearTimeout(searchTimer);
  runSearch(searchInput.value);
}

function renderSearchSuggest() {

  if (!suggestBox) return;

  const { token } = getSuggestToken();
  suggestToken = token;
  suggestItems = getSuggestions(token);

  if (suggestItems.length === 0) {
    closeSearchSuggest();
    return;
  }

  suggestBox.innerHTML = "";
  suggestActive = -1;

  // 第一列：直接查看目前輸入的全部搜尋結果。
  const all = document.createElement("button");
  all.type = "button";
  all.className = "search-suggest-item search-suggest-all";
  all.setAttribute("role", "option");
  all.innerHTML = '<span class="search-suggest-tag">搜尋</span><span class="search-suggest-text"></span>';
  all.querySelector(".search-suggest-text").textContent = `查看「${searchInput.value.trim()}」的全部結果`;
  all.addEventListener("click", showAllResultsFromSuggest);
  suggestBox.appendChild(all);

  const q = normalizeSearchText(token);

  for (const item of suggestItems) {

    const row = document.createElement("button");
    row.type = "button";
    row.className = "search-suggest-item";
    row.setAttribute("role", "option");

    const tag = document.createElement("span");
    tag.className = "search-suggest-tag";
    tag.textContent = item.label;

    const text = document.createElement("span");
    text.className = "search-suggest-text";

    // 將輸入的文字標粗。
    const lower = item.text.toLowerCase();
    const pos = q ? lower.indexOf(q) : -1;
    if (pos >= 0) {
      text.appendChild(document.createTextNode(item.text.slice(0, pos)));
      const strong = document.createElement("strong");
      strong.textContent = item.text.slice(pos, pos + q.length);
      text.appendChild(strong);
      text.appendChild(document.createTextNode(item.text.slice(pos + q.length)));
    } else {
      text.textContent = item.text;
    }

    row.appendChild(tag);
    row.appendChild(text);
    row.addEventListener("click", () => applySuggestion(item));
    suggestBox.appendChild(row);

  }

  suggestBox.classList.remove("hidden");
  const section = searchInput.closest(".search-section");
  if (section) section.classList.add("suggest-open");

}

function handleSuggestKey(event) {

  // 回傳 true 代表已處理（呼叫端不再往下執行）。
  if (!suggestBox || suggestBox.classList.contains("hidden")) return false;

  const rows = suggestBox.querySelectorAll(".search-suggest-item");

  if (event.key === "Escape") {
    closeSearchSuggest();
    return true;
  }

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const step = event.key === "ArrowDown" ? 1 : -1;
    suggestActive = (suggestActive + 1 + step + rows.length + 1) % (rows.length + 1) - 1;
    highlightSuggestRow();
    return true;
  }

  if (event.key === "Enter" && suggestActive >= 0 && rows[suggestActive]) {
    event.preventDefault();
    rows[suggestActive].click();
    return true;
  }

  return false;

}

function setupSearchSuggest() {

  if (!searchInput || suggestBox) return;

  suggestBox = document.createElement("div");
  suggestBox.id = "searchSuggest";
  suggestBox.className = "search-suggest hidden";
  suggestBox.setAttribute("role", "listbox");
  suggestBox.setAttribute("aria-label", "搜尋提示詞");

  const box = searchInput.closest(".search-box");
  if (box && box.parentNode) {
    box.parentNode.insertBefore(suggestBox, box.nextSibling);
  } else {
    searchInput.parentNode.appendChild(suggestBox);
  }

  const schedule = () => {
    if (suggestTimer) clearTimeout(suggestTimer);
    suggestTimer = setTimeout(renderSearchSuggest, 60);
  };

  searchInput.addEventListener("input", event => {
    if (event.isComposing) return;   // 注音／拼音組字中不提示
    if (!searchInput.value.trim()) {
      closeSearchSuggest();
      return;
    }
    schedule();
  });

  searchInput.addEventListener("compositionend", () => {
    if (searchInput.value.trim()) schedule();
  });

  searchInput.addEventListener("focus", () => {
    // 第一次使用時在背景建立索引，之後輸入才不會卡頓。
    buildSuggestIndex();
    if (searchInput.value.trim() && suggestBox.classList.contains("hidden")) schedule();
  });

  // 點搜尋區以外的地方就收起提示。
  document.addEventListener("pointerdown", event => {
    if (!suggestBox || suggestBox.classList.contains("hidden")) return;
    if (event.target.closest && event.target.closest(".search-section")) return;
    closeSearchSuggest();
  });

  // 啟動後閒置時預先建立索引。
  const warm = () => { try { buildSuggestIndex(); } catch (error) { /* 忽略 */ } };
  if ("requestIdleCallback" in window) {
    requestIdleCallback(warm, { timeout: 4000 });
  } else {
    setTimeout(warm, 2500);
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
  // 複數關鍵字需求只需計算一次，而不是逐首重複建立 Map。
  const keywordCounts = new Map();
  for (const keyword of keywords) {
    keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
  }

  for (const { hymn, title, lyrics, searchableText, code } of getSearchIndex()) {

    /*
      標題與歌詞合併後做 AND 搜尋。
      這樣關鍵字可以一個在標題、一個在歌詞，
      也可以全部都在歌詞中。
    */
    // 使用啟動後建立的靜態搜尋索引（可搜尋標題＋歌詞）。
    const allKeywordsMatch = Array.from(keywordCounts.entries()).every(
      ([keyword, requiredCount]) =>
        countSearchOccurrences(searchableText, keyword) >= requiredCount
    );

    let score = 99;

    if (Number(hymn.book) !== 7 && numericQuery !== null && code === numericQuery) {
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
    empty.textContent = "找不到詩歌嗎？試著點上面的 💡 小燈泡看看";
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

    const otherSong = Number(hymn.book) === 7;

    const title = document.createElement("div");
    title.className = "search-result-title";
    title.textContent = hymn.title || "未命名詩歌";

    if (!otherSong) {
      const top = document.createElement("div");
      top.className = "search-result-top";

      const bookName = document.createElement("span");
      bookName.className = "search-result-book";
      bookName.textContent = book ? book.name : `歌本 ${hymn.book}`;

      const number = document.createElement("span");
      number.className = "search-result-number";
      number.textContent = `第 ${hymn.code} 首`;

      top.appendChild(bookName);
      top.appendChild(number);
      button.appendChild(top);
    } else {
      button.classList.add("search-result-other-song");
    }

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

  /*
    搜尋結果跨歌本時，只切換歌本，不觸發手機歌本封面的置中動畫。
    避免封面列的 smooth 捲動干擾後續定位到歌詞卡片。
  */
  selectBook(hymn.book, { skipCenter: true });

  if (Number(hymn.book) !== 7) {
    setSelectedNumber(hymn.code);
  }

  showHymn(hymn);

  /*
    從搜尋結果開啟詩歌時，直接定位到「歌詞卡片」，
    不再停在上方的詩歌本封面／數字轉盤區。

    用兩層 requestAnimationFrame，確保 hymnCard 已解除 hidden、
    瀏覽器完成版面更新後再定位，手機上會更穩定。
  */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (hymnCard) {
        hymnCard.scrollIntoView({
          behavior: "auto",
          block: "start"
        });
      }
    });
  });

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

  applyBookMode();


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