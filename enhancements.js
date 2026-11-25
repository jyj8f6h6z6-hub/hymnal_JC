"use strict";

/* =========================================================
   v5 行為增強
   1. 歌本改成中央大封面的橫向轉盤
   2. 數字轉盤方向反轉：
      手指往下滑 -> 數字變大
      手指往上滑 -> 數字變小
========================================================= */


/* =========================================================
   數字轉盤方向反轉
========================================================= */

/*
  原本一組排列：
  0 1 2 3 4 5 6 7 8 9

  改成：
  9 8 7 6 5 4 3 2 1 0

  因此手指往下拖（scrollTop 變小）時，
  中央數字會往較大的方向走。
*/

normalizeWheelValue = function(index) {

  const position =
    (
      (index % 10) + 10
    ) % 10;

  return 9 - position;

};


function getReversedMiddleIndex(value) {

  return (
    MIDDLE_SET * 10 +
    (9 - Number(value))
  );

}


/*
  直接覆寫原本 createWheel，
  讓初始化時就建立正確方向，
  避免先出現舊方向再跳一次。
*/

createWheel = function(
  wheel,
  initialValue
) {

  wheel.innerHTML = "";


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
    每組由 9 排到 0。
  */

  for (
    let set = 0;
    set < REPEAT_COUNT;
    set++
  ) {

    for (
      let number = 9;
      number >= 0;
      number--
    ) {

      const option =
        document.createElement(
          "div"
        );

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

  }


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
    初始 0001 仍精準放在中間組。
  */

  requestAnimationFrame(
    () => {

      const initialIndex =
        getReversedMiddleIndex(
          initialValue
        );

      wheel.scrollTop =
        initialIndex *
        ITEM_HEIGHT;

      updateWheelVisual(
        wheel,
        initialValue
      );

    }
  );


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

};


/*
  覆寫吸附：
  循環搬回中間時也必須使用反向索引。
*/

snapWheel = function(
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
          getReversedMiddleIndex(
            value
          );

        wheel.scrollTop =
          middleIndex *
          ITEM_HEIGHT;

      }

      scheduleHymnUpdate();

    },
    110
  );

};


/*
  搜尋結果、手機詩歌橫向切換等功能，
  都會呼叫 setSelectedNumber。
  這裡一起改成反向轉盤的位置算法。
*/

setSelectedNumber = function(
  number
) {

  const safeNumber =
    Math.max(
      0,
      Math.min(
        9999,
        Number(number) || 0
      )
    );

  const formatted =
    formatNumber(
      safeNumber
    );

  selectedDigits =
    formatted
      .split("")
      .map(Number);


  wheels.forEach(
    (wheel, index) => {

      const value =
        selectedDigits[index];

      const middleIndex =
        getReversedMiddleIndex(
          value
        );

      wheel.scrollTop =
        middleIndex *
        ITEM_HEIGHT;

      updateWheelVisual(
        wheel,
        value
      );

    }
  );


  numberDisplay.textContent =
    formatted;

};



/* =========================================================
   歌本橫向轉盤
========================================================= */

let bookCarouselTimer = null;
let bookCarouselIgnoreScroll = false;


/*
  保存原本選歌本功能。
*/

const originalSelectBook =
  selectBook;


/*
  找目前最接近畫面中央的歌本。
*/

function getCenteredBookButton() {

  const buttons =
    Array.from(
      bookList.querySelectorAll(
        ".book-button"
      )
    );

  if (!buttons.length) {
    return null;
  }


  const viewportCenter =
    bookList.scrollLeft +
    bookList.clientWidth / 2;


  let closest = null;
  let closestDistance = Infinity;


  for (
    const button of buttons
  ) {

    const buttonCenter =
      button.offsetLeft +
      button.offsetWidth / 2;

    const distance =
      Math.abs(
        buttonCenter -
        viewportCenter
      );

    if (
      distance <
      closestDistance
    ) {

      closest =
        button;

      closestDistance =
        distance;

    }

  }


  return closest;

}


/*
  將指定歌本精準放到中央。
*/

function centerBookButton(
  bookId,
  behavior = "smooth"
) {

  if (
    !bookList ||
    !bookList.clientWidth
  ) {
    return;
  }


  const button =
    bookList.querySelector(
      `.book-button[data-book="${Number(bookId)}"]`
    );

  if (!button) {
    return;
  }


  const targetLeft =
    button.offsetLeft -
    (
      bookList.clientWidth -
      button.offsetWidth
    ) / 2;


  bookCarouselIgnoreScroll =
    true;


  bookList.scrollTo({
    left:
      Math.max(
        0,
        targetLeft
      ),
    behavior
  });


  setTimeout(
    () => {

      bookCarouselIgnoreScroll =
        false;

    },
    behavior === "smooth"
      ? 260
      : 40
  );

}


/*
  點歌本、搜尋切換歌本時，
  除了原本功能，也把封面送到中央。
*/

selectBook = function(
  bookId,
  options = {}
) {

  originalSelectBook(
    bookId
  );

  /*
    從搜尋結果跨歌本時，不執行手機歌本封面的 smooth 置中。
    一般直接點選歌本時仍維持原本的置中效果。
  */
  if (options.skipCenter) {
    return;
  }

  requestAnimationFrame(
    () => {

      centerBookButton(
        bookId,
        "smooth"
      );

    }
  );

};


/*
  使用者左右滑完後，
  中央那一本就是選中的歌本。
*/

function selectCenteredBook() {

  const button =
    getCenteredBookButton();

  if (!button) {
    return;
  }


  const bookId =
    Number(
      button.dataset.book
    );

  if (
    !Number.isFinite(
      bookId
    )
  ) {
    return;
  }


  if (
    Number(selectedBook) !==
    bookId
  ) {

    /*
      這裡直接呼叫原本功能，
      不再觸發 smooth 置中，
      避免滑完後又多滑一次。
    */

    originalSelectBook(
      bookId
    );

  }


  centerBookButton(
    bookId,
    "auto"
  );

}


/*
  初始化歌本轉盤。
*/

function setupBookCarouselV5() {

  if (!bookList) {
    return;
  }


  bookList.setAttribute(
    "aria-label",
    "左右滑動選擇詩歌本"
  );


  bookList.addEventListener(
    "scroll",
    () => {

      if (
        bookCarouselIgnoreScroll
      ) {
        return;
      }


      clearTimeout(
        bookCarouselTimer
      );


      bookCarouselTimer =
        setTimeout(
          () => {

            selectCenteredBook();

          },
          110
        );

    },
    {
      passive: true
    }
  );


  /*
    初始一定讓「詩歌本」在中央。
  */

  requestAnimationFrame(
    () => {

      requestAnimationFrame(
        () => {

          centerBookButton(
            selectedBook,
            "auto"
          );

        }
      );

    }
  );

}


/*
  app.js 的 init 先執行，
  建好六個歌本後，
  再啟用橫向轉盤。
*/

document.addEventListener(
  "DOMContentLoaded",
  setupBookCarouselV5
);


