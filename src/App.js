import { useEffect, useState } from 'react';
import Piece from './components/piece';
import './stylesheets/chess.css';
import { faChessBishop, faChessKing, faChessPawn, faChessKnight, faChessRook, faChessQueen} from '@fortawesome/free-solid-svg-icons';

const defaultBoard = [
  [ [0, 0], "r", "b" ],  [ [0, 1], "kn", "b" ],
  [ [0, 6], "kn", "b" ], [ [0, 7], "r", "b" ],   
  [ [0, 2], "b", "b" ],  [ [0, 3], "q", "b" ],
  [ [0, 4], "kg", "b" ], [ [0, 5], "b", "b" ],
  [ [1, 0], "p", "b" ],  [ [1, 1], "p", "b" ],
  [ [1, 2], "p", "b" ],  [ [1, 3], "p", "b" ],
  [ [1, 4], "p", "b" ],  [ [1, 5], "p", "b" ],
  [ [1, 6], "p", "b" ],  [ [1, 7], "p", "b" ],
  [ [6, 0], "p", "w" ],  [ [6, 1], "p", "w" ],
  [ [6, 2], "p", "w" ],  [ [6, 3], "p", "w" ],
  [ [6, 4], "p", "w" ],  [ [6, 5], "p", "w" ],
  [ [6, 6], "p", "w" ],  [ [6, 7], "p", "w" ],
  [ [7, 0], "r", "w" ],  [ [7, 1], "kn", "w" ],
  [ [7, 2], "b", "w" ],  [ [7, 3], "q", "w" ],
  [ [7, 4], "kg", "w" ], [ [7, 5], "b", "w" ],
  [ [7, 6], "kn", "w" ], [ [7, 7], "r", "w" ]
];

// TEST ALL CHECK AND CHECKMATE POSSIBILITIES

// if all areas are dangerous INCLUDING the space the king is on, checkmate UNLESS we can capture or block
// if the king is on a dangerous tile BUT there are safe options outside, then a check is happening
// check is avoidable through king movement or ally interference
// no other piece besides the king can move to get out of a check BUT other pieces can move if
// they can get rid of the check on the king
// KEEP IN MIND: There are others ways of having a stalmate happening (two kings is a stalemate, king vs king and knight, etc...)

// DON'T FORGET TO ADD EN PASSANT

// CHECK HOW LETTING OUR PAWN CONVERT CHANGES WITH THE BOARD SINCE IT ACTIVATES THE [gameState.currentTurn, convertOptions.isShown] EFFECT (SECOND EFFECT)!!!!!!!
// ALSO CHECK IF IT WORKS WITH OTHER CONDITIONS LIKE CHECKMATE, CHECK, DOUBLE CHECK, ILLEGAL MOVES (REWIND CONVERSION IF ILLEGAL), ETC...
// JUST CHECKED!!!!  CONVERTING ON AN ILLEGAL MOVE CRASHES THE APP!!!!! FOR INSTANCE, CONVERTING WHEN OWN KING IS IN CHECK CRASHES THE APP!!!!
const pieceCharacteristics = {
  "r": {
      moveSet: [[-1, 0], [1, 0], [0, -1], [0, 1]],
      chessPiece: faChessRook,
      moveMoreThanOneBlock: true
  },
  "kn": {
      moveSet: [[2, 1], [-2, -1], [-2, 1], [2, -1], [-1, -2], [-1, 2], [1, -2], [1, 2]],
      chessPiece: faChessKnight,
      moveMoreThanOneBlock: false
  },
  "b": {
      moveSet: [[1, -1], [1, 1], [-1, 1], [-1, -1]],
      chessPiece: faChessBishop,
      moveMoreThanOneBlock: true
  },
  "q": {
      moveSet: [[-1, 0], [1, 0], [0, -1], [0, 1], [1, -1], [1, 1], [-1, 1], [-1, -1]],
      chessPiece: faChessQueen,
      moveMoreThanOneBlock: true
  },
  "kg": {
      moveSet: [[-1, 0], [1, 0], [0, -1], [0, 1], [1, -1], [1, 1], [-1, 1], [-1, -1]],
      chessPiece: faChessKing,
      moveMoreThanOneBlock: false
  },
  "p": {
      moveSet: [[[1, 0], [2, 0], [1, 1], [1, -1]], [[-1, 0], [-2, 0], [-1, 1], [-1, -1]]],
      chessPiece: faChessPawn,
      moveMoreThanOneBlock: false
  },
};

