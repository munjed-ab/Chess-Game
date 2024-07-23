//munged_208908

let whitePieces = [
  { type: "R", position: "a1" },
  { type: "N", position: "b1" },
  { type: "B", position: "c1" },
  { type: "Q", position: "d1" },
  { type: "K", position: "e1" },
  { type: "B", position: "f1" },
  { type: "N", position: "g1" },
  { type: "R", position: "h1" },
  { type: "P", position: "a2" },
  { type: "P", position: "b2" },
  { type: "P", position: "c2" },
  { type: "P", position: "d2" },
  { type: "P", position: "e2" },
  { type: "P", position: "f2" },
  { type: "P", position: "g2" },
  { type: "P", position: "h2" },
];

let blackPieces = [
  { type: "R", position: "a8" },
  { type: "N", position: "b8" },
  { type: "B", position: "c8" },
  { type: "Q", position: "d8" },
  { type: "K", position: "e8" },
  { type: "B", position: "f8" },
  { type: "N", position: "g8" },
  { type: "R", position: "h8" },
  { type: "P", position: "a7" },
  { type: "P", position: "b7" },
  { type: "P", position: "c7" },
  { type: "P", position: "d7" },
  { type: "P", position: "e7" },
  { type: "P", position: "f7" },
  { type: "P", position: "g7" },
  { type: "P", position: "h7" },
];

const moveSound = document.getElementById("moveSound");
const boardStart = document.getElementById("boardStart");

let touchStartId = null;
let currentElem = null;

let draggedPiece = null;
let playerTurn = fetchTurn();

console.log("player turn :",playerTurn);
let lastMoves = null;
let legalMoves = [];
let color = getColor();
getLegalMoves();
var isTouchDevice = 'ontouchstart' in window || navigator.msMaxTouchPoints;
if (isTouchDevice) {
  // Mobile phone or touch-enabled device
  let squares = document.querySelectorAll(".square");
  squares.forEach(function(square) {
    square.addEventListener('touchstart', touchStart, { passive: false  });
    square.addEventListener('touchmove', touchMove, { passive: false });
    square.addEventListener('touchend', touchEnd, { passive: false  });
  });
} else {
  // Computer
  let squares = document.querySelectorAll(".square");
  squares.forEach(function(square) {
    square.addEventListener('dragover', onDragOver);
    square.addEventListener('drop', onDrop);
  });
}

drawBoard(color);
game(color);

function getColor(){
  const request = new XMLHttpRequest();
  request.open('GET', '/get_color', false);

  try {
    request.send(null);
    if (request.status === 200) {
      const data = JSON.parse(request.responseText);
      const color = data.color;
      return color;
    } else {
      console.error('Error fetching turn:', request.status);
      return "false";
    }
  } catch (error) {
    console.error('Error fetching turn:', error);
    return "false";
  }
}

function king_sideCastlingW(imageFrom){
    let pieceColor = imageFrom.classList.contains("w") ? "w" : "b";
    let pieceType = imageFrom.alt;
    let piecesArray = pieceColor === "w" ? whitePieces : blackPieces;
    let rook = piecesArray.find(piece => piece.type === "R" && piece.position === "h1");
    let rDivH1 = document.getElementById(rook.position);
    let oldRook = rDivH1.querySelector(".piece");
    rook.position = "f1";
    let rDivF1 = document.getElementById(rook.position);
    rDivF1.appendChild(oldRook);
}

function queen_sideCastlingW(imageFrom){
    let pieceColor = imageFrom.classList.contains("w") ? "w" : "b";
    let pieceType = imageFrom.alt;
    let piecesArray = pieceColor === "w" ? whitePieces : blackPieces;
    let rook = piecesArray.find(piece => piece.type === "R" && piece.position === "a1");
    let rDivA1 = document.getElementById(rook.position);
    let oldRook = rDivA1.querySelector(".piece");
    rook.position = "d1";
    let rDivD1 = document.getElementById(rook.position);
    rDivD1.appendChild(oldRook);
}