/* =========================================================
   v7｜桌面歌本拖曳
========================================================= */

let bookPointerDragging = false;
let bookPointerMoved = false;
let bookPointerStartX = 0;
let bookPointerStartScrollLeft = 0;
let bookPointerId = null;


function setupDesktopBookDrag() {

  if (!bookList) {
    return;
  }

  bookList.addEventListener(
    "pointerdown",
    event => {

      /*
        滑鼠左鍵、觸控筆可拖。
        手機觸控仍交給原本的原生水平捲動。
      */
      if (
        event.pointerType === "touch" ||
        (
          event.pointerType === "mouse" &&
          event.button !== 0
        )
      ) {
        return;
      }

      bookPointerDragging = true;
      bookPointerMoved = false;
      bookPointerStartX = event.clientX;
      bookPointerStartScrollLeft = bookList.scrollLeft;
      bookPointerId = event.pointerId;

      bookList.classList.add(
        "is-dragging"
      );

      try {
        bookList.setPointerCapture(
          event.pointerId
        );
      }
      catch (error) {
        /* 某些瀏覽器不支援時直接忽略 */
      }

      event.preventDefault();

    }
  );


  bookList.addEventListener(
    "pointermove",
    event => {

      if (
        !bookPointerDragging ||
        event.pointerId !== bookPointerId
      ) {
        return;
      }

      const delta =
        event.clientX -
        bookPointerStartX;

      if (
        Math.abs(delta) > 4
      ) {
        bookPointerMoved = true;
      }

      bookList.scrollLeft =
        bookPointerStartScrollLeft -
        delta;

      event.preventDefault();

    }
  );


  const finishDrag =
    event => {

      if (
        !bookPointerDragging
      ) {
        return;
      }

      if (
        event &&
        bookPointerId !== null &&
        event.pointerId !== bookPointerId
      ) {
        return;
      }

      bookPointerDragging = false;
      bookPointerId = null;

      bookList.classList.remove(
        "is-dragging"
      );

      /*
        放開滑鼠後，選最接近中央的歌本，
        並精準吸附回中央。
      */
      requestAnimationFrame(
        () => {
          selectCenteredBook();
        }
      );

      /*
        防止「拖曳」被瀏覽器當成點擊歌本。
      */
      setTimeout(
        () => {
          bookPointerMoved = false;
        },
        80
      );

    };


  bookList.addEventListener(
    "pointerup",
    finishDrag
  );

  bookList.addEventListener(
    "pointercancel",
    finishDrag
  );

  bookList.addEventListener(
    "lostpointercapture",
    finishDrag
  );


  bookList.addEventListener(
    "click",
    event => {

      if (
        bookPointerMoved
      ) {
        event.preventDefault();
        event.stopPropagation();
      }

    },
    true
  );

}



/* =========================================================
   v7｜歌詞字體手勢
   - 雙指縮放只改字體
   - 雙擊恢復預設
========================================================= */

const LYRICS_MIN_FONT = 18;
const LYRICS_MAX_FONT = 46;

let lyricsDefaultFont = null;
let lyricsCurrentFont = null;
let lyricsPinchStartDistance = null;
let lyricsPinchStartFont = null;
let lyricsLastTapTime = 0;

// v2.2.4｜單指雙擊後按住，上下拖曳調整歌詞大小
let lyricsDoubleHoldCandidate = false;
let lyricsDoubleHoldZooming = false;
let lyricsDoubleHoldStartY = null;
let lyricsDoubleHoldStartFont = null;
const LYRICS_DOUBLE_HOLD_THRESHOLD = 9;
const LYRICS_DOUBLE_HOLD_SENSITIVITY = 0.08;


const LYRICS_FONT_KEY = "hymnalLyricsFont";
let lyricsFontSaveTimer = null;

function scheduleSaveLyricsFont(size) {
  if (lyricsFontSaveTimer) clearTimeout(lyricsFontSaveTimer);
  lyricsFontSaveTimer = setTimeout(() => {
    try { localStorage.setItem(LYRICS_FONT_KEY, String(Math.round(size))); } catch (error) { /* 忽略 */ }
  }, 300);
}

function clearSavedLyricsFont() {
  if (lyricsFontSaveTimer) clearTimeout(lyricsFontSaveTimer);
  try { localStorage.removeItem(LYRICS_FONT_KEY); } catch (error) { /* 忽略 */ }
}

function loadSavedLyricsFont() {
  try {
    const value = parseFloat(localStorage.getItem(LYRICS_FONT_KEY));
    return value >= LYRICS_MIN_FONT && value <= LYRICS_MAX_FONT ? value : null;
  } catch (error) {
    return null;
  }
}

function clampLyricsFont(value) {

  return Math.max(
    LYRICS_MIN_FONT,
    Math.min(
      LYRICS_MAX_FONT,
      value
    )
  );

}


function getTouchDistance(touchA, touchB) {

  return Math.hypot(
    touchB.clientX -
    touchA.clientX,
    touchB.clientY -
    touchA.clientY
  );

}


function readCurrentLyricsFont() {

  if (!hymnLyrics) {
    return 26;
  }

  return parseFloat(
    getComputedStyle(
      hymnLyrics
    ).fontSize
  ) || 26;

}


function setLyricsFontSize(size) {

  if (!hymnLyrics) {
    return;
  }

  const safeSize =
    clampLyricsFont(
      size
    );

  lyricsCurrentFont =
    safeSize;

  hymnLyrics.style.setProperty(
    "--lyrics-font-size",
    `${safeSize}px`
  );

  // v2.5.0：記住字級（手勢連續縮放時延遲寫入，避免頻繁存取）。
  scheduleSaveLyricsFont(safeSize);

}


function resetLyricsFontSize() {

  if (!hymnLyrics) {
    return;
  }

  /*
    先移除自訂值，再重新讀 CSS 的預設字體。
  */
  hymnLyrics.style.removeProperty(
    "--lyrics-font-size"
  );

  lyricsDefaultFont =
    readCurrentLyricsFont();

  lyricsCurrentFont =
    lyricsDefaultFont;

  // v2.5.0：還原預設時清除已記住的字級。
  clearSavedLyricsFont();

}