const indexPiece = (pos) => (
  (pos[0] * 8) + pos[1]
);

const isWithinBoardGrid = (pos) => (
  pos[0] <= 7 && pos[1] <= 7 && pos[0] >= 0 && pos[1] >= 0
);

const oppositeColor = (color) => (
  color === "b" ? ("w") : ("b")
);

const isCheck = (attackingKing) => (
  attackingKing.length > 0
);

const isDoubleCheck = (attackingKing) => (
  attackingKing.length > 1
);

let opposingKingInSight = false;

function App() {
  const [boardState, setBoardState] = useState([...defaultBoard]);

  const [convertOptions, setConvertOptions] = useState({
    isShown: false,
    pieceToConvert: undefined
  });

  const [gameState, setGameState] = useState({
    currentTurn: "w",
    currentPiece: undefined,

    // currentlyEnPassantable should be set to undefined when the turn comes back to 
    // the player that moved their pawn and caused the currentlyEnPassantable to be not undefined
    // currentlyEnPassantable[0] is black and obviously white is [1]
    currentlyEnPassantable: [[], []],
    validPositions: [],
    dangerZones: new Set([]),
    isAttackingKing: [],
    validKingMoves: [],
    deadPieces: [[], []],
    castlelable: {
      "b": [0, 4, 7],
      "w": [56, 60, 63]
    },
    gameIsOver: false,
    lastBoardState: {
      gameState: {},
      boardState: []
    }
  });

  useEffect(() => {
    if (gameState.currentPiece !== undefined && gameState.currentPiece[2] === gameState.currentTurn) {
      markValidPositions();
    } else {
      setGameState((state) => ({
        ...state,
        currentPiece: undefined,
        validPositions: [],
      }));
    }
  }, [gameState.currentPiece]);

  useEffect(() => {
    const dangers = markDangerZones(gameState.currentTurn, null, true);
    const checkLastPlayersStatus = markDangerZones(oppositeColor(gameState.currentTurn), null, true);

    // if the last players turn still ended up with a check, then their last move was invalid and 
    // we need to restore the last move to before it was made and they have to go again
    // BUT we pnly do this is there was a check AND the game is not over
    if (!gameState.gameIsOver) {
      if (isCheck(checkLastPlayersStatus[1])) {
        setGameState({
          ...gameState,
          ...gameState.lastBoardState.gameState,
        });
  
        setBoardState([
          ...gameState.lastBoardState.boardState
        ]);
      } else {
        const king = boardState.find((piece) => piece[1] === "kg" && piece[2] === gameState.currentTurn);
        const castleArr = gameState.castlelable[gameState.currentTurn];
    
        // let's us know if we can castle on the left or right side (respectively)
        const castleResults = [[isCastleable([[[0, 0], [0, -1], [0, -2]], [0, -3], [0, -4]], king[0], castleArr, dangers[0]), [0, -2]], [isCastleable([[[0, 0], [0, 1], [0, 2]], null, [0, 3]], king[0], castleArr, dangers[0]), [0, 2]]];
        const validKingMoves = [];
        const moves = pieceCharacteristics["kg"].moveSet;
    
        const isValidKingMove = (pos) => (
          isValidMove(pos) && !dangers[0].has(indexPiece(pos))
        );
    
        if (kingHasNotMoved(castleArr) && castleArr.length !== 1 && castleResults.some((r) => r[0] === true)) {
          [...moves, ...castleResults.map((r) => r[0] ? (r[1]) : (null)).filter(e => e)].forEach((move) => {
            const newPos = [move[0] + king[0][0], move[1] + king[0][1]];
    
            if (isValidKingMove(newPos)) {
              validKingMoves.push(indexPiece(newPos));
            }
          });
        } else {
          moves.forEach((move) => {
            const newPos = [move[0] + king[0][0], move[1] + king[0][1]];
    
            if (isValidKingMove(newPos)) {
              validKingMoves.push(indexPiece(newPos));
            }
          });
        }
    
         // when the current turn changes, we need to check if there are any checks, checkmates, or stalemates for the current player
        if (isCheckmate(validKingMoves, gameState.currentTurn, dangers[1]) || isStalemate()) {
          setGameState((state) => ({
            ...state,
            gameIsOver: [true, oppositeColor(gameState.currentTurn)]
          }));
        } else {
          setGameState((state) => ({
            ...state,
            currentPiece: undefined,
            validPositions: [],
            dangerZones: dangers[0],
            validKingMoves: validKingMoves,
            isAttackingKing: dangers[1]
          }));
        }
      }
    }
  }, [gameState.currentTurn, convertOptions.isShown]);


  const markDangerZones = (color, skipPiece = null, checkAttackerPath = false) => {
    const dangerZones = [new Set([]), []];

    boardState.forEach((piece) => {
      const pieceTraits = pieceCharacteristics[piece[1]];

      // only grab pieces from the opponent so we can figure out where they are currently threatening the current player's space
      if (piece[2] !== color && piece[1] !== skipPiece) {
        if (pieceTraits.moveMoreThanOneBlock) {
          addBadPositions(dangerZones, pieceTraits.moveSet, piece[0], checkAttackerPath, color, true, piece[0]);
        } else {
          // since pawns can only move in one direction, we must separate the moving logic from white and black
          // white only goes up while black only goes down
          piece[1] === "p" ? (
            piece[2] === "b" ? (
              addBadPositions(dangerZones, [pieceTraits.moveSet[0][2], pieceTraits.moveSet[0][3]], piece[0], checkAttackerPath, color)
            ) : (
              addBadPositions(dangerZones, [pieceTraits.moveSet[1][2], pieceTraits.moveSet[1][3]], piece[0], checkAttackerPath, color)
            )
          ) : (
            addBadPositions(dangerZones, pieceTraits.moveSet, piece[0], checkAttackerPath, color)
          )
        }
      }
    });

    return dangerZones;
  }

  const markValidPositions = () => {
    const piece = gameState.currentPiece;
    const pos = piece[0];
    const type = piece[1];
    const pieceTraits = pieceCharacteristics[piece[1]];
    const moves = pieceTraits.moveSet;
    let validMoves = [];

    if (!gameState.gameIsOver) {
      if (pieceTraits.moveMoreThanOneBlock) {
        addPositions(validMoves, type, moves, pos, true);
      } else {
        if (type === "p") {
          piece[2] === "b" ? (
            // pos[0] === 1, pos[0] === 6 are to figure out if the current pawn in is its original tile and hasn't moved
            // if it still is, give the the ability to move to spaces forward 
            // the ability is not granted yet unless it passes the conditions in the addPositions function
            addPositions(validMoves, type, [...pos[0] === 1 ? (moves[0]) : ([moves[0][0], moves[0][2], moves[0][3]])], pos)
          ) : (
            addPositions(validMoves, type, [...pos[0] === 6 ? (moves[1]) : ([moves[1][0], moves[1][2], moves[1][3]])], pos)
          )
        } else if (type === "kg") {
          validMoves = gameState.validKingMoves;
        } else {
          addPositions(validMoves, type, moves, pos);
        }
      }
  
      setGameState({
        ...gameState,
        validPositions: validMoves
      });
    }
  };

  const addBadPositions = (endArr, moves, pos, checkAttackerPath, color, isRecursion = false, root = undefined) => {
    const kingPos = indexPiece(boardState.find((piece) => piece[1] === "kg" && piece[2] === color)[0]);
    
    if (isRecursion) {
      opposingKingInSight = false;

      moves.forEach((move) => {
        const newPos = [move[0] + pos[0], move[1] + pos[1]];

        if (isWithinBoardGrid(newPos)) {

          endArr[0].add(indexPiece(newPos));

          // the following tells us who is attacking the current player's king and their path excluding root and attackee
          if (kingPos === indexPiece(newPos) && checkAttackerPath) {
            endArr[1].push([indexPiece(root), []]);

            opposingKingInSight = true;
          }
        }
        
        if (!isWithinBoardGrid(newPos) || findPiece(newPos) !== undefined) {
          return false;
        }

        addBadPositions(endArr, [move], newPos, checkAttackerPath, color, isRecursion, root);
        
        if (opposingKingInSight) {
          endArr[1][0][1].push(indexPiece(newPos));
        }
      });
    } else {
      moves.forEach((move) => {
        const newPos = [move[0] + pos[0], move[1] + pos[1]];

        if ((!isWithinBoardGrid(newPos))) {
          return;
        }

        endArr[0].add(indexPiece(newPos));

        // this is telling us who is attacking the current player's king
        if (kingPos === indexPiece(newPos) && checkAttackerPath) {
          endArr[1].push([indexPiece(pos), []]);
        }
      });
    }
  };

  const addPositions = (endArr, type, moves, pos, isRecursion = false) => {
    if (isRecursion) {
      moves.forEach((move) => {
        const newPos = [move[0] + pos[0], move[1] + pos[1]];

        if (isValidMove(newPos)) {
          endArr.push(indexPiece(newPos));

          if (findPiece(newPos) !== undefined && findPiece(newPos)[2] !== gameState.currentTurn) {
            return;
          }
          
          addPositions(endArr, type, [move], newPos, isRecursion);
        }
      });
    } else {
      let shouldBreak = false;

      const isInMoveSet = (moveSet, target) => (
        moveSet.findIndex((moveArr) => indexPiece(target) === indexPiece(moveArr)) !== -1
      );

      moves.forEach((move) => {
        const newPos = [move[0] + pos[0], move[1] + pos[1]];

        if (isValidMove(newPos)) {
          // different rules for pawns
          if (type === "p") {
            const foundPiece = findPiece(newPos);

            // if there is a piece in front of a pawn, do not let it advance 2 spaces if the pawn is still at its original tile
            if (isInMoveSet([[1, 0], [-1, 0]], move) && foundPiece !== undefined) {
              shouldBreak = true;
            } else {
              // let the pawn advance one OR two spaces IF there are no pieces in the way; two spaces IF there are no pieces in front of the pawn
              if (isInMoveSet([[1, 0], [2, 0], [-1, 0], [-2, 0]], move) && foundPiece === undefined && !shouldBreak) {
                endArr.push(indexPiece(newPos));
              // the pawn can not attack any opponent pieces unless it is diagonally ALSO, the king cannot be attacked
              } else if (isInMoveSet([[1, 1], [1, -1], [-1, 1], [-1, -1]], move) && foundPiece !== undefined && foundPiece[1] !== "kg" && foundPiece[2] !== gameState.currentTurn) {
                endArr.push(indexPiece(newPos));
              }
            }
          } else {
            endArr.push(indexPiece(newPos));
          } 
        } else {
          shouldBreak = true;
        }
      });
    }
  };

  const isCastleable = (moves, pos, castleArr, dangerZones) => (
    // check that there are no pieces in the way of the target rook and the king
    castleArr.includes(indexPiece([pos[0] + moves[2][0], pos[1] + moves[2][1]])) && 
      [...moves[0].slice(1), moves[1]].every((move) => (
        move === null ? (true) : (
          findPiece([pos[0] + move[0], pos[1] + move[1]]) === undefined
        )
      )) && moves[0].every((move) => (
      !dangerZones.has(indexPiece([pos[0] + move[0], pos[1] + move[1]]))
    )) // the two tiles leading up to the rooks are not in danger
  );

  const kingHasNotMoved = (castleArr) => (
    // if the sum of castlelable array for the current player is not equal to 7 or 119
    // this means their king was never moved
    ![7, 119].includes(castleArr[0] + castleArr[1])
  );

  const setCurrentPiece = (pos, isMarked) => {
    if (!convertOptions.isShown && !gameState.gameIsOver) {
      // if marked, this means we are moving a piece to another position
      if (isMarked) {
        const newBoard = [...boardState];
        const currentTurn = gameState.currentTurn;
        const currentPiece = gameState.currentPiece;
        const currentPieceInd = newBoard.findIndex((arr) => indexPiece(arr[0]) === indexPiece(currentPiece[0]));

        newBoard.splice(currentPieceInd, 1);
  
        const targetTileInd = newBoard.findIndex((arr) => indexPiece(arr[0]) === indexPiece(pos));

        // I NEED TO BE EXTREMELY CAREFUL HERE.  ORIGINALYL I WAS DOING THIS: [...gameState.deadPieces]
        // BUT THIS DOESN'T CREATE A DEEP  COPY, IT ONLY CREATES A SHALLOW COPY!!!!!!!
        // MEANING I WAS MODIFYING THE STATE DIRECTLY SO I HAD TO CREATE A COPY OF BOTH SIDES LIKE SO:
        const newDeadPieces = [[...gameState.deadPieces[0]], [...gameState.deadPieces[1]]];
        let attackee = [];
  
        // we are attacking a piece if true
        if (targetTileInd !== -1) {
          attackee = newBoard[targetTileInd];
  
          currentTurn === "b" ? (newDeadPieces[1].push(attackee)) : (newDeadPieces[0].push(attackee));
  
          newBoard.splice(targetTileInd, 1);
        }

        const castleArr = gameState.castlelable[currentTurn];
        const isRookAttacked = attackee[1] === "r";

        const setCastlelable = (attacked, color) => ({
          [attacked ? (oppositeColor(color)) : (color)]:
          attacked ? (
            gameState.castlelable[oppositeColor(color)].filter((index) => index !== indexPiece(attackee[0]))
          ) : (
            castleArr.filter((index) => index !== indexPiece(currentPiece[0]))
          )
        });

        const normalPieceMove = () => (
          // just move the piece to the new position
          setBoardState([
            ...newBoard,
            [pos, ...currentPiece.slice(1)]
          ])
        )

        const defaultGameState = {
          ...gameState,
          lastBoardState: {
            boardState: boardState,
            gameState: {
              currentTurn: gameState.currentTurn,
              currentlyEnPassantable: gameState.currentlyEnPassantable,
              deadPieces: gameState.deadPieces,
              castlelable: gameState.castlelable,
            }
          },
          currentTurn: oppositeColor(currentTurn),
          currentPiece: undefined,
          deadPieces: newDeadPieces,
        }

        // if there is any king or rook interaction AND the current castlelable array is not less than 2
        // continue so we can either castle or modify castlelable
        if (((["kg", "r"].includes(currentPiece[1]) && kingHasNotMoved(castleArr)) || isRookAttacked) && castleArr.length > 1) {
          // create a snapshot of the baord here in case current player makes an illegal move
          // and we have to roll back everything; this also includes deadPieces and castleable
          setGameState({
            ...defaultGameState,
            castlelable: {
              ...gameState.castlelable,
              ...(isRookAttacked && currentPiece[1] === "r" ? (
                {
                  ...setCastlelable(isRookAttacked, currentTurn),
                  ...setCastlelable(!isRookAttacked, currentTurn)
                }
              ) : (setCastlelable(isRookAttacked, currentTurn)))
            }
          });

          // this is where the actual castling takes place 
          // [2, 6, 58, 62].includes(indexPiece(pos)) lets us know if the king has moved to a castling position
          if (currentPiece[1] === "kg" && [2, 6, 58, 62].includes(indexPiece(pos))) {
            const isLeftRook = [2, 58].includes(indexPiece(pos));
            const rookInd = newBoard.findIndex((arr) => indexPiece(arr[0]) === (isLeftRook ? (castleArr[0]) : (castleArr[castleArr.length - 1])));          
            const newRookArr = [...newBoard[rookInd]];
    
            newBoard.splice(rookInd, 1);
  
            setBoardState([
              ...newBoard,
              [(isLeftRook ? ([newRookArr[0][0], newRookArr[0][1] + 3]) : ([newRookArr[0][0], newRookArr[0][1] - 2])), ...newRookArr.slice(1)],
              [pos, ...currentPiece.slice(1)]
            ]);
          } else {
            normalPieceMove();
          }
        } else {
          setGameState({
            ...defaultGameState
          });

          normalPieceMove();
        }
  
        if (currentPiece[1] === "p") {
          // if a pawn reaches the opponents side, give them the option to convert
          if ((pos[0] === 7 && currentPiece[2] === "b") || (pos[0] === 0 && currentPiece[2] === "w")) {
           setConvertOptions({
             isShown: true,
             pieceToConvert: [pos, ...currentPiece.slice(1)]
           });
          }
        }
      } else {
        setGameState({
          ...gameState,
          currentPiece: findPiece(pos)
        });
      }
    }
  };

  const convertPawn = (pos, newPiece) => {
    const foundPiece = findPiece(pos);
    const newBoard = [...boardState];

    newBoard.splice(newBoard.findIndex((piece) => indexPiece(piece) === indexPiece(pos)), 1);

    setConvertOptions({
      isShown: false,
      pieceToConvert: undefined
    });

    setBoardState([
      ...newBoard,
      [pos, newPiece, foundPiece[2]]
    ]);
  };

  const isOpposingPieceOrEmpty = (pos) => {
    const foundPiece = findPiece(pos);

    if (foundPiece === undefined) {
      return true;
    };

    return foundPiece[2] !== gameState.currentTurn && foundPiece[1] !== "kg";
  };

  const isValidMove = (pos) => (
    isWithinBoardGrid(pos) && isOpposingPieceOrEmpty(pos)
  );

  const findPiece = (pos) => (
    boardState.find((piece) => indexPiece(piece[0]) === indexPiece(pos))
  );

  const isCapturable = (color, kingMoves, attackingKing) => {
    // this returns the danger zones for the current player's pieces
    // when we gather said dangers zones, we will see if the piece attacking the king (gameState.isAttackingKing[0]) is within these danger zones
    // if so, then we are able to get rid of the check other wise, the king has to move or an ally has to block
    // oppositeColor(gameState.currentTurn) is because markDangerZones only picks pieces that are NOT the color that is passed into the params
    const currentPlayerDangerZones =  markDangerZones(color, "kg");
    // the reason why we're skipping the king's moves here is because we already have the king's valid moves when we use
    // isCapturable and the way we determine the king's valid moves is different than other pieces
    // if we were to markDangerZones without skipping the the king's moves
    // the following situation is considered valid:
    // a king can attack a queen, that's being protected by a rook, which is not legal!!!
    // this happens because markDangerZones considers all the kings moves to be dangerous towards othe pieces
    // when that is not true since the king can not throw itself INTO danger 
    // which markDangerZones does not consider so we have to treat the king differently
    // if isAttackingKing[0][0] is included in the danger zones for the current player's pieces,
    // we are able to capture it and get rid of the check that is on the king
    return [...kingMoves, ...currentPlayerDangerZones[0]].includes(attackingKing[0][0]);
  };

  const isBlockable = (color, attackingKing) => {
    const validMoves = [];

    // for this we only want pieces that can block with movements (excluding king)
    // so what this means is we are going to exclude pawn attacks since these can only occur when there is
    // an opponent piece diagonally from it meaning it will never be able to block this way but only going forward.
    boardState.forEach((piece) => {
      const pieceTraits = pieceCharacteristics[piece[1]];
      const pos = piece[0];
      const type = piece[1];
      const moves = pieceTraits.moveSet;

      if (piece[2] === color && type !== "kg") {
        if (pieceTraits.moveMoreThanOneBlock) {
          addPositions(validMoves, type, pieceTraits.moveSet, pos, true);
        } else {
          if (type === "p") {
            piece[2] === "b" ? (
              addPositions(validMoves, type, [moves[0][0], ...pos[0] === 1 ? ([moves[0][1]]) : ([])], pos)
            ) : (
              addPositions(validMoves, type, [moves[1][0], ...pos[0] === 6 ? ([moves[1][1]]) : ([])], pos)
            )
          } else {
            addPositions(validMoves, type, moves, pos);
          }
        }
      }
    });

    return attackingKing.some((arr) => arr[1].some((atk) => validMoves.includes(atk)));
  };

  const isStalemate = () => (
    false
  );

  const isCheckmate = (validKingMoves, currentTurn, attackingKing) => (
    // SINCE THERE ARE THINGS PASSED INTO HERE THAT NEED THE CURRENT STATE IN THE SECOND EFFECT, WE DON'T DO gameState.example IN ANY OF THESE
    // FUNCTIONS BECAUSE THEY ARE BASED ON THE STATE THAT IS ABOUT TO COME UP

    // if there is a double check && the king is in danger AND the king has no valid moves, it is a checkmate!!!
    // OR 
    // if the king is in check && we cannot block the ayttack and we cannot capture the attacker && the king has no more valid moves, it is a checkmate!!!
    validKingMoves <= 0 && (isDoubleCheck(attackingKing) || (isCheck(attackingKing) && !isBlockable(currentTurn, attackingKing) && !isCapturable(oppositeColor(currentTurn), validKingMoves, attackingKing)))
  );

  return (
    <div className="chess-container">
      <div>{
        gameState.gameIsOver[0] ? (`YOU WON ${gameState.gameIsOver[1]}`) : (null)
      }</div>
      <header>
        <ul className="dead-pieces">{
          gameState.deadPieces[0].map((piece, ind) => (
            <li key={ind}>
              <Piece
                icon={pieceCharacteristics[piece[1]].chessPiece}
                color={piece[2]}
              />
            </li>
          ))
        }</ul>
      </header>
      <ul className="chess-board flex-center">{
        [...Array(8)].map((item, ind) => (
          <li className="row flex-center" key={ind}>{
              [...Array(8)].map((item, i) => {
                const index = indexPiece([ind, i]);

                let piece = findPiece([ind, i]);

                const isMarked = gameState.validPositions.includes(index);
                const isDangerous = gameState.dangerZones.has(index);

                return (
                  <div className={`${isDangerous ? ("danger") : ("")} ${isMarked ? ("mark") : ("")} block ${gameState.currentPiece && index === indexPiece(gameState.currentPiece[0]) ? ("current-piece") : ("")}`} key={i} onClick={(e) => setCurrentPiece([ind, i], isMarked)}>{
                      piece !== undefined ? (
                        <button className="flex-center">
                          <Piece
                            icon={pieceCharacteristics[piece[1]].chessPiece}
                            color={piece[2]}
                          />
                        </button>
                      ) : (null)
                    }
                    {
                      convertOptions.isShown && indexPiece(convertOptions.pieceToConvert[0]) === index ? (
                        <ul className="convert-options flex-center">
                          {
                          ["q", "b", "kn", "r"].map((piece, ind) => (
                            <li key={ind} onClick={e => convertPawn(convertOptions.pieceToConvert[0], piece)}>
                              <button className="flex-center">
                                <Piece
                                  icon={pieceCharacteristics[piece].chessPiece}
                                  color={convertOptions.pieceToConvert[2]}
                                />
                              </button>
                            </li>
                          ))}
                          <div className="arrow-down">
                            <div className="inner-arrow-down">
                            
                            </div>
                          </div>
                        </ul>
                      ) : (null)
                    }
                  </div>
                );
              })
          }</li>
        ))
      }</ul>
      <footer>
        <ul className="dead-pieces flex-center">{
          gameState.deadPieces[1].map((piece, ind) => (
            <li key={ind}>
              <Piece
                icon={pieceCharacteristics[piece[1]].chessPiece}
                color={piece[2]}
              />
            </li>
          ))
        }</ul>
      </footer>
    </div>
  );
};

export default App;