function king_sideCastlingB(imageFrom){
    let pieceColor = imageFrom.classList.contains("w") ? "w" : "b";
    let pieceType = imageFrom.alt;
    let piecesArray = pieceColor === "w" ? whitePieces : blackPieces;
    let rook = piecesArray.find(piece => piece.type === "R" && piece.position === "h8");
    let rDivH8 = document.getElementById(rook.position);
    let oldRook = rDivH8.querySelector(".piece");
    rook.position = "f8";
    let rDivF8 = document.getElementById(rook.position);
    rDivF8.appendChild(oldRook);
}

function queen_sideCastlingB(imageFrom){
    let pieceColor = imageFrom.classList.contains("w") ? "w" : "b";
    let pieceType = imageFrom.alt;
    let piecesArray = pieceColor === "w" ? whitePieces : blackPieces;
    let rook = piecesArray.find(piece => piece.type === "R" && piece.position === "a8");
    let rDivA8 = document.getElementById(rook.position);
    let oldRook = rDivA8.querySelector(".piece");
    rook.position = "d8";
    let rDivD8 = document.getElementById(rook.position);
    rDivD8.appendChild(oldRook);
}

function checkCastling(imageFrom, fromSquareId, toSquareId){
    if (fromSquareId === "e1" && toSquareId === "g1") {
          king_sideCastlingW(imageFrom);
    }
    else if (fromSquareId === "e1" && toSquareId === "c1") {
          queen_sideCastlingW(imageFrom);
    }

    else if (fromSquareId === "e8" && toSquareId === "g8") {
          king_sideCastlingB(imageFrom);
    }
    else if (fromSquareId === "e8" && toSquareId === "c8") {
          queen_sideCastlingB(imageFrom);
    }
}
function isPromoting(pieceType, toSquareId)
{
    if(pieceType === "P")
    {
       if (toSquareId.includes("8") || toSquareId.includes("1")) {
            return true;
      }
    }
    return false;
}
function removeLastPiece(squareId) {
  let square = document.getElementById(squareId);
  if (square !== null && square.children.length > 0) {
    let pieceImg = square.querySelector('img');
    if (pieceImg !== null) {
      let pieceColor = pieceImg.classList.contains("w") ? "w" : "b";
      let pieceType = pieceImg.alt;
      let piecesArray = pieceColor === "w" ? whitePieces : blackPieces;
      let capturedPieceIndex = piecesArray.findIndex(piece => piece.type === pieceType && piece.position === squareId);
      if (capturedPieceIndex !== -1) {
        let capturedPiece = piecesArray.splice(capturedPieceIndex, 1)[0];
        square.removeChild(pieceImg);
        console.log('Captured Piece:', capturedPiece);
      }
    }
  }
}



function getLegalMoves() {
  fetch('/get_moves')
    .then(response => response.json())
    .then(data => {
      legalMoves = data.moves;  // Store the legal moves in the list
      console.log('Legal Moves:', legalMoves);
      if (legalMoves.length === 0) {
        let currentPlayer = color === "w" ? "Black" : "White";
        resetGame();
      }
    })
    .catch(error => {
      console.log('Error:', error);
    });
}

function fetchTurn() {
  const request = new XMLHttpRequest();
  request.open('GET', '/turn', false);

  try {
    request.send(null);
    if (request.status === 200) {
      const data = JSON.parse(request.responseText);
      const turn = data.turn;
      return turn;
    } else {
      console.error('Error fetching turn:', request.status);
      return false;
    }
  } catch (error) {
    console.error('Error fetching turn:', error);
    return false;
  }
}



function isLegalMove(fromSquareId, toSquareId) {
  for (let m of legalMoves) {
    if (fromSquareId + toSquareId === m) {
      return true;
    }
  }
  console.log("Not Legal ",fromSquareId+toSquareId);
  return false;
}

function sendMove(fromSquareId, toSquareId) {
  let move = fromSquareId + toSquareId;
  if(isPromoting(fromSquareId, toSquareId))
  {
        move = fromSquareId + toSquareId+"q";
  }


  fetch('/make_move', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({'move': move})
  })
    .catch(error => {
      console.log('Error:', error);
    });
}
function sendPlayerMove(fromSquareId, toSquareId) {
  const move = fromSquareId + toSquareId;

  fetch('/make_move', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 'move': move })
  })
    .then(response => {
      if (response.status === 200) {

        receiveComputerMove();

      } else {
        console.log('Move could not be made:', response.status);
      }
    })
    .catch(error => {
      console.log('Error:', error);
    });
}