function setupLyricsFontGestures() {

  if (!hymnLyrics) {
    return;
  }


  requestAnimationFrame(
    () => {

      lyricsDefaultFont =
        readCurrentLyricsFont();

      lyricsCurrentFont =
        lyricsDefaultFont;

      // v2.5.0：套用上次記住的字級。
      const savedFont = loadSavedLyricsFont();
      if (savedFont) {
        setLyricsFontSize(savedFont);
      }

    }
  );


  /*
    iPhone / iPad：
    在歌詞區兩指操作時阻止 Safari 的整頁縮放，
    只改歌詞字體。
  */
  hymnLyrics.addEventListener(
    "touchstart",
    event => {

      if (
        event.touches.length === 2
      ) {

        lyricsPinchStartDistance =
          getTouchDistance(
            event.touches[0],
            event.touches[1]
          );

        lyricsPinchStartFont =
          lyricsCurrentFont ||
          readCurrentLyricsFont();

        hymnLyrics.classList.add(
          "is-font-zooming"
        );

        event.preventDefault();
        return;

      }


      if (
        event.touches.length === 1
      ) {

        const now =
          Date.now();

        /*
          v2.2.4：
          - 快速雙擊並放開：恢復預設字體。
          - 第二下不放開並上下拖曳：單指調整字體大小。
          不在第二次 touchstart 立刻重設，避免和「雙擊後按住」衝突。
        */
        if (
          now -
          lyricsLastTapTime <
          320
        ) {

          lyricsDoubleHoldCandidate = true;
          lyricsDoubleHoldZooming = false;
          lyricsDoubleHoldStartY = event.touches[0].clientY;
          lyricsDoubleHoldStartFont =
            lyricsCurrentFont ||
            readCurrentLyricsFont();
          lyricsLastTapTime = 0;
          event.preventDefault();

        }
        else {

          lyricsDoubleHoldCandidate = false;
          lyricsDoubleHoldZooming = false;
          lyricsLastTapTime = now;

        }

      }

    },
    {
      passive: false
    }
  );


  hymnLyrics.addEventListener(
    "touchmove",
    event => {

      /* 單指：雙擊第二下按住後，上拉放大、下拉縮小。 */
      if (
        event.touches.length === 1 &&
        lyricsDoubleHoldCandidate &&
        lyricsDoubleHoldStartY !== null &&
        lyricsDoubleHoldStartFont !== null
      ) {

        const deltaY =
          lyricsDoubleHoldStartY -
          event.touches[0].clientY;

        if (
          lyricsDoubleHoldZooming ||
          Math.abs(deltaY) >= LYRICS_DOUBLE_HOLD_THRESHOLD
        ) {
          lyricsDoubleHoldZooming = true;
          hymnLyrics.classList.add("is-font-zooming");
          setLyricsFontSize(
            lyricsDoubleHoldStartFont +
            deltaY * LYRICS_DOUBLE_HOLD_SENSITIVITY
          );
          event.preventDefault();
        }
        return;
      }

      if (
        event.touches.length !== 2 ||
        !lyricsPinchStartDistance ||
        !lyricsPinchStartFont
      ) {
        return;
      }

      const distance =
        getTouchDistance(
          event.touches[0],
          event.touches[1]
        );

      const ratio =
        distance /
        lyricsPinchStartDistance;

      setLyricsFontSize(
        lyricsPinchStartFont *
        ratio
      );

      event.preventDefault();

    },
    {
      passive: false
    }
  );


  const finishLyricsPinch =
    event => {

      if (
        event.touches &&
        event.touches.length >= 2
      ) {
        return;
      }

      lyricsPinchStartDistance = null;
      lyricsPinchStartFont = null;

      /*
        雙擊第二下若沒有進入拖曳縮放，維持原本「雙擊重設」功能。
        若已拖曳縮放，放開後保留目前字體大小。
      */
      if (lyricsDoubleHoldCandidate) {
        if (!lyricsDoubleHoldZooming) {
          resetLyricsFontSize();
        }
        lyricsDoubleHoldCandidate = false;
        lyricsDoubleHoldZooming = false;
        lyricsDoubleHoldStartY = null;
        lyricsDoubleHoldStartFont = null;
      }

      hymnLyrics.classList.remove(
        "is-font-zooming"
      );

    };


  hymnLyrics.addEventListener(
    "touchend",
    finishLyricsPinch,
    {
      passive: true
    }
  );

  hymnLyrics.addEventListener(
    "touchcancel",
    finishLyricsPinch,
    {
      passive: true
    }
  );


  /*
    桌面瀏覽器雙擊也可以還原字體。
  */
  hymnLyrics.addEventListener(
    "dblclick",
    event => {

      resetLyricsFontSize();
      event.preventDefault();

    }
  );


  /*
    Safari 有些版本會另外送 gesture 事件。
    明確阻止整頁 pinch zoom。
  */
  ["gesturestart", "gesturechange", "gestureend"]
    .forEach(
      eventName => {

        hymnLyrics.addEventListener(
          eventName,
          event => {
            event.preventDefault();
          },
          {
            passive: false
          }
        );

      }
    );

}



/* =========================================================
   v7 初始化
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupDesktopBookDrag();
    setupLyricsFontGestures();

  }
);


/* =========================================================
   v8｜桌面歌本轉盤修正
   問題：
   1. 第一本文字無法拖回來
   2. 點封面有時只移動畫面，沒有真正切換 selectedBook

   修正策略：
   - 點擊：明確先切換歌本，再把封面置中
   - 拖曳：放開後才以中央封面決定歌本
   - 置中改用 scrollIntoView，交給瀏覽器計算左右邊界
========================================================= */

let v8DesktopDragging = false;
let v8DesktopMoved = false;
let v8StartX = 0;
let v8StartScrollLeft = 0;
let v8PointerId = null;


function v8CenterBookButton(
  button,
  behavior = "smooth"
) {

  if (!button) {
    return;
  }

  bookCarouselIgnoreScroll = true;

  button.scrollIntoView({
    behavior,
    block: "nearest",
    inline: "center"
  });

  setTimeout(
    () => {
      bookCarouselIgnoreScroll = false;
    },
    behavior === "smooth" ? 320 : 60
  );

}


function v8SelectBookButton(
  button,
  behavior = "smooth"
) {

  if (!button) {
    return;
  }

  const bookId =
    Number(
      button.dataset.book
    );

  if (
    !Number.isFinite(bookId)
  ) {
    return;
  }

  /*
    關鍵：
    不只移動封面，而是真正更新 selectedBook，
    所以紅本、補充本、兒童詩歌等都會重新查歌。
  */
  originalSelectBook(
    bookId
  );

  v8CenterBookButton(
    button,
    behavior
  );

}


/*
  覆寫 v5/v7 會使用的「中央歌本選擇」函式。
*/
selectCenteredBook = function() {

  const button =
    getCenteredBookButton();

  if (!button) {
    return;
  }

  v8SelectBookButton(
    button,
    "smooth"
  );

};


