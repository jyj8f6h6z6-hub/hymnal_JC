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
