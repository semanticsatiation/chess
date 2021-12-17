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

function App() {
  const [boardState, setBoardState] = useState([...defaultBoard]);

  const [convertOptions, setConvertOptions] = useState({
    isShown: false,
    pieceToConvert: undefined
  });

  const [gameState, setGameState] = useState({
    currentTurn: "b",
    currentPiece: undefined,

    // currentlyEnPassantable should be set to undefined when the turn comes back to 
    // the player that moved their pawn and caused the currentlyEnPassantable to be not undefined
    // currentlyEnPassantable[0] is black and obviously white is [1]
    currentlyEnPassantable: [[], []],
    validPositions: [],
    dangerZones: new Set([]),
    deadPieces: [[], []],
    castlelable: {
      "b": [0, 4, 7],
      "w": [56, 60, 63]
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
    setGameState((state) => ({
      ...state,
      currentPiece: undefined,
      validPositions: [],
      dangerZones: markDangerZones()
    }));
  }, [gameState.currentTurn, convertOptions.isShown]);


  const markDangerZones = () => {
    const dangerZones = new Set([]);

    boardState.forEach((piece) => {
      const pieceTraits = pieceCharacteristics[piece[1]];

      // only grab pieces from the opponent so we can figure out where they are currently threatening the current player's space
      if (gameState.currentTurn !== piece[2]) {
        if (pieceTraits.moveMoreThanOneBlock) {
          addBadPositions(dangerZones, pieceTraits.moveSet, piece[0], true);
        } else {
          // since pawns can only move in one direction, we must separate the moving logic from white and black
          // white only goes up while black only goes down
          piece[1] === "p" ? (
            piece[2] === "b" ? (
              addBadPositions(dangerZones, [pieceTraits.moveSet[0][2], pieceTraits.moveSet[0][3]], piece[0])
            ) : (
              addBadPositions(dangerZones, [pieceTraits.moveSet[1][2], pieceTraits.moveSet[1][3]], piece[0])
            )
          ) : (
            addBadPositions(dangerZones, pieceTraits.moveSet, piece[0])
          )
        }
      }
    });

    return new Set(dangerZones);
  }

  const addBadPositions = (endArr, moves, pos, isRecursion = false) => {
    if (isRecursion) {
      moves.forEach((move) => {
        const newPos = [move[0] + pos[0], move[1] + pos[1]];

        if (isWithinBoardGrid(newPos)) {
          endArr.add(indexPiece(newPos));
        }

        
        if (!isWithinBoardGrid(newPos) || findPiece(newPos) !== undefined) {
          return;
        }

        addBadPositions(endArr, [move], newPos, isRecursion);
      });
    } else {
      moves.forEach((move) => {
        const newPos = [move[0] + pos[0], move[1] + pos[1]];

        if ((!isWithinBoardGrid(newPos))) {
          return;
        }

        endArr.add(indexPiece(newPos));
      });
    }
  };

  const markValidPositions = () => {
    const piece = gameState.currentPiece;
    const pieceTraits = pieceCharacteristics[piece[1]];
    const moves = pieceTraits.moveSet;
    const validMoves = [];
    const castleArr = gameState.castlelable[gameState.currentTurn];
    const castleResults = [[isCastleable([[[0, 0], [0, -1], [0, -2]], [0, -3], [0, -4]], piece[0], castleArr), [0, -2]], [isCastleable([[[0, 0], [0, 1], [0, 2]], null, [0, 3]], piece[0], castleArr), [0, 2]]];

    if (pieceTraits.moveMoreThanOneBlock) {
      addPositions(validMoves, moves, piece[0], true);
    } else {
      if (piece[1] === "p") {
        piece[2] === "b" ? (
          // piece[0][0] === 1, piece[0][0] === 6 are to figure out if the current pawn in is its original tile and hasn't moved
          // if it still is, give the the ability to move to spaces forward 
          // the ability is not granted yet unless it passes the conditions in the addPositions function
          addPositions(validMoves, [...piece[0][0] === 1 ? (moves[0]) : ([moves[0][0]]), moves[0][2], moves[0][3]], piece[0])
        ) : (
          addPositions(validMoves, [...piece[0][0] === 6 ? (moves[1]) : ([moves[1][0]]), moves[1][2], moves[1][3]], piece[0])
        )
        // 7 and 119 are to say that the king is no longer in the castle array meaning it moved which makes 
        // the sum of the two rook indices equal to 7 (black) or 119 (white)
      } else if (piece[1] === "kg" && kingHasNotMoved(castleArr) && castleArr.length !== 1 && castleResults.some((r) => r[0] === true)) {
          addPositions(validMoves, [...moves, ...castleResults.map((r) => r[0] ? (r[1]) : (null)).filter(e => e)], piece[0]);
      } else {
        addPositions(validMoves, moves, piece[0]);
      }
    }

    setGameState({
      ...gameState,
      validPositions: validMoves
    })
  };

  const isCastleable = (moves, pos, castleArr) => (
    // check that there are no pieces in the way of the target rook and the king
    castleArr.includes(indexPiece([pos[0] + moves[2][0], pos[1] + moves[2][1]])) && 
      [...moves[0].slice(1), moves[1]].every((move) => (
        move === null ? (true) : (
          findPiece([pos[0] + move[0], pos[1] + move[1]]) === undefined
        )
      )) && isNotInDanger(moves[0], pos) // the two tiles leading up to the rooks are not in danger
  )

  const isNotInDanger = (positions, currentPos) => (
    positions.every((move) => (
      !gameState.dangerZones.has(indexPiece([currentPos[0] + move[0], currentPos[1] + move[1]]))
    ))
  ) 

  const kingHasNotMoved = (castleArr) => (
    // if the sum of castlelable array for the current player is not equal to 7 or 119
    // this means their king was never moved
    ![7, 119].includes(castleArr[0] + castleArr[1])
  )

  const setCurrentPiece = (pos, isMarked) => {
    if (!convertOptions.isShown) {
      // if marked, this means we are moving a piece to another position
      if (isMarked) {
        const newBoard = [...boardState];
        const currentTurn = gameState.currentTurn;
        const currentPiece = gameState.currentPiece;
        const currentPieceInd = newBoard.findIndex((arr) => indexPiece(arr[0]) === indexPiece(currentPiece[0]));
  
        newBoard.splice(currentPieceInd, 1);
  
        const targetTileInd = newBoard.findIndex((arr) => indexPiece(arr[0]) === indexPiece(pos));
        const newDeadPieces = [...gameState.deadPieces];
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
          [attacked ? (color === "b" ? ("w") : ("b")) : (color)]:
          attacked ? (
            gameState.castlelable[color === "b" ? ("w") : ("b")].filter((index) => index !== indexPiece(attackee[0]))
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
          currentTurn: currentTurn === "b" ? ("w") : ("b"),
          currentPiece: undefined,
          deadPieces: newDeadPieces,
        }

        // if there is any king or rook interaction AND the current castlelable array is not less than 2
        // continue so we can either castle or modify castlelable
        if (((["kg", "r"].includes(currentPiece[1]) && kingHasNotMoved(castleArr)) || isRookAttacked) && castleArr.length > 1) {
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
  }

  const addPositions = (endArr, moves, pos, isRecursion = false) => {
    if (isRecursion) {
      moves.forEach((move) => {
        const newPos = [move[0] + pos[0], move[1] + pos[1]];

        if (isValidMove(newPos)) {
          endArr.push(indexPiece(newPos));

          if (findPiece(newPos) !== undefined && findPiece(newPos)[2] !== gameState.currentTurn) {
            return;
          }
          
          addPositions(endArr, [move], newPos, isRecursion);
        }
      });
    } else {
      let shouldBreak = false;

      const isInMoveSet = (moveSet, target) => (
        moveSet.findIndex((moveArr) => indexPiece(target) === indexPiece(moveArr)) !== -1
      );

      moves.forEach((move) => {
        const newPos = [move[0] + pos[0], move[1] + pos[1]];

        // different rules for pawns
        if (gameState.currentPiece[1] === "p") {
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
        } else if (isValidMove(newPos)) {
          endArr.push(indexPiece(newPos));
        }
      });
    }
  };

  const isOpposingPieceOrEmpty = (pos) => {
    const foundPiece = findPiece(pos);

    if (foundPiece === undefined) {
      return true;
    };

    return foundPiece[2] !== gameState.currentTurn && foundPiece[1] !== "kg";
  };

  const isValidMove = (pos) => {
    if (isWithinBoardGrid(pos) && isOpposingPieceOrEmpty(pos)) {
      return true;
    };

  

    // remember pawns can only move forward if theree is nothing in the way,
    // also they can only attack diagonally

    // a pawn should be able to attack a pawn diagnolly (if they are on the same row) if that atackee is currentlyEnPassantable
    // but how would this logic work???

    // we can create danger zones for the king meaning if the tiles surrounding the king is all
    // danger, then it is a stalemate (maybe add these danger zones into an array and go from there)
    // and we also gotta see how a check would work...
    // if all areas are dangerous INCLUDING the space the king is on, checkmate
    // if the king is on a dangerous tile BUT there are safe options outside, then a check is happening
    // check is avoidable through king movement or ally interference
    // no other piece besides the king can move to get out of a check BUT other pieces can move if
    // they can get rid of the check on the king
    // KEEP IN MIND: There are others ways of having a stalmate happening (two kings is a stalemate, king vs king and knight, etc...)



    return false;
  };

  const findPiece = (pos) => (
    boardState.find((piece) => indexPiece(piece[0]) === indexPiece(pos))
  );

  return (
    <div className="chess-container">
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