function setupDesktopBookCarouselV8() {

  if (!bookList) {
    return;
  }


  /*
    先強制把預設「詩歌本」放回中央。
    這也解決重新整理後畫面停在紅本附近的問題。
  */
  requestAnimationFrame(
    () => {
      requestAnimationFrame(
        () => {

          const initialButton =
            bookList.querySelector(
              `.book-button[data-book="${Number(selectedBook)}"]`
            );

          v8CenterBookButton(
            initialButton,
            "auto"
          );

        }
      );
    }
  );


  /*
    用 capture 攔截桌面版點擊。
    這樣不再依賴舊版 button click 的執行順序。
  */
  bookList.addEventListener(
    "click",
    event => {

      if (
        window.matchMedia(
          "(max-width: 700px)"
        ).matches
      ) {
        return;
      }

      const button =
        event.target.closest(
          ".book-button"
        );

      if (!button) {
        return;
      }

      /*
        剛剛是拖曳，不當成點擊。
      */
      if (
        v8DesktopMoved
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      v8SelectBookButton(
        button,
        "smooth"
      );

    },
    true
  );


  /*
    v8 自己管理桌面滑鼠拖曳。
    stopImmediatePropagation 可避免 v7 的舊拖曳處理同時執行。
  */
  bookList.addEventListener(
    "pointerdown",
    event => {

      if (
        event.pointerType === "touch" ||
        (
          event.pointerType === "mouse" &&
          event.button !== 0
        )
      ) {
        return;
      }

      v8DesktopDragging = true;
      v8DesktopMoved = false;
      v8StartX = event.clientX;
      v8StartScrollLeft = bookList.scrollLeft;
      v8PointerId = event.pointerId;

      bookList.classList.add(
        "is-dragging"
      );

      try {
        bookList.setPointerCapture(
          event.pointerId
        );
      }
      catch (error) {}

      event.preventDefault();
      event.stopImmediatePropagation();

    },
    true
  );


  bookList.addEventListener(
    "pointermove",
    event => {

      if (
        !v8DesktopDragging ||
        event.pointerId !== v8PointerId
      ) {
        return;
      }

      const delta =
        event.clientX -
        v8StartX;

      if (
        Math.abs(delta) >= 5
      ) {
        v8DesktopMoved = true;
      }

      bookList.scrollLeft =
        v8StartScrollLeft -
        delta;

      event.preventDefault();
      event.stopImmediatePropagation();

    },
    true
  );


  const finish =
    event => {

      if (
        !v8DesktopDragging
      ) {
        return;
      }

      if (
        event &&
        v8PointerId !== null &&
        event.pointerId !== v8PointerId
      ) {
        return;
      }

      v8DesktopDragging = false;
      v8PointerId = null;

      bookList.classList.remove(
        "is-dragging"
      );

      if (
        v8DesktopMoved
      ) {

        const centered =
          getCenteredBookButton();

        v8SelectBookButton(
          centered,
          "smooth"
        );

      }

      /*
        保留一小段時間，吃掉 pointerup 後瀏覽器補送的 click。
      */
      setTimeout(
        () => {
          v8DesktopMoved = false;
        },
        180
      );

      if (event) {
        event.stopImmediatePropagation();
      }

    };


  bookList.addEventListener(
    "pointerup",
    finish,
    true
  );

  bookList.addEventListener(
    "pointercancel",
    finish,
    true
  );

}


/*
  v8 放在最後初始化。
*/
document.addEventListener(
  "DOMContentLoaded",
  setupDesktopBookCarouselV8
);


/* =========================================================
   v10｜桌面版歌本選擇穩定修正

   原因：
   桌面版原本有兩套會改 selectedBook 的行為：
   1. 使用者點擊某本歌本
   2. 歌本列捲動停止後，自動選畫面中央的歌本

   當程式自己把封面置中時，也會產生 scroll，
   舊邏輯有機會把歌本又切回別本（常見是詩歌本）。

   v10 規則：
   - 手機：保留滑動後中央歌本自動選取
   - 桌面：一般 scroll 絕不自動換歌本
   - 桌面只有「真的拖曳放開」時，才允許中央歌本成為新選擇
========================================================= */

let v10DesktopDragSelectionAllowed = false;
let v10DesktopPointerDownX = null;
let v10DesktopActuallyDragged = false;


/*
  重新定義中央歌本選擇。
  舊版所有 timer 最後呼叫到的也是這個新函式。
*/
selectCenteredBook = function() {

  const isMobile =
    window.matchMedia(
      "(max-width: 700px)"
    ).matches;

  /*
    桌面一般 scroll / 程式自動置中：
    不准偷偷切換 selectedBook。
  */
  if (
    !isMobile &&
    !v10DesktopDragSelectionAllowed
  ) {
    return;
  }


  const button =
    getCenteredBookButton();

  if (!button) {
    v10DesktopDragSelectionAllowed = false;
    return;
  }


  const bookId =
    Number(
      button.dataset.book
    );

  if (
    !Number.isFinite(bookId)
  ) {
    v10DesktopDragSelectionAllowed = false;
    return;
  }


  /*
    真正更新目前歌本。
  */
  originalSelectBook(
    bookId
  );


  /*
    只做一次。
    避免後續 smooth scroll 又再選別本。
  */
  v10DesktopDragSelectionAllowed = false;


  requestAnimationFrame(
    () => {

      const currentButton =
        bookList.querySelector(
          `.book-button[data-book="${bookId}"]`
        );

      if (currentButton) {

        bookCarouselIgnoreScroll = true;

        currentButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center"
        });

        setTimeout(
          () => {
            bookCarouselIgnoreScroll = false;
          },
          380
        );

      }

    }
  );

};


/*
  額外偵測桌面「真的有拖」。
  只在拖曳距離足夠時，pointerup 才允許中央歌本成為選擇。
*/
function setupDesktopSelectionGuardV10() {

  if (!bookList) {
    return;
  }


  bookList.addEventListener(
    "pointerdown",
    event => {

      if (
        event.pointerType === "touch"
      ) {
        return;
      }

      v10DesktopPointerDownX =
        event.clientX;

      v10DesktopActuallyDragged =
        false;

      v10DesktopDragSelectionAllowed =
        false;

    },
    true
  );


  bookList.addEventListener(
    "pointermove",
    event => {

      if (
        event.pointerType === "touch" ||
        v10DesktopPointerDownX === null
      ) {
        return;
      }

      if (
        Math.abs(
          event.clientX -
          v10DesktopPointerDownX
        ) >= 8
      ) {

        v10DesktopActuallyDragged =
          true;

      }

    },
    true
  );


  bookList.addEventListener(
    "pointerup",
    event => {

      if (
        event.pointerType === "touch"
      ) {
        return;
      }


      if (
        v10DesktopActuallyDragged
      ) {

        /*
          在舊版 drag-finish 呼叫 selectCenteredBook 前，
          先開一次許可。
        */
        v10DesktopDragSelectionAllowed =
          true;

        /*
          再補一次保險。
        */
        setTimeout(
          () => {

            if (
              v10DesktopDragSelectionAllowed
            ) {
              selectCenteredBook();
            }

          },
          0
        );

      }


      v10DesktopPointerDownX =
        null;

      v10DesktopActuallyDragged =
        false;

    },
    true
  );


  /*
    桌面點擊某歌本：
    明確記住這本就是使用者選擇，
    並封鎖後續 scroll 自動改本。
  */
  bookList.addEventListener(
    "click",
    event => {

      if (
        window.matchMedia(
          "(max-width: 700px)"
        ).matches
      ) {
        return;
      }


      const button =
        event.target.closest(
          ".book-button"
        );

      if (!button) {
        return;
      }


      const bookId =
        Number(
          button.dataset.book
        );

      if (
        !Number.isFinite(bookId)
      ) {
        return;
      }


      v10DesktopDragSelectionAllowed =
        false;


      /*
        下一個 frame 再確認一次 selectedBook，
        防止舊版其他 click handler 最後覆寫。
      */
      requestAnimationFrame(
        () => {

          if (
            Number(selectedBook) !==
            bookId
          ) {

            originalSelectBook(
              bookId
            );

          }

        }
      );

    },
    true
  );

}


