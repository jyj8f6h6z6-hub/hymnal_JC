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
  bookId
) {

  originalSelectBook(
    bookId
  );

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
          手機雙點歌詞：恢復預設字體。
        */
        if (
          now -
          lyricsLastTapTime <
          320
        ) {

          resetLyricsFontSize();
          lyricsLastTapTime = 0;
          event.preventDefault();

        }
        else {

          lyricsLastTapTime =
            now;

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