function receiveComputerMove() {
  fetch('/get_move')
    .then(response => response.json())
    .then(data => {
      console.log('Computer move:', data.C_move);

      let f = data.C_move[0] + data.C_move[1];
      let t = data.C_move[2] + data.C_move[3];
      makMove(f, t);

      moveSound.play();
      console.log("player turn :",fetchTurn());
      getLegalMoves();
    })
    .catch(error => {
      console.log('Error:', error);
    });
}

function drawBoard(color) {
  boardStart.play();
  if (color === "b") {
    flipChessboard();
  }

  for (let piece of whitePieces) {
    let squareId = piece.position;
    let square = document.getElementById(squareId);
    if (square !== null) {
      let pieceImg = document.createElement("img");
      pieceImg.src = "static/images/" + "w" + piece.type + ".png";
      pieceImg.alt = piece.type;
      pieceImg.draggable = true;
      pieceImg.classList.add("piece", "w");
      if (isTouchDevice) {
          let square = pieceImg.parentNode;
          if (square) {
            square.addEventListener('touchstart', touchStart, { passive: false  });
            square.addEventListener('touchmove', touchMove, { passive: false });
            square.addEventListener('touchend', touchEnd, { passive: false  });
          }
      } else {
          pieceImg.addEventListener("dragstart", onDragStart);
      }
      square.appendChild(pieceImg);
    }
  }

  for (let piece of blackPieces) {
    let squareId = piece.position;
    let square = document.getElementById(squareId);
    if (square !== null) {
      let pieceImg = document.createElement("img");
      pieceImg.src = "static/images/" + "b" + piece.type + ".png";
      pieceImg.alt = piece.type;
      pieceImg.draggable = true;
      pieceImg.classList.add("piece", "b");
      if (isTouchDevice) {
          let square = pieceImg.parentNode;
          if (square) {
            square.addEventListener('touchstart', touchStart, { passive: false  });
            square.addEventListener('touchmove', touchMove, { passive: false });
            square.addEventListener('touchend', touchEnd, { passive: false  });
          }
      } else {
          pieceImg.addEventListener("dragstart", onDragStart);
      }
      square.appendChild(pieceImg);
    }
  }
}
function game(color) {
    getLegalMoves();
    if(playerTurn === true && color ==="w")
    {
        handlePlayerMove(color);
    }
    else if(playerTurn === false && color ==="b")
    {
        handlePlayerMove(color);
    }
    else{
        handleComputerMove(color);
    }


}

function handlePlayerMove(color) {
  let pieces = document.querySelectorAll(".piece");
  let squares = document.querySelectorAll(".square");

  squares.forEach(function(square) {
    square.removeEventListener('touchstart', touchStart);
    square.removeEventListener('touchmove', touchMove);
    square.removeEventListener('touchend', touchEnd);
  });

  if (isTouchDevice) {
    squares.forEach(function(square) {
      square.addEventListener('touchstart', touchStart, { passive: false });
      square.addEventListener('touchmove', touchMove, { passive: false });
      square.addEventListener('touchend', touchEnd, { passive: false });
    });
  } else {
    // Computer
    squares.forEach(function(square) {
      square.addEventListener('dragover', onDragOver);
      square.addEventListener('drop', onDrop);
    });
    pieces.forEach(piece => {
      piece.addEventListener("dragstart", onDragStart);
    });
  }
}

function handleComputerMove(color){
    receiveComputerMove();
    if(legalMoves.length !== 0){
        handlePlayerMove(color);
    }
}

function flipChessboard() {
  let chessboard = document.querySelector(".chessboard");
  let rows = chessboard.querySelectorAll(".row");
  let reversedRows = Array.from(rows).reverse();

  reversedRows.forEach(row => {
    let squares = row.querySelectorAll(".square");
    let reversedSquares = Array.from(squares).reverse();
    reversedSquares.forEach(square => row.appendChild(square));
    chessboard.appendChild(row);
  });
    boardStart.play();
}