document.addEventListener(
  "DOMContentLoaded",
  setupDesktopSelectionGuardV10
);


/* =========================================================
   v11｜桌面版歌本：最單純的直接點選
========================================================= */

/*
  v5～v10 曾加入多套桌面拖曳／置中處理。
  為了不大改既有檔案，v11 在 capture 階段最優先接管桌面點擊。

  桌面規則只有一條：
  點哪一本 -> originalSelectBook(bookId)

  不拖曳、不置中、不因 scroll 改變歌本。
*/

function setupSimpleDesktopBooksV11() {

  if (!bookList) {
    return;
  }


  /*
    桌面初始化：
    保證沒有殘留水平捲動位置。
  */
  const resetDesktopBookPosition =
    () => {

      if (
        window.matchMedia(
          "(min-width: 701px)"
        ).matches
      ) {

        bookCarouselIgnoreScroll =
          true;

        bookList.scrollLeft = 0;

        bookList.classList.remove(
          "is-dragging"
        );

        setTimeout(
          () => {
            bookCarouselIgnoreScroll =
              false;
          },
          80
        );

      }

    };


  requestAnimationFrame(
    resetDesktopBookPosition
  );


  window.addEventListener(
    "resize",
    resetDesktopBookPosition
  );


  /*
    桌面版禁止 pointer 拖曳邏輯繼續往 v7～v10 傳。
    但不阻止正常 click。
  */
  [
    "pointerdown",
    "pointermove",
    "pointerup",
    "pointercancel"
  ].forEach(
    eventName => {

      bookList.addEventListener(
        eventName,
        event => {

          if (
            window.matchMedia(
              "(max-width: 700px)"
            ).matches
          ) {
            return;
          }

          /*
            阻止舊桌面轉盤 handler。
            不 preventDefault，確保 click 還會正常產生。
          */
          event.stopImmediatePropagation();

        },
        true
      );

    }
  );


  /*
    桌面直接點選。
  */
  bookList.addEventListener(
    "click",
    event => {

      if (
        window.matchMedia(
          "(max-width: 700px)"
        ).matches
      ) {
        return;
      }


      const button =
        event.target.closest(
          ".book-button"
        );

      if (!button) {
        return;
      }


      const bookId =
        Number(
          button.dataset.book
        );

      if (
        !Number.isFinite(
          bookId
        )
      ) {
        return;
      }


      /*
        最重要：
        桌面只做真正的歌本切換，
        完全不呼叫 centerBookButton / selectCenteredBook。
      */
      originalSelectBook(
        bookId
      );


      /*
        防止 v5～v10 的舊 click handler 再執行。
      */
      event.preventDefault();
      event.stopImmediatePropagation();

    },
    true
  );


  /*
    桌面任何 scroll 都不允許改 selectedBook。
    CSS 已經不會水平捲動，這裡只是最後一道保險。
  */
  bookList.addEventListener(
    "scroll",
    () => {

      if (
        window.matchMedia(
          "(min-width: 701px)"
        ).matches
      ) {

        bookCarouselIgnoreScroll =
          true;

        if (
          bookList.scrollLeft !== 0
        ) {
          bookList.scrollLeft = 0;
        }

        setTimeout(
          () => {
            bookCarouselIgnoreScroll =
              false;
          },
          60
        );

      }

    },
    true
  );

}


/*
  這個監聽器寫在 enhancements.js 最後，
  DOMContentLoaded 時 v11 會最後完成桌面接管。
*/
document.addEventListener(
  "DOMContentLoaded",
  setupSimpleDesktopBooksV11
);


/* =========================================================
   v12｜桌面歌本點擊最終修正
========================================================= */

/*
  v11 的問題：
  前面 v7～v10 已經註冊過 capture 階段的 pointer/click 監聽器，
  即使 v11 想接管，舊監聽器仍可能先 stopImmediatePropagation，
  導致新的點擊程式根本收不到事件。

  v12 不再讓 bookList 自己處理桌面點擊。
  改由 document 在更上層統一接收 click，
  找出被點擊的 .book-button，
  直接執行 originalSelectBook。

  桌面完全不使用任何 carousel / drag / center 邏輯。
*/

function setupDesktopBookClickV12() {

  document.addEventListener(
    "click",
    event => {

      if (
        window.matchMedia(
          "(max-width: 700px)"
        ).matches
      ) {
        return;
      }

      const button =
        event.target.closest(
          "#bookList .book-button"
        );

      if (!button) {
        return;
      }

      const bookId =
        Number(
          button.dataset.book
        );

      if (
        !Number.isFinite(bookId)
      ) {
        return;
      }

      /*
        直接切換歌本。
        不置中、不捲動、不拖曳。
      */
      originalSelectBook(
        bookId
      );

      /*
        桌面永遠保持歌本列原位。
      */
      bookList.scrollLeft = 0;

      event.preventDefault();

    },
    true
  );

}


/*
  為了避免舊 pointerdown 在 bookList 上先攔截，
  桌面在 document capture 最上層阻止 pointer 事件
  傳進 bookList 的舊拖曳程式，但保留瀏覽器後續 click。
*/
function disableOldDesktopBookDragV12() {

  document.addEventListener(
    "pointerdown",
    event => {

      if (
        window.matchMedia(
          "(max-width: 700px)"
        ).matches
      ) {
        return;
      }

      const button =
        event.target.closest(
          "#bookList .book-button"
        );

      if (!button) {
        return;
      }

      /*
        不 preventDefault，否則 click 可能不產生。
        只阻止事件繼續進入舊版 bookList pointer handler。
      */
      event.stopPropagation();

    },
    true
  );

}


document.addEventListener(
  "DOMContentLoaded",
  () => {
    setupDesktopBookClickV12();
    disableOldDesktopBookDragV12();
  }
);


