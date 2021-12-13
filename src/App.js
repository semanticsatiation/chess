import { useEffect, useState } from 'react';
import Piece from './components/piece';
import './stylesheets/chess.css';
import { faChessBishop, faChessKing, faChessPawn, faChessKnight, faChessRook, faChessQueen} from '@fortawesome/free-solid-svg-icons';

const defaultBoard = [
  [ [3, 3], "r", "b" ],   [ [0, 1], "kn", "b" ],
  [ [0, 2], "b", "b" ],   [ [2, 4], "q", "b" ],
  [ [0, 4], "kg", "b" ],  [ [0, 5], "b", "b" ],
  [ [0, 6], "kn", "b" ],  [ [0, 7], "r", "b" ],
  [ [1, 0], "p", "b" ],   [ [1, 1], "p", "b" ],
  [ [1, 2], "p", "b" ],  [ [1, 3], "p", "b" ],
  [ [1, 4], "p", "b" ],  [ [1, 5], "p", "b" ],
  [ [1, 6], "p", "b" ],  [ [1, 7], "p", "b" ],
  [ [6, 0], "p", "w" ],  [ [6, 1], "p", "w" ],
  [ [6, 2], "p", "w" ],  [ [6, 3], "p", "w" ],
  [ [6, 4], "p", "w" ],  [ [6, 5], "p", "w" ],
  [ [6, 6], "p", "w" ],  [ [6, 7], "p", "w" ],
  [ [7, 0], "r", "w" ],  [ [7, 1], "kn", "w" ],
  [ [7, 2], "b", "w" ],  [ [7, 3], "q", "w" ],
  [ [7, 4], "kg", "w" ], [ [3, 5], "b", "w" ],
  [ [4, 2], "kn", "w" ], [ [7, 7], "r", "w" ]
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
      moveSet: [[[1, 0], [2, 0]], [[-1, 0], [-2, 0]]],
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

  const [gameState, setGameState] = useState({
    currentTurn: "b",
    currentPiece: undefined,

    // currentlyEnPassantable should be set to undefined when the turn comes back to 
    // the player that moved their pawn and caused the currentlyEnPassantable to be not undefined
    currentlyEnPassantable: undefined,
    validPositions: [],
    deadPieces: [[], []]
  });

  useEffect(() => {
    if (gameState.currentPiece !== undefined && gameState.currentPiece[2] === gameState.currentTurn) {
      markValidPositions();
    } else {
      setGameState({
        ...gameState,
        currentPiece: undefined,
        validPositions: []
      });
    }
  }, [gameState.currentPiece]);

  const markValidPositions = () => {
    // pawns should have the choice of moving one or two spaces ON THE FIRST MOVE,
    // but after, only one move per space

    const piece = gameState.currentPiece;

    const pieceTraits = pieceCharacteristics[piece[1]];

    const validMoves = [];

    if (pieceTraits.moveMoreThanOneBlock) {
      addPositions(validMoves, pieceTraits.moveSet, piece[0], true);
    } else {
      piece[1] === "p" ? (
        piece[2] === "b" ? (
          addPositions(validMoves, pieceTraits.moveSet[0], piece[0])
        ) : (
          addPositions(validMoves, pieceTraits.moveSet[1], piece[0])
        )
      ) : (
        addPositions(validMoves, pieceTraits.moveSet, piece[0])
      )
    }

    setGameState({
      ...gameState,
      validPositions: validMoves
    })
  };

  const setCurrentPiece = (pos, isMarked) => {
    if (isMarked) {
      const newBoard = [...boardState];

      const currentPieceInd = newBoard.findIndex((arr) => indexPiece(arr[0]) === indexPiece(gameState.currentPiece[0]));

      newBoard.splice(currentPieceInd, 1);

      const targetTileInd = newBoard.findIndex((arr) => indexPiece(arr[0]) === indexPiece(pos));

      const newDeadPieces = [...gameState.deadPieces];

      if (targetTileInd !== -1) {
        const newArr = newBoard[targetTileInd];

        gameState.currentTurn === "b" ? (newDeadPieces[1].push(newArr)) : (newDeadPieces[0].push(newArr));

        newBoard.splice(targetTileInd, 1);
      }

      setGameState({
        ...gameState,
        currentTurn: gameState.currentTurn === "b" ? ("w") : ("b"),
        currentPiece: undefined,
        deadPieces: newDeadPieces
      });

      setBoardState([
        ...newBoard,
        [pos, ...gameState.currentPiece.slice(1)]
      ]);
    } else {
      setGameState({
        ...gameState,
        currentPiece: findPiece(indexPiece(pos))
      });
    }
  };

  const addPositions = (endArr, moves, pos, isRecursion = false) => {
    if (isRecursion) {
      moves.forEach((move) => {
        const newPos = [move[0] + pos[0], move[1] + pos[1]];

        if (isValidMove(newPos)) {
          endArr.push(indexPiece(newPos));

          if (findPiece(indexPiece(newPos))!== undefined && findPiece(indexPiece(newPos))[2] !== gameState.currentTurn) {
            return;
          }
          
          addPositions(endArr, [move], newPos, isRecursion);
        }
      });
    } else {
      moves.forEach((move) => {
        const newPos = [move[0] + pos[0], move[1] + pos[1]];
  
        if (isValidMove(newPos)) {
          endArr.push(indexPiece(newPos));
        }
      });
    }
  };

  const isOpposingPieceOrEmpty = (pos) => {
    const foundPiece = findPiece(indexPiece(pos));

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

  const findPiece = (index) => (
    boardState.find((piece) => indexPiece(piece[0]) === index)
  );

  return (
    <div className="chess-container">
      <header>
        <ul className="dead-pieces">{
          gameState.deadPieces[0].map((piece, ind) => (
            <Piece
              key={ind}
              icon={pieceCharacteristics[piece[1]].chessPiece}
              color={piece[2]}
            />
          ))
        }</ul>
      </header>
      <ul className="chess-board flex-center">{
        [...Array(8)].map((item, ind) => (
          <li className="row flex-center" key={ind}>{
              [...Array(8)].map((item, i) => {
                const index = indexPiece([ind, i]);

                let piece = findPiece(index);

                const isMarked = gameState.validPositions.includes(index);

                return (
                  <div className={`${isMarked ? ("mark") : ("")} block flex-center`} key={i} onClick={(e) => setCurrentPiece([ind, i], isMarked)}>{
                    piece !== undefined ? (
                      <Piece
                        icon={pieceCharacteristics[piece[1]].chessPiece}
                        color={piece[2]}
                      />
                    ) : (null)
                  }</div>
                );
              })
          }</li>
        ))
      }</ul>
      <footer>
        <ul className="dead-pieces flex-center">{
          gameState.deadPieces[1].map((piece, ind) => (
            <Piece
              key={ind}
              icon={pieceCharacteristics[piece[1]].chessPiece}
              color={piece[2]}
            />
          ))
        }</ul>
      </footer>
    </div>
  );
};

export default App;