function handleTouchMove(startId, endId)
{
    if (isLegalMove(startId, endId)) {

        removeLastPiece(endId);

        const fromSquare = document.getElementById(startId);
        const imageFrom = fromSquare.querySelector(".piece");
        const toSquare = document.getElementById(endId);
        if (imageFrom && toSquare) {
          toSquare.appendChild(imageFrom);
        }

        const pieceColor = imageFrom.classList.contains("w") ? "w" : "b";
        const pieceType = imageFrom.alt;
        const piecesArray = pieceColor === "w" ? whitePieces : blackPieces;

        const movedPiece = piecesArray.find(piece => piece.type === pieceType && piece.position === startId);
        if (movedPiece) {
          movedPiece.position = endId;
        }


        if (pieceType === "K") {
          checkCastling(imageFrom, startId, endId);
        }

        if (isPromoting(pieceType, endId)) {
            if (pieceColor === "w") {
              movedPiece.type = "Q";
              imageFrom.src = "static/images/w" + movedPiece.type + ".png";
              imageFrom.alt = movedPiece.type;
            } else {
              movedPiece.type = "Q";
              imageFrom.src = "static/images/b" + movedPiece.type + ".png";
              imageFrom.alt = movedPiece.type;
            }
            endId = endId + 'q';
        }
        moveSound.play();
        sendPlayerMove(startId, endId);
        getLegalMoves();
    }
}

function touchStart(event) {
  event.preventDefault();
  touchStartId = event.currentTarget.id;
  console.log("Touch Start:",touchStartId);
}
function touchMove(event) {
  event.preventDefault();
  const touch = event.touches[0];
  const x = touch.clientX;
  const y = touch.clientY;
  const element = document.elementFromPoint(x, y);

  if (element.tagName === "IMG") {

    const squareElement = element.parentNode;
    if (squareElement !== currentElem) {
      if (currentElem) {
        currentElem.style.backgroundColor = "";
      }
      squareElement.style.backgroundColor = "blue";
      currentElem = squareElement;
    }
  } else {
    if (element !== currentElem) {
      if (currentElem) {
        currentElem.style.backgroundColor = "";
      }
      element.style.backgroundColor = "blue";
      currentElem = element;
    }
  }
}


function touchEnd(event) {
    event.preventDefault();
    if(currentElem)
    {
        handleTouchMove(touchStartId, currentElem.id);
        currentElem.style.backgroundColor = "";
    }
    touchStartId = null;
    currentElem = null;
}


function onDragStart(event) {
  draggedPiece = event.target;

  // Set the data for the drag-and-drop operation
  event.dataTransfer.setData("text/plain", draggedPiece.parentElement.id);
  event.dataTransfer.dropEffect = "move";
}

function onDragOver(event) {
  event.preventDefault();
}

function onDrop(event) {

  let fromSquareId = event.dataTransfer.getData("text/plain");
  let toSquareId = event.currentTarget.id;

  if (isLegalMove(fromSquareId, toSquareId)) {
    let imageFrom = draggedPiece;
    let squareTo = document.querySelector(`#${toSquareId}`);
    lastMoves = fromSquareId + toSquareId;
    removeLastPiece(toSquareId);

    squareTo.appendChild(imageFrom);

    const pieceColor = imageFrom.classList.contains("w") ? "w" : "b";
    const pieceType = imageFrom.alt;
    const piecesArray = pieceColor === "w" ? whitePieces : blackPieces;

    const movedPiece = piecesArray.find(
      (piece) => piece.type === pieceType && piece.position === fromSquareId
    );
    if (movedPiece) {
      movedPiece.position = toSquareId;
    }

    moveSound.play();
    if (pieceType === "K") {
      checkCastling(imageFrom, fromSquareId, toSquareId);
    }
    if (isPromoting(pieceType, toSquareId)) {
        if (pieceColor === "w") {
          movedPiece.type = "Q";
          imageFrom.src = "static/images/w" + movedPiece.type + ".png";
          imageFrom.alt = movedPiece.type;
        } else {
          movedPiece.type = "Q";
          imageFrom.src = "static/images/b" + movedPiece.type + ".png";
          imageFrom.alt = movedPiece.type;
        }
        toSquareId = toSquareId + 'q';
    }


    sendPlayerMove(fromSquareId, toSquareId);
    lastMove = fromSquareId + toSquareId;
    draggedPiece = null;
    getLegalMoves();
  }
  console.log("Player turn:", fetchTurn());
}