/* =========================================================
   v19｜整張閱讀頁跟手翻頁
   標題＋歌詞一起移動；相鄰詩歌是一張獨立頁面。
========================================================= */
function setupLyricsSwipeV13() {
  if (!hymnLyrics || !hymnCard) return;

  const hymnTop = document.querySelector(".hymn-top");
  let sx=0, sy=0, dx=0, tracking=false, horizontal=false;
  let stage=null, currentPage=null, previewPage=null, target=null, direction=null;
  let originalNext = hymnTop ? hymnTop.nextSibling : hymnLyrics.nextSibling;

  function compactName(id) {
    return ({1:"詩歌",2:"補",3:"頌",4:"紅本",5:"兒童",6:"藍本",7:"其他"})[Number(id)] || `歌本${id}`;
  }

  function targetFor(delta) {
    // 「其他詩歌」沒有公開首數／固定順序，不使用左右翻頁切歌。
    if (Number(selectedBook) === 7) return null;
    const list=getHymnsForCurrentBook();
    const i=list.findIndex(h=>Number(h.code)===Number(getSelectedNumber()));
    if(i<0) return null;
    const n=delta<0?i+1:i-1;
    return n>=0 && n<list.length ? list[n] : null;
  }

  function previewFor(h) {
    const page=document.createElement("section");
    page.className="hymn-reading-page hymn-reading-page-preview";

    const top=document.createElement("div");
    top.className="hymn-top hymn-top-preview";

    const meta=document.createElement("div");
    meta.className="hymn-meta";
    const book=document.createElement("span");
    book.className="hymn-book";
    book.textContent=`${compactName(h.book)}．${h.code}`;
    meta.appendChild(book);

    const title=document.createElement("div");
    title.className="hymn-title";
    title.textContent=h.title ? String(h.title).trim() : "未命名詩歌";

    const lyrics=document.createElement("div");
    lyrics.className="hymn-lyrics hymn-lyrics-preview";
    lyrics.textContent=cleanLyrics(h);
    const fs=hymnLyrics.style.getPropertyValue("--lyrics-font-size");
    if(fs) lyrics.style.setProperty("--lyrics-font-size",fs);

    top.append(meta,title);
    page.append(top,lyrics);
    return page;
  }

  function build(delta) {
    target=targetFor(delta);
    if(!target) return false;
    direction=delta<0?"next":"prev";

    stage=document.createElement("div");
    stage.className="hymn-page-turn-stage";

    currentPage=document.createElement("section");
    currentPage.className="hymn-reading-page hymn-reading-page-current";

    // 將真正的標題與歌詞暫時搬入目前頁；不是複製，因此不會出現殘影。
    if(hymnTop) currentPage.appendChild(hymnTop);
    currentPage.appendChild(hymnLyrics);

    previewPage=previewFor(target);
    stage.append(currentPage,previewPage);
    hymnCard.appendChild(stage);
    hymnCard.classList.add("is-page-turning");
    return true;
  }

  function cleanup() {
    if(currentPage) {
      if(hymnTop) hymnCard.insertBefore(hymnTop,stage);
      hymnCard.insertBefore(hymnLyrics,stage);
    }
    if(stage) stage.remove();
    hymnCard.classList.remove("is-page-turning");
    stage=currentPage=previewPage=null;
    target=direction=null;
    dx=0;
  }

  function draw(delta) {
    if(!stage && !build(delta)) return;
    const w=Math.max(1,hymnCard.clientWidth);
    const x=Math.max(-w,Math.min(w,delta));
    currentPage.style.transform=`translate3d(${x}px,0,0)`;
    const start=direction==="next"?w:-w;
    previewPage.style.transform=`translate3d(${start+x}px,0,0)`;
    currentPage.style.setProperty("--turn-progress",Math.min(1,Math.abs(x)/w));
  }

  function finish(ok) {
    if(!stage || !target) { cleanup(); return; }
    const chosen=target, w=Math.max(1,hymnCard.clientWidth);
    currentPage.classList.add("is-settling");
    previewPage.classList.add("is-settling");

    if(ok) {
      currentPage.style.transform=`translate3d(${direction==="next"?-w:w}px,0,0)`;
      previewPage.style.transform="translate3d(0,0,0)";
      setTimeout(()=>{
        cleanup();
        setSelectedNumber(chosen.code);
        showHymn(chosen);
        requestAnimationFrame(()=>hymnLyrics.scrollIntoView({behavior:"auto",block:"start"}));
      },230);
    } else {
      currentPage.style.transform="translate3d(0,0,0)";
      previewPage.style.transform=`translate3d(${direction==="next"?w:-w}px,0,0)`;
      setTimeout(cleanup,230);
    }
  }

  hymnLyrics.addEventListener("touchstart",ev=>{
    if(ev.touches.length!==1){tracking=false;return;}
    sx=ev.touches[0].clientX; sy=ev.touches[0].clientY;
    dx=0; tracking=true; horizontal=false;
  },{passive:true});

  hymnLyrics.addEventListener("touchmove",ev=>{
    if(!tracking || ev.touches.length!==1) return;
    const x=ev.touches[0].clientX-sx, y=ev.touches[0].clientY-sy;
    if(!horizontal){
      if(Math.abs(x)<12) return;
      if(Math.abs(x)>Math.abs(y)*1.25) horizontal=true;
      else if(Math.abs(y)>Math.abs(x)){tracking=false;return;}
    }
    ev.preventDefault(); dx=x; draw(x);
  },{passive:false});

  hymnLyrics.addEventListener("touchend",()=>{
    if(!tracking)return;
    tracking=false;
    if(!horizontal)return;
    const threshold=Math.min(120,hymnCard.clientWidth*.30);
    finish(Math.abs(dx)>=threshold);
    horizontal=false;
  },{passive:true});

  hymnLyrics.addEventListener("touchcancel",()=>{
    tracking=false;
    if(horizontal)finish(false);
    horizontal=false;
  },{passive:true});

  if(hymnTop){
    hymnTop.setAttribute("role","button");
    hymnTop.setAttribute("tabindex","0");
    const go=()=>hymnLyrics.scrollIntoView({behavior:"smooth",block:"start"});
    hymnTop.addEventListener("click",go);
    hymnTop.addEventListener("keydown",ev=>{
      if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();go();}
    });
  }
}

function setupAppVersionV20(){
  let el=document.getElementById("appVersionBadge");
  if(!el){el=document.createElement("div");el.id="appVersionBadge";el.className="app-version-badge";document.body.appendChild(el);}
  el.textContent="Hymnal JC · v2.6.1";
}

document.addEventListener("DOMContentLoaded",()=>{
  setupLyricsSwipeV13();
  setupAppVersionV20();
});

/* =========================================================
   v2.1｜許願／回報（Google 表單）
========================================================= */
function setupFeedbackV21(){
  const button=document.getElementById("feedbackButton");
  const modal=document.getElementById("feedbackModal");
  const errorButton=document.getElementById("reportErrorButton");
  const requestButton=document.getElementById("requestSongButton");
  if(!button||!modal||!errorButton||!requestButton)return;

  const FORM_BASE="https://docs.google.com/forms/d/e/1FAIpQLScsx5oPnBF4uPp4zKsjj494xxDuCjXdDveZ4MJ9BpfeaGx5bA/viewform";
  const TYPE_ENTRY="entry.502841526";
  const ERROR_SONG_ENTRY="entry.190870664";

  const openModal=()=>{modal.classList.remove("hidden");modal.setAttribute("aria-hidden","false");};
  const closeModal=()=>{modal.classList.add("hidden");modal.setAttribute("aria-hidden","true");};
  button.addEventListener("click",openModal);
  modal.querySelectorAll("[data-feedback-close]").forEach(el=>el.addEventListener("click",closeModal));
  document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&!modal.classList.contains("hidden"))closeModal();});

  function currentSongLabel(){
    const title=(document.getElementById("hymnTitle")?.textContent||"").trim();
    const meta=(document.getElementById("hymnBook")?.textContent||"").trim();
    if(title && title!=="未命名詩歌") return meta ? `${meta}｜${title}` : title;
    return "";
  }
  function openForm(params){
    const url=new URL(FORM_BASE);
    url.searchParams.set("usp","pp_url");
    Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
    window.open(url.toString(),"_blank","noopener");
    closeModal();
  }
  errorButton.addEventListener("click",()=>openForm({[TYPE_ENTRY]:"錯誤回報",[ERROR_SONG_ENTRY]:currentSongLabel()}));
  requestButton.addEventListener("click",()=>openForm({[TYPE_ENTRY]:"增加詩歌需求"}));
}

