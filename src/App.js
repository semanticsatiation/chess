import { useEffect, useState } from 'react';
import Piece from './components/piece';
import './stylesheets/chess.css';
import { faChessBishop, faChessKing, faChessPawn, faChessKnight, faChessRook, faChessQueen} from '@fortawesome/free-solid-svg-icons';

const defaultBoard = [
  [ [0, 0], 'r', 'b', '1' ],   [ [0, 1], 'kn', 'b', '1' ],
  [ [0, 2], 'b', 'b', '1' ],   [ [5, 4], 'q', 'b', '1' ],
  [ [0, 4], 'kg', 'b', '1' ],  [ [0, 5], 'b', 'b', '2' ],
  [ [0, 6], 'kn', 'b', '2' ],  [ [0, 7], 'r', 'b', '2' ],
  [ [1, 0], 'p', 'b', '1' ],   [ [1, 1], 'p', 'b', '1' ],
  [ [1, 2], 'p', 'b', '1' ],  [ [1, 3], 'p', 'b', '1' ],
  [ [1, 4], 'p', 'b', '1' ],  [ [1, 5], 'p', 'b', '1' ],
  [ [1, 6], 'p', 'b', '1' ],  [ [1, 7], 'p', 'b', '1' ],
  [ [6, 0], 'p', 'w', '1' ],  [ [6, 1], 'p', 'w', '1' ],
  [ [6, 2], 'p', 'w', '1' ],  [ [6, 3], 'p', 'w', '1' ],
  [ [6, 4], 'p', 'w', '1' ],  [ [6, 5], 'p', 'w', '1' ],
  [ [6, 6], 'p', 'w', '1' ],  [ [6, 7], 'p', 'w', '1' ],
  [ [7, 0], 'r', 'w', '1' ],  [ [7, 1], 'kn', 'w', '1' ],
  [ [7, 2], 'b', 'w', '1' ],  [ [7, 3], 'q', 'w', '1' ],
  [ [7, 4], 'kg', 'w', '1' ], [ [7, 5], 'b', 'w', '2' ],
  [ [7, 6], 'kn', 'w', '2' ], [ [7, 7], 'r', 'w', '2' ]
];

const pieceCharacteristics = {
  "r": {
      moveSet: [[-1, 0], [1, 0], [0, -1], [0, 1]],
      chessPiece: faChessRook,
      moveMoreThanOneBlock: true
  },
  "kn": {
      moveSet: [[2, 1], [-2, -1], [-2, 1], [2, -1]],
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
)

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

    // if (pieceTraits.moveMoreThanOneBlock === false) {
    //   markValidPositions();
    // } else {
      piece[1] === "p" ? (
        piece[2] === "b" ? (
          addPositions(validMoves, pieceTraits.moveSet[0], piece[0])
        ) : (
          addPositions(validMoves, pieceTraits.moveSet[1], piece[0])
        )
      ) : (
        addPositions(validMoves, pieceTraits.moveSet, piece[0])
      )
    // }

    setGameState({
      ...gameState,
      validPositions: validMoves
    })
  };

  const setCurrentPiece = (pos, isMarked) => {
    // we can not select tiles pieces that are not ours
    // if we already have a current piece, this is telling us the player is trying to 
    // trying to make a move and so if they select another tile, we set the new pos
    // and if the pos has an enemy, delete the enemy from the board and set the current piece's 
    // pos as that ALSO kings can not be landed on!!!

    if (isMarked) {
      setGameState({
        ...gameState,
        currentTurn: gameState.currentTurn === "b" ? ("w") : ("b"),
        currentPiece: undefined,
      });

      const newBoard = [...boardState];

      // WHEN ATTACKING AN OPPONENT PIECE, REMOVE FROM BOARD, THROW IN DEAD ARRAY (black screenLeft, white, right)

      const posInd = newBoard.findIndex((arr) => indexPiece(arr[0]) === indexPiece(gameState.currentPiece[0]));

      const newArr = newBoard[posInd];

      newBoard.splice(posInd, 1);
      newArr.splice(0, 1);

      
      setBoardState([
        ...newBoard,
        [pos, ...newArr]
      ]);
    } else {
      setGameState({
        ...gameState,
        currentPiece: findPiece(indexPiece(pos))
      });
    }
  };

  const addPositions = (arr, moves, pos) => {
    // i need to do RECURSION somewhere around here

    moves.forEach((move) => {
      const newPos = [move[0] + pos[0], move[1] + pos[1]];

      if (isValidMove(newPos)) {
        arr.push(indexPiece(newPos));
      }
    })
  }

  const isValidMove = (pos) => {
    if ((pos[0] > 7 && pos[1] > 7 || pos[0] < 0 && pos[1] < 0) || (boardState.some((piece) => ((indexPiece(piece[0]) === indexPiece(pos) && piece[2] === gameState.currentTurn) || piece[1] === "kg")))) {
      return false;
    }

  

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



    return true;
  };

  const findPiece = (index) => (
    boardState.find((piece) => indexPiece(piece[0]) === index)
  );

  return (
    <ul className="chess-board center">{
      [...Array(8)].map((item, ind) => (
        <li className="row center" key={ind}>{
            [...Array(8)].map((item, i) => {
              const index = indexPiece([ind, i]);

              let piece = findPiece(index);

              const isMarked = gameState.validPositions.includes(index);

              return (
                <div className={`${isMarked ? ("mark") : ("")} block center`} key={i} onClick={(e) => setCurrentPiece([ind, i], isMarked)}>{
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
  );
};

export default App;



