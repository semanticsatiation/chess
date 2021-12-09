import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChessBishop, faChessKing, faChessPawn, faChessKnight, faChessRook, faChessQueen} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';

function Piece({piece}) {
    const [pieceType] = useState(piece[1]);

    const renderPiece = () => {
        let chessPiece = faChessPawn;

        switch (pieceType) {
        case 'r':
            chessPiece = faChessRook;
            break;
        case 'kn':
            chessPiece = faChessKnight;
            break;
        case 'b':
            chessPiece = faChessBishop;
            break;
        case 'q':
            chessPiece = faChessQueen;
            break;
        case 'kg':
            chessPiece = faChessKing;
            break;
        default:
            break;
        }
    
        return (
            <FontAwesomeIcon 
                className={`${piece[2] === "b" ? ("black") : ("white")}`}
                icon={chessPiece}
            />
        )
    }


    return (
        renderPiece()
    );
}

export default Piece;