document.addEventListener("DOMContentLoaded",setupFeedbackV21);


/* =========================================================
   v2.5.0｜顯示設定面板（色塊、字級、行距）
   - 頂端主題按鈕與歌詞標題列的「Aa」按鈕都開啟同一個面板
   - 字級、行距會記住，每首歌都套用
========================================================= */

const LYRICS_LINE_MIN = 1.0;
const LYRICS_LINE_MAX = 2.6;
const LYRICS_LINE_DEFAULT = 1.9;
const LYRICS_LINE_KEY = "hymnalLyricsLineHeight";

let displayPanelEl = null;
let displayBackdropEl = null;
let displayFontSlider = null;
let displayFontValue = null;
let displayLineSlider = null;
let displayLineValue = null;
let displayButtonEl = null;

function applyLyricsLineHeight(value) {
  document.documentElement.style.setProperty("--lyrics-line-height", String(value));
}

function loadLyricsLineHeight() {
  try {
    const value = parseFloat(localStorage.getItem(LYRICS_LINE_KEY));
    if (value >= LYRICS_LINE_MIN && value <= LYRICS_LINE_MAX) {
      applyLyricsLineHeight(value);
    }
  } catch (error) { /* 忽略 */ }
}

function currentLyricsLineHeight() {
  const value = parseFloat(
    document.documentElement.style.getPropertyValue("--lyrics-line-height")
  );
  return value >= LYRICS_LINE_MIN && value <= LYRICS_LINE_MAX ? value : LYRICS_LINE_DEFAULT;
}

function refreshDisplayPanel() {
  if (!displayPanelEl) return;

  displayPanelEl.querySelectorAll(".display-mode-btn").forEach(btn => {
    btn.setAttribute("aria-pressed", btn.dataset.mode === pickerMode ? "true" : "false");
  });

  displayPanelEl.querySelectorAll(".display-swatch").forEach(button => {
    button.setAttribute(
      "aria-pressed",
      button.dataset.themeId === THEMES[currentThemeIndex].id ? "true" : "false"
    );
  });

  const font = Math.round(readCurrentLyricsFont());
  displayFontSlider.value = String(font);
  displayFontValue.textContent = `${font}`;

  const line = currentLyricsLineHeight();
  displayLineSlider.value = String(line);
  displayLineValue.textContent = (Math.round(line * 100) / 100).toFixed(2);
}

function buildDisplayPanel() {
  if (displayPanelEl) return;

  displayBackdropEl = document.createElement("div");
  displayBackdropEl.className = "display-panel-backdrop hidden";
  displayBackdropEl.addEventListener("click", closeDisplayPanel);

  displayPanelEl = document.createElement("div");
  displayPanelEl.className = "display-panel hidden";
  displayPanelEl.setAttribute("role", "dialog");
  displayPanelEl.setAttribute("aria-label", "顯示設定");

  const head = document.createElement("div");
  head.className = "display-panel-head";
  const title = document.createElement("div");
  title.className = "display-panel-title";
  title.textContent = "顯示設定";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "display-panel-close";
  close.setAttribute("aria-label", "關閉");
  close.textContent = "×";
  close.addEventListener("click", closeDisplayPanel);
  head.append(title, close);
  displayPanelEl.appendChild(head);

  // v2.6.0：選歌方式（滾輪／數字）
  const modeRow = document.createElement("div");
  modeRow.className = "display-mode-row";
  const modeLabel = document.createElement("span");
  modeLabel.textContent = "選歌方式";
  const modeSwitch = document.createElement("div");
  modeSwitch.className = "display-mode-switch";
  [["wheel", "滾輪"], ["pad", "數字"]].forEach(([mode, text]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "display-mode-btn";
    btn.dataset.mode = mode;
    btn.textContent = text;
    btn.addEventListener("click", () => {
      setPickerMode(mode);
      refreshDisplayPanel();
    });
    modeSwitch.appendChild(btn);
  });
  modeRow.append(modeLabel, modeSwitch);
  displayPanelEl.appendChild(modeRow);

  const groups = [
    ["light", "淺色"],
    ["dark", "深色"],
    ["special", "特殊"]
  ];

  groups.forEach(([groupId, groupName]) => {
    const label = document.createElement("div");
    label.className = "display-group-label";
    label.textContent = groupName;

    const grid = document.createElement("div");
    grid.className = "display-swatches";

    THEMES.forEach((theme, index) => {
      if (theme.group !== groupId) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "display-swatch";
      button.dataset.themeId = theme.id;
      button.setAttribute("aria-pressed", "false");

      const chip = document.createElement("span");
      chip.className = "display-swatch-chip";
      chip.style.background = theme.swatchBg;
      chip.style.color = theme.swatchText;
      chip.textContent = "字";

      const name = document.createElement("span");
      name.textContent = theme.name;

      button.append(chip, name);
      button.addEventListener("click", () => {
        applyTheme(index);
        refreshDisplayPanel();
      });
      grid.appendChild(button);
    });

    displayPanelEl.append(label, grid);
  });

  const makeSlider = (labelText, min, max, step, onInput) => {
    const row = document.createElement("div");
    row.className = "display-slider-row";
    const lab = document.createElement("label");
    lab.textContent = labelText;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.setAttribute("aria-label", labelText);
    const value = document.createElement("div");
    value.className = "display-slider-value";
    input.addEventListener("input", () => onInput(parseFloat(input.value), value));

    // v2.5.1：拖曳時讓面板其餘部分淡出，只留下這一列，方便看到歌詞變化。
    const startAdjust = () => {
      displayPanelEl.classList.add("is-adjusting");
      row.classList.add("is-active");
    };
    const endAdjust = () => {
      displayPanelEl.classList.remove("is-adjusting");
      row.classList.remove("is-active");
    };
    input.addEventListener("pointerdown", startAdjust);
    input.addEventListener("touchstart", startAdjust, { passive: true });
    ["pointerup", "pointercancel", "touchend", "touchcancel", "change", "blur"].forEach(name => {
      input.addEventListener(name, endAdjust);
    });

    row.append(lab, input, value);
    displayPanelEl.appendChild(row);
    return { input, value };
  };

  const fontLabel = document.createElement("div");
  fontLabel.className = "display-group-label";
  fontLabel.textContent = "閱讀";
  displayPanelEl.appendChild(fontLabel);

  const fontSlider = makeSlider("字級", LYRICS_MIN_FONT, LYRICS_MAX_FONT, 1, (v, out) => {
    setLyricsFontSize(v);
    out.textContent = String(Math.round(v));
  });
  displayFontSlider = fontSlider.input;
  displayFontValue = fontSlider.value;

  const lineSlider = makeSlider("行距", LYRICS_LINE_MIN, LYRICS_LINE_MAX, 0.05, (v, out) => {
    applyLyricsLineHeight(v);
    out.textContent = (Math.round(v * 100) / 100).toFixed(2);
    try { localStorage.setItem(LYRICS_LINE_KEY, String(v)); } catch (error) { /* 忽略 */ }
  });
  displayLineSlider = lineSlider.input;
  displayLineValue = lineSlider.value;

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "display-reset";
  reset.textContent = "字級與行距恢復預設";
  reset.addEventListener("click", () => {
    resetLyricsFontSize();
    document.documentElement.style.removeProperty("--lyrics-line-height");
    try { localStorage.removeItem(LYRICS_LINE_KEY); } catch (error) { /* 忽略 */ }
    refreshDisplayPanel();
  });
  displayPanelEl.appendChild(reset);

  document.body.append(displayBackdropEl, displayPanelEl);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && isDisplayPanelOpen()) closeDisplayPanel();
  });
}