function makePlayerMove(fromSquareId, toSquareId) {

  if (isLegalMove(fromSquareId, toSquareId)) {
    makMove(fromSquareId, toSquareId);
    sendMove(fromSquareId, toSquareId);

  }
  else {
    console.log("Invalid move");
  }
}

function makMove(fromSquareId, toSquareId) {
    if (document.getElementById(toSquareId).hasChildNodes()) {
      removeLastPiece(toSquareId);
    }

    const fromSquare = document.getElementById(fromSquareId);
    const imageFrom = fromSquare.querySelector(".piece");
    const toSquare = document.getElementById(toSquareId);
    toSquare.appendChild(imageFrom);

    const pieceColor = imageFrom.classList.contains("w") ? "w" : "b";
    const pieceType = imageFrom.alt;
    const piecesArray = pieceColor === "w" ? whitePieces : blackPieces;

    const movedPiece = piecesArray.find(piece => piece.type === pieceType && piece.position === fromSquareId);
    if (movedPiece) {
      movedPiece.position = toSquareId;
    }

    if (pieceType === "K") {
      checkCastling(imageFrom, fromSquareId, toSquareId);
    }

    if (isPromoting(pieceType, toSquareId)) {
        if (pieceColor === "w") {
          movedPiece.type = "Q";
          imageFrom.src = "static/images/w" + movedPiece.type + ".png";
          imageFrom.alt = movedPiece.type;
        } else {
          movedPiece.type = "Q";
          imageFrom.src = "static/images/b" + movedPiece.type + ".png";
          imageFrom.alt = movedPiece.type;
        }
    }
}

function resetGame() {
    let squares = document.querySelectorAll(".square");
    squares.forEach(square => {
      const squareId = square.id;
      removeLastPiece(squareId);
      removeLastPiece(squareId);
    });
      // Reset the game variables
    whitePieces = [
      { type: "R", position: "a1" },
      { type: "N", position: "b1" },
      { type: "B", position: "c1" },
      { type: "Q", position: "d1" },
      { type: "K", position: "e1" },
      { type: "B", position: "f1" },
      { type: "N", position: "g1" },
      { type: "R", position: "h1" },
      { type: "P", position: "a2" },
      { type: "P", position: "b2" },
      { type: "P", position: "c2" },
      { type: "P", position: "d2" },
      { type: "P", position: "e2" },
      { type: "P", position: "f2" },
      { type: "P", position: "g2" },
      { type: "P", position: "h2" },
    ];

    blackPieces = [
      { type: "R", position: "a8" },
      { type: "N", position: "b8" },
      { type: "B", position: "c8" },
      { type: "Q", position: "d8" },
      { type: "K", position: "e8" },
      { type: "B", position: "f8" },
      { type: "N", position: "g8" },
      { type: "R", position: "h8" },
      { type: "P", position: "a7" },
      { type: "P", position: "b7" },
      { type: "P", position: "c7" },
      { type: "P", position: "d7" },
      { type: "P", position: "e7" },
      { type: "P", position: "f7" },
      { type: "P", position: "g7" },
      { type: "P", position: "h7" },
    ];
  let userColor = prompt("CHECKMATE!!\n Choose your color: (White/Black)").toLowerCase();
  let currentPlayer = color === "w" ? "White" : "Black";
  if (userColor === "white" || userColor === "w"|| userColor === "White"|| userColor ==="") {
    color = "w";
    if(currentPlayer === "Black")
    {
       flipChessboard();
    }
  } else {
    color = "b";
  }
  drawBoard(color);

  reset_game_color(color);
  playerTurn = fetchTurn();
  getLegalMoves();
  game(color);

  console.log("Reset with color:", color);
  console.log("Player turn:", playerTurn);
  console.log("Legal Moves:", legalMoves);
}

function reset_game_color(color){
   fetch('/reset_game_with_color', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 'color': color }),
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}