function isDisplayPanelOpen() {
  return !!displayPanelEl && !displayPanelEl.classList.contains("hidden");
}

function openDisplayPanel() {
  buildDisplayPanel();
  refreshDisplayPanel();
  displayBackdropEl.classList.remove("hidden");
  displayPanelEl.classList.remove("hidden");
  document.body.classList.add("display-panel-open");
  if (displayButtonEl) displayButtonEl.setAttribute("aria-expanded", "true");
}

function closeDisplayPanel() {
  if (!displayPanelEl) return;
  displayBackdropEl.classList.add("hidden");
  displayPanelEl.classList.add("hidden");
  displayPanelEl.classList.remove("is-adjusting");
  displayPanelEl.querySelectorAll(".display-slider-row").forEach(r => r.classList.remove("is-active"));
  document.body.classList.remove("display-panel-open");
  if (displayButtonEl) displayButtonEl.setAttribute("aria-expanded", "false");
}

function toggleDisplayPanel() {
  if (isDisplayPanelOpen()) closeDisplayPanel();
  else openDisplayPanel();
}

function setupDisplayPanelV250() {
  loadLyricsLineHeight();

  // 歌詞標題列：固定在上方，往下捲動時仍看得到。
  const top = document.querySelector(".hymn-top");
  if (top && !top.querySelector(".display-button")) {
    displayButtonEl = document.createElement("button");
    displayButtonEl.type = "button";
    displayButtonEl.className = "display-button";
    displayButtonEl.textContent = "Aa";
    displayButtonEl.setAttribute("aria-label", "顯示設定");
    displayButtonEl.setAttribute("aria-expanded", "false");
    displayButtonEl.addEventListener("click", event => {
      event.stopPropagation();
      toggleDisplayPanel();
    });
    displayButtonEl.addEventListener("keydown", event => event.stopPropagation());
    top.appendChild(displayButtonEl);
  }
}

document.addEventListener("DOMContentLoaded", setupDisplayPanelV250);


/* =========================================================
   v2.6.0｜數字鍵盤選歌
   鍵盤：7 8 9 0 ／ 4 5 6 C ／ 1 2 3 ✓
   - 輸入的數字顯示在歌本區中央的浮動視窗（最多 4 位，開頭的 0 忽略）
   - C：全部清空並收起視窗
   - ✓：開啟目前歌本的該首；不存在時數字變警示色，不清空
   - 點鍵盤以外的地方、切換歌本、切換選歌方式：清空並收起
========================================================= */

const PICKER_MODE_KEY = "hymnalPickerMode";
const PAD_MAX_DIGITS = 4;

let pickerMode = "wheel";
let padDigits = "";
let padFloatEl = null;
let padPanelEl = null;
let padHelpEl = null;
let wheelHelpText = "";

function renderPadFloat() {
  if (!padFloatEl) return;
  padFloatEl.classList.remove("is-invalid");
  if (padDigits) {
    padFloatEl.textContent = padDigits;
    padFloatEl.classList.remove("hidden");
    // 浮動視窗高度為歌本區的 1/3，數字大小隨視窗高度調整，避免太小或被裁切。
    const height = padFloatEl.offsetHeight;
    if (height) {
      padFloatEl.style.fontSize = `${Math.max(18, Math.min(52, Math.round(height * 0.46)))}px`;
    }
  } else {
    padFloatEl.textContent = "";
    padFloatEl.classList.add("hidden");
  }
}

function clearPad() {
  padDigits = "";
  renderPadFloat();
}

function padPress(key) {
  if (key === "clear") {
    clearPad();
    return;
  }

  if (key === "confirm") {
    if (!padDigits) return;
    const hymn = findHymn(selectedBook, Number(padDigits));
    if (!hymn) {
      // 不存在：警示色、不開歌、不清空（重新觸發抖動動畫）
      padFloatEl.classList.remove("is-invalid");
      void padFloatEl.offsetWidth;
      padFloatEl.classList.add("is-invalid");
      return;
    }
    openSearchResult(hymn);
    clearPad();
    return;
  }

  // 數字鍵
  if (padDigits.length >= PAD_MAX_DIGITS) return;
  if (padDigits === "" && key === "0") return;
  padDigits += key;
  renderPadFloat();
}

function setPickerMode(mode) {
  pickerMode = mode === "pad" ? "pad" : "wheel";
  document.body.classList.toggle("picker-pad", pickerMode === "pad");
  clearPad();

  if (padHelpEl) {
    padHelpEl.textContent = pickerMode === "pad" ? "輸入歌號後按 ✓ 開啟" : wheelHelpText;
  }

  try { localStorage.setItem(PICKER_MODE_KEY, pickerMode); } catch (error) { /* 忽略 */ }
}

function setupNumberPadV260() {
  padFloatEl = document.getElementById("padFloat");
  padPanelEl = document.getElementById("padPanel");
  padHelpEl = document.getElementById("wheelHelp");
  if (!padFloatEl || !padPanelEl) return;

  wheelHelpText = padHelpEl ? padHelpEl.textContent : "";

  padPanelEl.addEventListener("click", event => {
    const key = event.target.closest && event.target.closest(".pad-key");
    if (key) padPress(key.dataset.key);
  });

  // 點鍵盤以外的任何地方（含浮動視窗本身）：清空並收起。
  document.addEventListener("pointerdown", event => {
    if (!padDigits) return;
    if (event.target.closest && event.target.closest("#padPanel")) return;
    clearPad();
  });

  // 切換歌本時清空，因為原本輸入的歌號不再適用。
  if (typeof selectBook === "function") {
    const originalSelectBook = selectBook;
    selectBook = function () {
      clearPad();
      return originalSelectBook.apply(this, arguments);
    };
  }

  let saved = "wheel";
  try { saved = localStorage.getItem(PICKER_MODE_KEY) || "wheel"; } catch (error) { /* 忽略 */ }
  setPickerMode(saved);
}

document.addEventListener("DOMContentLoaded", setupNumberPadV260);
